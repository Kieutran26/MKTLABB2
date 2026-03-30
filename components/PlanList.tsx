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
    <div className="max-w-7xl mx-auto pt-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
          <CreditCard className="text-slate-700" strokeWidth={1.5} />
          Danh sách Plans
        </h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
        >
          <Plus size={20} strokeWidth={1.5} /> Thêm Plan
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Web</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày T.Toán Tiếp Theo</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày còn lại</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {plans.map((plan, index) => {
              const daysLeft = calculateDaysRemaining(plan.nextPaymentDate);
              let urgencyColor = 'text-green-600';
              if (daysLeft < 3) urgencyColor = 'text-red-600 font-bold';
              else if (daysLeft < 7) urgencyColor = 'text-yellow-600 font-medium';

              const IconComp = ICON_MAP[plan.icon] || Globe;

              return (
                <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-5 text-slate-400 font-mono text-xs">{index + 1}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
                        <IconComp size={18} strokeWidth={1.5} />
                      </div>
                      <div className="font-bold text-slate-800">{plan.website}</div>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-slate-600">
                    {plan.email || '---'}
                  </td>
                  <td className="p-5 font-mono font-medium text-slate-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price)}
                  </td>
                  <td className="p-5 text-slate-800 font-medium">
                    {new Date(plan.nextPaymentDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className={`p-5 ${urgencyColor}`}>
                    {daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : `${daysLeft} ngày`}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewingPlan(plan)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
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
                <td colSpan={7} className="p-20 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <CreditCard size={48} strokeWidth={1} className="text-slate-200" />
                    <p>Chưa có plan nào được thêm.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="text-xl font-bold text-slate-800">{editingPlanId ? 'Chỉnh sửa Plan' : 'Thêm Plan Mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-sm">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Chọn biểu tượng</label>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {Object.keys(ICON_MAP).map(key => {
                    const Icon = ICON_MAP[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedIcon(key)}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-center min-w-[60px] ${selectedIcon === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-white'}`}
                      >
                        <Icon size={24} strokeWidth={1.5} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên Website / Dịch vụ <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder="Ví dụ: Netflix"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền (VNĐ) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder="Ví dụ: 260000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ngày thanh toán</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-600"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ngày thanh toán tiếp theo <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-600"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Thẻ gì và Số thẻ</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-4 text-slate-400" size={20} strokeWidth={1.5} />
                  <input
                    type="text"
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder="Ví dụ: Visa Techcombank *1234"
                    value={cardInfo}
                    onChange={e => setCardInfo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email đăng ký (Tùy chọn)</label>
                <input
                  type="email"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  placeholder="name@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-4 mt-auto bg-white border-t border-slate-100 pt-6 rounded-b-3xl">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-soft"
              >
                {editingPlanId ? 'Lưu thay đổi' : 'Thêm Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border border-slate-100">
            <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 text-white text-center">
              <button
                onClick={() => setViewingPlan(null)}
                className="absolute top-4 right-4 text-indigo-200 hover:text-white bg-white/10 p-2 rounded-full transition-colors backdrop-blur-sm"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 text-white shadow-inner border border-white/20">
                {(() => {
                  const Icon = ICON_MAP[viewingPlan.icon] || Globe;
                  return <Icon size={40} strokeWidth={1.5} />
                })()}
              </div>
              <h2 className="text-2xl font-bold">{viewingPlan.website}</h2>
              <p className="text-indigo-200 font-mono text-xl mt-2 opacity-90">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingPlan.price)}
              </p>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500"><Mail size={20} strokeWidth={1.5} /></div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</div>
                  <div className="text-sm font-semibold text-slate-800">{viewingPlan.email || 'Chưa cập nhật'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500"><CreditCard size={20} strokeWidth={1.5} /></div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thông tin thẻ</div>
                  <div className="text-sm font-semibold text-slate-800">{viewingPlan.cardInfo || 'Chưa cập nhật'}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1 text-slate-400">
                    <Calendar size={14} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase">Kỳ này</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {viewingPlan.paymentDate ? new Date(viewingPlan.paymentDate).toLocaleDateString('vi-VN') : '---'}
                  </div>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1 text-indigo-400">
                    <Calendar size={14} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase">Kỳ tới</span>
                  </div>
                  <div className="text-sm font-bold text-indigo-900">
                    {new Date(viewingPlan.nextPaymentDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                {(() => {
                  const days = calculateDaysRemaining(viewingPlan.nextPaymentDate);
                  if (days < 0) return <span className="text-red-600 font-bold bg-red-50 px-4 py-1.5 rounded-full text-xs uppercase tracking-wide">Quá hạn {Math.abs(days)} ngày</span>;
                  if (days <= 3) return <span className="text-red-500 font-bold bg-red-50 px-4 py-1.5 rounded-full text-xs uppercase tracking-wide">Sắp hết hạn: {days} ngày</span>;
                  return <span className="text-green-600 font-bold bg-green-50 px-4 py-1.5 rounded-full text-xs uppercase tracking-wide">Còn lại: {days} ngày</span>;
                })()}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button
                  onClick={() => handleEdit(viewingPlan)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDelete(viewingPlan.id)}
                  className="flex-1 py-3.5 rounded-2xl border border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors"
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