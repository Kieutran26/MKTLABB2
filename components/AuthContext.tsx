import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import {
    User,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

export type SubscriptionTier = 'free' | 'pro' | 'promax';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    tier: SubscriptionTier;
    signInWithGoogle: () => Promise<void>;
    signOutUser: () => Promise<void>;
    setTier: (t: SubscriptionTier) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [tier, setTier] = useState<SubscriptionTier>('free');

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (!isFirebaseConfigured || !auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                console.error('Google sign-in error:', err);
                throw err;
            }
        }
    }, []);

    const signOutUser = useCallback(async () => {
        if (!isFirebaseConfigured || !auth) return;
        await signOut(auth);
    }, []);

    // Dev: cho phép console gọi window.__authTier('promax') để test UI (chỉ ảnh hưởng tier trong AuthContext).
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as Window & {
            __authTier?: (t: SubscriptionTier) => void;
            __MKT_DEV?: { setAuthTier: (t: SubscriptionTier) => void };
        };
        const set = (t: SubscriptionTier) => {
            setTier(t);
            console.info('[dev] AuthContext.tier →', t, '(PESTEL/STP còn đọc profile Supabase nếu có)');
        };
        w.__authTier = set;
        w.__MKT_DEV = { ...w.__MKT_DEV, setAuthTier: set };
        return () => {
            delete w.__authTier;
            if (w.__MKT_DEV?.setAuthTier === set) {
                delete w.__MKT_DEV.setAuthTier;
                if (Object.keys(w.__MKT_DEV).length === 0) delete w.__MKT_DEV;
            }
        };
    }, []);

        return (
            <AuthContext.Provider value={{ user, loading, tier, signInWithGoogle, signOutUser, setTier }}>
                {children}
            </AuthContext.Provider>
        );
};
