import React, { useState, useEffect } from 'react';
import { Plan } from '../types';
import { PlanService } from '../services/planService';
import { Calendar, AlertCircle, TrendingUp, ChevronLeft, ChevronRight, CreditCard, Music, Video, Cloud, ShoppingBag, Gamepad2, Zap, Smartphone, Globe } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    'video': Video,
    'music': Music,
    'cloud': Cloud,
    'shopping': ShoppingBag,
    'game': Gamepad2,
    'zap': Zap,
    'phone': Smartphone,
    'global': Globe,
};

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const PlanCalendar: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        const savedPlans = await PlanService.getPlans();
        setPlans(savedPlans);
        setLoading(false);
    };

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth); // 0 = Sunday

    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        setSelectedPlan(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        setSelectedPlan(null);
    };

    const getPlansForDay = (day: number) => {
        return plans.filter(p => {
            const d = new Date(p.nextPaymentDate);
            return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    };

    const calculateDaysRemaining = (dateStr: string) => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - t.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const totalCost = plans
        .filter(p => {
            const d = new Date(p.nextPaymentDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, curr) => acc + curr.price, 0);

    const activePlansCount = plans.length;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* Header */}
            <div className="z-10 flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                        <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Quản lý & Thanh toán</p>
                        <h1 className="text-lg font-normal tracking-tight text-stone-900">Tháng {currentMonth + 1}/{currentYear}</h1>
                        <p className="mt-0.5 text-sm text-stone-500">
                            Lịch thanh toán đăng ký — theo dõi plan đến hạn trong tháng
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-50"
                        aria-label="Tháng trước"
                    >
                        <ChevronLeft size={20} strokeWidth={1.5} />
                    </button>
                    <div className="h-6 w-px bg-stone-200" />
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-50"
                        aria-label="Tháng sau"
                    >
                        <ChevronRight size={20} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 gap-6 overflow-hidden p-6 lg:p-8">
                {/* Main Calendar */}
                <div className={`${cardClass} flex min-h-0 min-w-0 flex-1 flex-col p-6`}>
                    {loading ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-stone-500">
                            Đang tải lịch…
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 grid grid-cols-7">
                                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                                    <div
                                        key={i}
                                        className="text-center text-xs font-semibold uppercase tracking-wide text-stone-500"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid min-h-0 flex-1 grid-cols-7 auto-rows-fr gap-2">
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="min-h-0 bg-transparent" />
                                ))}

                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dayPlans = getPlansForDay(day);
                                    const today = new Date();
                                    const isToday =
                                        day === today.getDate() &&
                                        currentMonth === today.getMonth() &&
                                        currentYear === today.getFullYear();
                                    const hasPlans = dayPlans.length > 0;

                                    let cellBorder = 'border-stone-200/90 bg-white';
                                    let statusDot: React.ReactNode = null;

                                    if (hasPlans) {
                                        const nearest = dayPlans[0];
                                        const daysLeft = calculateDaysRemaining(nearest.nextPaymentDate);

                                        if (daysLeft < 3) {
                                            statusDot = <div className="h-2 w-2 shrink-0 rounded-full bg-rose-500 animate-pulse" />;
                                        } else if (daysLeft < 7) {
                                            statusDot = <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />;
                                        } else {
                                            statusDot = <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />;
                                        }

                                        cellBorder =
                                            'border-stone-300 bg-stone-50/80 cursor-pointer hover:bg-stone-100/80';
                                    } else if (isToday) {
                                        cellBorder = 'border-stone-300 bg-stone-50/60';
                                    }

                                    return (
                                        <div
                                            key={day}
                                            role={hasPlans ? 'button' : undefined}
                                            tabIndex={hasPlans ? 0 : undefined}
                                            onClick={() => hasPlans && setSelectedPlan(dayPlans[0])}
                                            onKeyDown={(e) => {
                                                if (hasPlans && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    setSelectedPlan(dayPlans[0]);
                                                }
                                            }}
                                            className={`flex min-h-[72px] flex-col justify-between rounded-xl border p-2 transition-colors ${cellBorder}`}
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <span
                                                    className={
                                                        isToday
                                                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-medium text-white'
                                                            : 'text-sm font-medium text-stone-600'
                                                    }
                                                >
                                                    {day}
                                                </span>
                                                {statusDot}
                                            </div>
                                            <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                                                {dayPlans.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="truncate rounded-md border border-stone-200 bg-white px-1 py-0.5 text-[10px] text-stone-700"
                                                    >
                                                        {p.website}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="flex w-full shrink-0 flex-col gap-6 lg:w-80">
                    <div className="rounded-2xl border border-stone-800/90 bg-stone-900 p-6 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                        <div className="mb-4 flex items-center gap-2 text-stone-400">
                            <TrendingUp size={18} strokeWidth={1.5} />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                Thanh toán tháng này
                            </span>
                        </div>
                        <div className="mb-6">
                            <div className="text-3xl font-semibold tracking-tight">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                    totalCost
                                )}
                            </div>
                            <div className="mt-1 text-sm text-stone-400">Dựa trên các plan đến hạn</div>
                        </div>
                        <div className="flex justify-between border-t border-stone-700/80 pt-4">
                            <div>
                                <div className="text-2xl font-semibold">{activePlansCount}</div>
                                <div className="mt-0.5 text-xs font-medium text-stone-400">
                                    Tổng plan đang đăng ký
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${cardClass} relative flex flex-1 flex-col p-6`}>
                        <h3 className="mb-4 text-sm font-medium text-stone-900">Chi tiết Plan</h3>
                        {selectedPlan ? (
                            <div className="animate-fade-in space-y-4">
                                <div className="mb-2 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                                        {(() => {
                                            const IconComp = ICON_MAP[selectedPlan.icon] || Globe;
                                            return <IconComp size={22} className="text-stone-500" strokeWidth={1.5} />;
                                        })()}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            Dịch vụ
                                        </label>
                                        <div className="text-lg font-medium leading-tight text-stone-900">
                                            {selectedPlan.website}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Số tiền
                                    </label>
                                    <div className="font-mono text-xl font-medium text-stone-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                            selectedPlan.price
                                        )}
                                    </div>
                                </div>

                                {selectedPlan.cardInfo && (
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            Thẻ thanh toán
                                        </label>
                                        <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
                                            <CreditCard size={16} className="text-stone-400" /> {selectedPlan.cardInfo}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Email
                                    </label>
                                    <div className="truncate text-sm text-stone-600">{selectedPlan.email || '—'}</div>
                                </div>

                                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-stone-500" />
                                        <span className="text-sm font-medium text-stone-800">Trạng thái hạn thanh toán</span>
                                    </div>
                                    {(() => {
                                        const days = calculateDaysRemaining(selectedPlan.nextPaymentDate);
                                        if (days < 0)
                                            return (
                                                <div className="text-sm font-semibold text-rose-600">
                                                    Đã quá hạn {Math.abs(days)} ngày
                                                </div>
                                            );
                                        if (days <= 3)
                                            return (
                                                <div className="text-sm font-semibold text-rose-600">
                                                    Sắp hết hạn: còn {days} ngày
                                                </div>
                                            );
                                        if (days <= 7)
                                            return (
                                                <div className="text-sm font-medium text-amber-700">
                                                    Lưu ý: còn {days} ngày
                                                </div>
                                            );
                                        return (
                                            <div className="text-sm font-medium text-emerald-700">Còn {days} ngày</div>
                                        );
                                    })()}
                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                                        {(() => {
                                            const days = calculateDaysRemaining(selectedPlan.nextPaymentDate);
                                            const percentage = Math.max(0, Math.min(100, (30 - days) * 3.33));
                                            let color = 'bg-emerald-500';
                                            if (days <= 7) color = 'bg-amber-500';
                                            if (days <= 3) color = 'bg-rose-500';

                                            return <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-stone-400">
                                Chọn một ngày có dấu chấm màu trên lịch để xem chi tiết.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanCalendar;
