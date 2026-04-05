import React, { useState, useEffect } from 'react';
import { Trash2, Plus, CreditCard, X, Music, Video, Cloud, ShoppingBag, Gamepad2, Zap, Smartphone, Globe, Edit2, Eye, Calendar, Mail } from 'lucide-react';
import { Plan } from '../types';
import { PlanService } from '../services/planService';

// Icon mapping for selection
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

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const PlanList: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [website, setWebsite] = useState('');
    const [price, setPrice] = useState('');
    const [email, setEmail] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [nextDate, setNextDate] = useState('');
    const [cardInfo, setCardInfo] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('global');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        const savedPlans = await PlanService.getPlans();
        setPlans(savedPlans);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn chắc chắn muốn xóa gói đăng ký này?')) {
            const success = await PlanService.deletePlan(id);
            if (success) {
                setPlans(plans.filter(p => p.id !== id));
                if (viewingPlan?.id === id) setViewingPlan(null);
            }
        }
    };

    const handleSave = async () => {
        if (!website || !price || !nextDate) return;

        const newPlan: Plan = {
            id: editingPlanId || Date.now().toString(),
            website,
            price: Number(price),
            currency: 'VNĐ',
            email,
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            nextPaymentDate: nextDate,
            cardInfo,
            billingCycle: 'monthly',
            icon: selectedIcon
        };

        const success = await PlanService.savePlan(newPlan);
        if (success) {
            if (editingPlanId) {
                setPlans(plans.map(p => p.id === editingPlanId ? newPlan : p));
            } else {
                setPlans([...plans, newPlan]);
            }

            setShowModal(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setWebsite('');
        setPrice('');
        setEmail('');
        setPaymentDate('');
        setNextDate('');
        setCardInfo('');
        setSelectedIcon('global');
        setEditingPlanId(null);
    };

    const handleEdit = (plan: Plan) => {
        setWebsite(plan.website);
        setPrice(plan.price.toString());
        setEmail(plan.email || '');
        setPaymentDate(plan.paymentDate || '');
        setNextDate(plan.nextPaymentDate);
        setCardInfo(plan.cardInfo || '');
        setSelectedIcon(plan.icon || 'global');
        setEditingPlanId(plan.id);
        setShowModal(true);
        setViewingPlan(null);
    };

    const calculateDaysRemaining = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* Header */}
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                        <CreditCard size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Quản lý & Thanh toán</p>
                        <h1 className="text-lg font-normal tracking-tight text-stone-900">Danh sách Plans</h1>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                >
                    <Plus size={18} strokeWidth={1.5} /> Thêm Plan
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className={`${cardClass} mx-auto max-w-7xl overflow-hidden`}>
                    <table className="w-full text-left border-collapse">
                        <thead className="border-b border-stone-100 bg-stone-50/70">
                            <tr>
                                <th className="w-12 p-5 text-xs font-semibold uppercase tracking-wide text-stone-500">#</th>
                                <th className="p-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Tên Web</th>
                                <th className="p-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Email</th>
                                <th className="p-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Số tiền</th>
                                <th className="p-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Ngày T.Toán Tiếp Theo</th>
                                <th className="p-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Ngày còn lại</th>
                                <th className="p-5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100/70">
                            {plans.map((plan, index) => {
                                const daysLeft = calculateDaysRemaining(plan.nextPaymentDate);
                                let urgencyClass = 'text-emerald-600';
                                if (daysLeft < 0) urgencyClass = 'text-rose-600 font-semibold';
                                else if (daysLeft < 3) urgencyClass = 'text-rose-600 font-semibold';
                                else if (daysLeft < 7) urgencyClass = 'text-amber-600 font-medium';

                                const IconComp = ICON_MAP[plan.icon] || Globe;

                                return (
                                    <tr key={plan.id} className="transition-colors hover:bg-stone-50/50">
                                        <td className="p-5 font-mono text-xs text-stone-400">{index + 1}</td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-600 shadow-sm">
                                                    <IconComp size={18} strokeWidth={1.5} />
                                                </div>
                                                <span className="font-medium text-stone-800">{plan.website}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm text-stone-600">
                                            {plan.email || '—'}
                                        </td>
                                        <td className="p-5 font-mono text-sm font-medium text-stone-700">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price)}
                                        </td>
                                        <td className="p-5 text-sm font-medium text-stone-800">
                                            {new Date(plan.nextPaymentDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className={`p-5 text-sm ${urgencyClass}`}>
                                            {daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : `${daysLeft} ngày`}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingPlan(plan)}
                                                    className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 shadow-sm transition-all hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={18} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(plan)}
                                                    className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 shadow-sm transition-all hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={18} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(plan.id)}
                                                    className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 shadow-sm transition-all hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={18} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {plans.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center text-stone-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 bg-white">
                                                <CreditCard size={32} strokeWidth={1} className="text-stone-200" />
                                            </div>
                                            <p>Chưa có plan nào được thêm.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 p-6 rounded-t-2xl">
                            <h3 className="text-lg font-medium text-stone-900">{editingPlanId ? 'Chỉnh sửa Plan' : 'Thêm Plan Mới'}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-full bg-white p-2 text-stone-400 shadow-sm transition-colors hover:text-stone-700 hover:bg-stone-100"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-auto p-8">
                            {/* Icon Picker */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Chọn biểu tượng
                                </label>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {Object.keys(ICON_MAP).map(key => {
                                        const Icon = ICON_MAP[key];
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedIcon(key)}
                                                className={`flex min-h-[60px] min-w-[60px] items-center justify-center rounded-xl border p-4 transition-all ${selectedIcon === key
                                                        ? 'border-stone-400 bg-stone-100 text-stone-700 ring-2 ring-stone-300'
                                                        : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-300 hover:bg-white'
                                                    }`}
                                            >
                                                <Icon size={24} strokeWidth={1.5} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Tên Website / Dịch vụ <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        autoFocus
                                        className={inputClass}
                                        placeholder="Ví dụ: Netflix"
                                        value={website}
                                        onChange={e => setWebsite(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Số tiền (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        placeholder="Ví dụ: 260000"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Ngày thanh toán
                                    </label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Ngày thanh toán tiếp theo <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={nextDate}
                                        onChange={e => setNextDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Thẻ và Số thẻ
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
                                    <input
                                        type="text"
                                        className="pl-12 pr-4 py-3 w-full rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all"
                                        placeholder="Ví dụ: Visa Techcombank *1234"
                                        value={cardInfo}
                                        onChange={e => setCardInfo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Email đăng ký (Tùy chọn)
                                </label>
                                <input
                                    type="email"
                                    className={inputClass}
                                    placeholder="name@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 border-t border-stone-100 bg-white p-6 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-xl border border-stone-200 py-3.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 rounded-xl bg-stone-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                            >
                                {editingPlanId ? 'Lưu thay đổi' : 'Thêm Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="flex w-full max-w-md flex-col rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="border-b border-stone-100 bg-stone-50/60 p-8 text-center">
                            <button
                                onClick={() => setViewingPlan(null)}
                                className="absolute right-4 top-4 rounded-full bg-white p-2 text-stone-400 shadow-sm backdrop-blur-sm transition-colors hover:text-stone-700 hover:bg-stone-100"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 shadow-sm">
                                {(() => {
                                    const Icon = ICON_MAP[viewingPlan.icon] || Globe;
                                    return <Icon size={32} strokeWidth={1.5} />;
                                })()}
                            </div>
                            <h2 className="text-xl font-semibold text-stone-900">{viewingPlan.website}</h2>
                            <p className="mt-2 font-mono text-lg text-stone-600">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingPlan.price)}
                            </p>
                        </div>

                        <div className="space-y-4 p-6">
                            <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                                <div className="rounded-xl bg-white p-3 text-stone-500 shadow-sm">
                                    <Mail size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Email</div>
                                    <div className="text-sm font-medium text-stone-800">{viewingPlan.email || 'Chưa cập nhật'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                                <div className="rounded-xl bg-white p-3 text-stone-500 shadow-sm">
                                    <CreditCard size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Thông tin thẻ</div>
                                    <div className="text-sm font-medium text-stone-800">{viewingPlan.cardInfo || 'Chưa cập nhật'}</div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                                    <div className="mb-1 flex items-center gap-2 text-stone-400">
                                        <Calendar size={14} strokeWidth={1.5} />
                                        <span className="text-[10px] font-semibold uppercase">Kỳ này</span>
                                    </div>
                                    <div className="text-sm font-medium text-stone-800">
                                        {viewingPlan.paymentDate ? new Date(viewingPlan.paymentDate).toLocaleDateString('vi-VN') : '—'}
                                    </div>
                                </div>
                                <div className="flex-1 rounded-xl border border-stone-200 bg-stone-50 p-4">
                                    <div className="mb-1 flex items-center gap-2 text-stone-500">
                                        <Calendar size={14} strokeWidth={1.5} />
                                        <span className="text-[10px] font-semibold uppercase">Kỳ tới</span>
                                    </div>
                                    <div className="text-sm font-semibold text-stone-900">
                                        {new Date(viewingPlan.nextPaymentDate).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-2">
                                {(() => {
                                    const days = calculateDaysRemaining(viewingPlan.nextPaymentDate);
                                    if (days < 0)
                                        return (
                                            <span className="inline-flex items-center rounded-full bg-rose-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600">
                                                Quá hạn {Math.abs(days)} ngày
                                            </span>
                                        );
                                    if (days <= 3)
                                        return (
                                            <span className="inline-flex items-center rounded-full bg-rose-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600">
                                                Sắp hết hạn: {days} ngày
                                            </span>
                                        );
                                    if (days <= 7)
                                        return (
                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
                                                Còn lại: {days} ngày
                                            </span>
                                        );
                                    return (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                            Còn lại: {days} ngày
                                        </span>
                                    );
                                })()}
                            </div>

                            <div className="flex gap-3 border-t border-stone-100 pt-4">
                                <button
                                    onClick={() => handleEdit(viewingPlan)}
                                    className="flex-1 rounded-xl border border-stone-200 py-3.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
                                >
                                    Chỉnh sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(viewingPlan.id)}
                                    className="flex-1 rounded-xl border border-rose-200 py-3.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanList;
