
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

    // Navigation functions
    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        setSelectedPlan(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        setSelectedPlan(null);
    };

    // Helpers
    const getPlansForDay = (day: number) => {
        return plans.filter(p => {
            const d = new Date(p.nextPaymentDate);
            // Compare full date for the specific scheduled payment
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

    // Calculate total cost for the displayed month
    const totalCost = plans
        .filter(p => {
            const d = new Date(p.nextPaymentDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, curr) => acc + curr.price, 0);

    // Count active plans (total in database, not just this month)
    const activePlansCount = plans.length;

    return (
        <div className="h-screen pt-4 pb-4 px-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Calendar className="text-stone-700" />
                    <span>Tháng {currentMonth + 1}/{currentYear}</span>
                </h2>

                <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-stone-200 p-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="w-px h-6 bg-stone-200"></div>
                    <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-8 overflow-hidden">
                {/* Main Calendar Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 p-6 flex flex-col">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                            <div key={i} className="text-center font-bold text-stone-400 text-sm uppercase">{day}</div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-2">
                        {/* Empty cells for start of month */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-transparent"></div>
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayPlans = getPlansForDay(day);
                            const today = new Date();
                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                            const hasPlans = dayPlans.length > 0;

                            // Determine color based on nearest due plan
                            let bgClass = isToday ? 'bg-stone-100 border-stone-300' : 'bg-white border-stone-100';
                            let statusDot = null;

                            if (hasPlans) {
                                const nearest = dayPlans[0];
                                const daysLeft = calculateDaysRemaining(nearest.nextPaymentDate);

                                if (daysLeft < 3) statusDot = <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                else if (daysLeft < 7) statusDot = <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                else statusDot = <div className="w-2 h-2 rounded-full bg-green-500"></div>

                                bgClass = "bg-stone-50 border-stone-400 cursor-pointer hover:bg-stone-100 ring-1 ring-stone-200";
                            }

                            return (
                                <div
                                    key={day}
                                    onClick={() => hasPlans && setSelectedPlan(dayPlans[0])}
                                    className={`border rounded-xl p-2 flex flex-col justify-between transition-all ${bgClass}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-semibold ${isToday ? 'bg-black text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-stone-500'}`}>
                                            {day}
                                        </span>
                                        {statusDot}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                                        {dayPlans.map(p => (
                                            <div key={p.id} className="text-[10px] truncate bg-white border border-stone-200 rounded px-1 py-0.5 flex items-center gap-1">
                                                {p.website}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Statistics */}
                <div className="w-80 flex flex-col gap-6">
                    {/* Summary Card */}
                    <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4 text-stone-400">
                            <TrendingUp size={20} />
                            <span className="text-sm font-medium uppercase tracking-wider">Thanh toán tháng này</span>
                        </div>
                        <div className="mb-6">
                            <div className="text-4xl font-bold">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost)}
                            </div>
                            <div className="text-stone-400 text-sm mt-1">Dựa trên các plan đến hạn</div>
                        </div>
                        <div className="pt-4 border-t border-stone-700 flex justify-between">
                            <div>
                                <div className="text-2xl font-bold">{activePlansCount}</div>
                                <div className="text-xs text-stone-400">Tổng Plans Đang Đăng Ký</div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Plan Detail */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex-1 p-6 relative">
                        <h3 className="font-bold text-stone-800 mb-4">Chi tiết Plan</h3>
                        {selectedPlan ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                                        {(() => {
                                            const IconComp = ICON_MAP[selectedPlan.icon] || Globe;
                                            return <IconComp size={24} className="text-stone-700" />
                                        })()}
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 uppercase font-bold">Dịch vụ</label>
                                        <div className="text-xl font-bold text-stone-900 leading-tight">{selectedPlan.website}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-stone-400 uppercase font-bold">Số tiền</label>
                                    <div className="text-2xl font-mono">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPlan.price)}
                                    </div>
                                </div>

                                {selectedPlan.cardInfo && (
                                    <div>
                                        <label className="text-xs text-stone-400 uppercase font-bold">Thẻ thanh toán</label>
                                        <div className="flex items-center gap-2 text-stone-700 font-medium">
                                            <CreditCard size={16} /> {selectedPlan.cardInfo}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-stone-400 uppercase font-bold">Email</label>
                                    <div className="text-stone-600 truncate">{selectedPlan.email || '---'}</div>
                                </div>

                                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={16} className="text-stone-500" />
                                        <span className="font-semibold text-sm">Trạng thái hạn thanh toán</span>
                                    </div>
                                    {(() => {
                                        const days = calculateDaysRemaining(selectedPlan.nextPaymentDate);
                                        if (days < 0) return <div className="text-red-600 font-bold">Đã quá hạn {Math.abs(days)} ngày!</div>;
                                        if (days <= 3) return <div className="text-red-500 font-bold">Sắp hết hạn: Còn {days} ngày</div>;
                                        if (days <= 7) return <div className="text-yellow-600 font-medium">Lưu ý: Còn {days} ngày</div>;
                                        return <div className="text-green-600 font-medium">Còn {days} ngày</div>;
                                    })()}
                                    {/* Color Range Indicator */}
                                    <div className="w-full h-2 bg-stone-200 rounded-full mt-2 overflow-hidden">
                                        {(() => {
                                            const days = calculateDaysRemaining(selectedPlan.nextPaymentDate);
                                            // Simple visual logic
                                            const percentage = Math.max(0, Math.min(100, (30 - days) * 3.33));
                                            let color = 'bg-green-500';
                                            if (days <= 7) color = 'bg-yellow-500';
                                            if (days <= 3) color = 'bg-red-500';

                                            return <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-stone-400 text-sm">
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
