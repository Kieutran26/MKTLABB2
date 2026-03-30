import React, { useEffect, useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { campaignService, EmailCampaign } from '../../services/campaignService';

interface ScheduledCampaignsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScheduledCampaignsModal: React.FC<ScheduledCampaignsModalProps> = ({ isOpen, onClose }) => {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    useEffect(() => {
        if (isOpen) {
            loadCampaigns();
        }
    }, [isOpen]);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const data = await campaignService.getAllCampaigns();
            // Filter only campaigns that have a scheduled date
            // We include 'draft' status if they have a scheduled date, as per previous fix
            const scheduled = data.filter(c => c.scheduled_at);
            setCampaigns(scheduled);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNow = async (id: string) => {
        if (!confirm('Bạn có muốn chuyển đến trang quản lý để gửi chiến dịch này ngay không?')) return;
        // Ideally navigating to the campaign manager would be best, but for now just close
        // so user can go there. Or we can just let them know.
        onClose();
    };

    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const prevMonthDays = new Date(year, month, 0).getDate();

        const daysArray = [];

        // Previous month padding (Monday based, so if Sunday (0), padding is 6. if Mon (1), padding is 0)
        // Adjust for Monday start: 0->6, 1->0, 2->1 ...
        // Logic: if 0 (Sun) -> 6 days padding (Mon-Sat)
        // if 1 (Mon) -> 0 padding
        const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            daysArray.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
        }

        // Current month
        for (let i = 1; i <= days; i++) {
            daysArray.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }

        // Next month padding
        const remaining = 42 - daysArray.length; // 6 rows * 7 cols
        for (let i = 1; i <= remaining; i++) {
            daysArray.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }

        return daysArray;
    };

    const days = getDaysInMonth(currentDate);

    const getCampaignsForDate = (date: Date) => {
        return campaigns.filter(c => {
            if (!c.scheduled_at) return false;
            const cDate = new Date(c.scheduled_at);
            return cDate.getDate() === date.getDate() &&
                cDate.getMonth() === date.getMonth() &&
                cDate.getFullYear() === date.getFullYear();
        });
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const selectedCampaigns = selectedDate ? getCampaignsForDate(selectedDate) : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Lịch chiến dịch</h2>
                            <p className="text-sm text-gray-500">Xem và quản lý các chiến dịch đã lên lịch</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Calendar Section */}
                    <div className="flex-1 p-6 border-r overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">
                                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                <div key={d} className="text-center text-sm font-semibold text-gray-500 py-2">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {days.map((d, index) => {
                                const dayCampaigns = getCampaignsForDate(d.date);
                                const isSelected = selectedDate &&
                                    d.date.getDate() === selectedDate.getDate() &&
                                    d.date.getMonth() === selectedDate.getMonth() &&
                                    d.date.getFullYear() === selectedDate.getFullYear();
                                const isToday = new Date().toDateString() === d.date.toDateString();

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(d.date)}
                                        className={`
                                            h-24 p-2 border rounded-lg flex flex-col items-start justify-start relative transition-all
                                            ${d.currentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                                            ${isSelected ? 'ring-2 ring-indigo-600 z-10' : 'hover:border-indigo-300'}
                                            ${isToday ? 'bg-indigo-50/30' : ''}
                                        `}
                                    >
                                        <span className={`text-sm font-medium ${isToday ? 'text-indigo-600' : ''}`}>{d.day}</span>
                                        <div className="flex flex-wrap gap-1 mt-1 w-full">
                                            {dayCampaigns.map(c => (
                                                <div
                                                    key={c.id}
                                                    className={`w-2 h-2 rounded-full ${c.status === 'sent' ? 'bg-green-500' : c.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-400'}`}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                        {dayCampaigns.length > 0 && (
                                            <div className="mt-auto self-end text-xs font-semibold text-gray-500">
                                                {dayCampaigns.length}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-80 bg-gray-50 p-6 overflow-y-auto border-l">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {selectedDate ? `Ngày ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}` : 'Chi tiết'}
                        </h3>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Đang tải...</div>
                        ) : selectedCampaigns.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg">
                                Không có chiến dịch nào trong ngày này
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedCampaigns.map(c => (
                                    <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`px-2 py-1 rounded text-xs font-medium uppercase
                                                ${c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                    c.status === 'sent' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'}`}>
                                                {c.status === 'scheduled' ? 'Đã lên lịch' : c.status === 'sent' ? 'Đã gửi' : 'Bản nháp'}
                                            </div>
                                            {c.status === 'draft' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSendNow(c.id); }}
                                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                                    title="Gửi ngay (Vào Quản lý để thực hiện)"
                                                >
                                                    <Play size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-900 line-clamp-1 mb-1" title={c.name}>{c.name}</h4>
                                        <div className="text-sm text-gray-600 mb-2 line-clamp-1" title={c.subject}>{c.subject}</div>

                                        <div className="flex items-center text-xs text-gray-500 gap-2 mt-3 pt-3 border-t border-gray-50">
                                            <Clock size={14} />
                                            <span>
                                                {c.scheduled_at
                                                    ? new Date(c.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                                    : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
