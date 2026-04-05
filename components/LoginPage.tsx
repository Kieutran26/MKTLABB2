import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

interface LoginPageProps {
    onBack?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack }) => {
    const { signInWithGoogle, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleGoogleSignIn = async () => {
        if (!isFirebaseConfigured) {
            setError('Firebase chưa được cấu hình. Vui lòng thêm VITE_FIREBASE_* vào .env.local');
            return;
        }
        setError(null);
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <div className="min-h-full bg-[#FCFDFC] font-sans text-stone-900 flex flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
                <div className="w-full max-w-sm">

                    {/* Logo mark */}
                    <div className="mb-8 flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200/90 bg-white text-stone-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 4L4 9V19L14 24L24 19V9L14 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M4 9L14 14L24 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M14 14V24" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="mb-8 text-center">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                            OptiMKT
                        </p>
                        <h1 className="mb-3 text-2xl font-normal tracking-tight text-stone-900">
                            Đăng nhập
                        </h1>
                        <p className="text-sm leading-relaxed text-stone-500">
                            Sử dụng tài khoản Google để truy cập OptiMKT — nền tảng AI marketing toàn diện.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Google Sign-In Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn || loading}
                        className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50 disabled:opacity-60"
                    >
                        {isSigningIn ? (
                            <Loader2 size={18} className="animate-spin text-stone-400" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                        )}
                        {isSigningIn ? 'Đang đăng nhập...' : 'Tiếp tục với Google'}
                    </button>

                    {/* Firebase not configured warning */}
                    {!isFirebaseConfigured && (
                        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
                            <p className="mb-1 font-medium text-stone-600">⚠️ Firebase chưa được cấu hình</p>
                            Thêm các biến <code className="rounded bg-white px-1 py-0.5 font-mono text-stone-700">VITE_FIREBASE_*</code> vào file{' '}
                            <code className="rounded bg-white px-1 py-0.5 font-mono text-stone-700">.env.local</code> để kích hoạt đăng nhập.
                        </div>
                    )}

                    {/* Back button */}
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 w-full rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
                        >
                            Quay lại
                        </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-6 text-center text-xs text-stone-400">
                Bằng cách đăng nhập, bạn đồng ý với{' '}
                <span className="underline underline-offset-2">Điều khoản sử dụng</span> và{' '}
                <span className="underline underline-offset-2">Chính sách bảo mật</span> của OptiMKT.
            </div>
        </div>
    );
};

export default LoginPage;
