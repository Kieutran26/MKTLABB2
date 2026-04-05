import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, Trash2, Plus, BellRing, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Reminder {
    id: string;
    task: string;
    time: Date;
    notified: boolean;
}

const OneTimeReminder: React.FC = () => {
    const [task, setTask] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const permissionRef = useRef(false); // Use ref to access in interval

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            const granted = Notification.permission === 'granted';
            setPermissionGranted(granted);
            permissionRef.current = granted;
        }
    }, []);

    // Load reminders from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('one_time_reminders');
        if (saved) {
            const parsed = JSON.parse(saved).map((r: any) => ({
                ...r,
                time: new Date(r.time)
            }));
            setReminders(parsed.filter((r: Reminder) => !r.notified));
        }
    }, []);

    // Save reminders to localStorage
    useEffect(() => {
        localStorage.setItem('one_time_reminders', JSON.stringify(reminders));
    }, [reminders]);

    // Play alert sound
    const playAlertSound = useCallback(() => {
        try {
            // Create audio context for alert sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();

            // Beep pattern: beep-beep-beep
            setTimeout(() => { gainNode.gain.value = 0; }, 150);
            setTimeout(() => { gainNode.gain.value = 0.3; }, 250);
            setTimeout(() => { gainNode.gain.value = 0; }, 400);
            setTimeout(() => { gainNode.gain.value = 0.3; }, 500);
            setTimeout(() => { gainNode.gain.value = 0; }, 650);
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 700);
        } catch (e) {
            console.log('Audio not supported');
        }
    }, []);

    const showNotification = useCallback((taskName: string) => {
        console.log('🔔 Firing notification for:', taskName);

        // Play alert sound
        playAlertSound();

        // Show toast (always works)
        toast.success(`⏰ ${taskName}`, {
            duration: 15000,
            style: {
                borderRadius: '8px',
                background: '#fef3c7',
                border: '2px solid #f59e0b',
                fontWeight: 600,
                fontSize: '16px',
                padding: '16px 20px'
            },
            icon: '🔔'
        });

        // Try browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification('⏰ Nhắc Việc - OptiMKT', {
                    body: taskName,
                    icon: '/favicon.ico',
                    tag: 'reminder-' + Date.now(),
                    requireInteraction: true,
                    silent: false
                });
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (e) {
                console.error('Notification error:', e);
            }
        }

        // Also flash the page title
        let originalTitle = document.title;
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            document.title = flashCount % 2 === 0 ? `⏰ ${taskName}` : originalTitle;
            flashCount++;
            if (flashCount > 10) {
                clearInterval(flashInterval);
                document.title = originalTitle;
            }
        }, 500);
    }, [playAlertSound]);


    // Check for due reminders every second
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const now = new Date();
            setReminders(prev => {
                let updated = false;
                const newReminders = prev.map(r => {
                    if (!r.notified && r.time.getTime() <= now.getTime()) {
                        // Fire notification
                        showNotification(r.task);
                        updated = true;
                        return { ...r, notified: true };
                    }
                    return r;
                });
                return updated ? newReminders.filter(r => !r.notified) : prev;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [showNotification]);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';
            setPermissionGranted(granted);
            permissionRef.current = granted;
            if (granted) {
                toast.success('Đã bật thông báo!', { icon: '🔔' });
                // Test notification immediately
                new Notification('✅ Thông báo đã bật!', {
                    body: 'Bạn sẽ nhận được nhắc việc khi đến giờ.',
                    icon: '/favicon.ico'
                });
            } else {
                toast.error('Không thể bật thông báo. Vui lòng cấp quyền trong cài đặt trình duyệt.');
            }
        }
    };


    const handleAddReminder = () => {
        if (!task.trim()) {
            toast.error('Vui lòng nhập việc cần nhắc!');
            return;
        }
        if (!date || !time) {
            toast.error('Vui lòng chọn ngày và giờ!');
            return;
        }

        const reminderTime = new Date(`${date}T${time}`);
        if (reminderTime <= new Date()) {
            toast.error('Thời gian phải ở tương lai!');
            return;
        }

        const newReminder: Reminder = {
            id: Date.now().toString(),
            task: task.trim(),
            time: reminderTime,
            notified: false
        };

        setReminders(prev => [...prev, newReminder]);
        setTask('');
        setDate('');
        setTime('');
        toast.success('Đã thêm nhắc việc!', { icon: '✅' });
    };

    const handleDelete = (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success('Đã xóa!', { icon: '🗑️' });
    };

    const formatTimeRemaining = (time: Date): string => {
        const now = new Date();
        const diff = time.getTime() - now.getTime();

        if (diff <= 0) return 'Sắp đến';

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày ${hours % 24} giờ`;
        if (hours > 0) return `${hours} giờ ${minutes % 60} phút`;
        return `${minutes} phút`;
    };

    const formatDateTime = (time: Date): string => {
        return time.toLocaleString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-full bg-slate-50 p-8">
            <Toaster position="top-center" />
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Nhắc Việc Một Lần</h1>
                            <p className="text-sm text-slate-500">One-time Reminder</p>
                        </div>
                    </div>
                </div>

                {/* Notification Permission Banner */}
                {!permissionGranted && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} className="text-amber-600" />
                            <p className="text-sm text-amber-800">
                                Cần quyền thông báo để nhắc việc khi bạn ở tab khác
                            </p>
                        </div>
                        <button
                            onClick={requestPermission}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-all"
                        >
                            Bật Thông Báo
                        </button>
                    </div>
                )}

                {/* Add Reminder Form */}
                <div className="bg-white border border-slate-100 rounded-xl p-6 mb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Việc cần nhắc</label>
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="VD: Họp với team marketing..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={today}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Giờ</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAddReminder}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Thêm Nhắc Việc
                        </button>
                    </div>
                </div>

                {/* Reminders List */}
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" />
                            <span className="font-medium text-slate-900">Đang chờ nhắc</span>
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                            {reminders.length} việc
                        </span>
                    </div>

                    {reminders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <BellRing size={24} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-sm">Chưa có nhắc việc nào</p>
                            <p className="text-slate-400 text-xs mt-1">Thêm việc cần nhắc ở trên</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {reminders
                                .sort((a, b) => a.time.getTime() - b.time.getTime())
                                .map(reminder => (
                                    <div key={reminder.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{reminder.task}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500">{formatDateTime(reminder.time)}</span>
                                                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                                                    {formatTimeRemaining(reminder.time)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(reminder.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-sm text-slate-600">
                        💡 <strong>Lưu ý:</strong> Nhắc việc sẽ hiển thị thông báo trên trình duyệt khi đến giờ.
                        Hãy giữ tab mở để nhận nhắc việc. Dữ liệu được lưu trên thiết bị của bạn.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OneTimeReminder;
