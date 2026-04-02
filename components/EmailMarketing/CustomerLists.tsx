import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Plus, Users, Upload, FileSpreadsheet, ClipboardList,
    Trash2, Edit3, Search, CheckCircle, X, Mail, Phone, User, UserMinus,
    ChevronDown, ChevronRight, Settings, Info, Link2, Eye, Calendar
} from 'lucide-react';
import { customerListService, CustomerList, Subscriber, CustomFieldDefinition } from '../../services/customerListService';
import { Toast, ToastType } from '../Toast'; // Assuming shared Toast component

// =============================================
// CUSTOMER LISTS COMPONENT
// =============================================

const CustomerLists: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    // ... (state hooks remain same)
    const [lists, setLists] = useState<CustomerList[]>([]);
    const [selectedList, setSelectedList] = useState<CustomerList | null>(null);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Modals
    const [showCreateListModal, setShowCreateListModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddSubscriberModal, setShowAddSubscriberModal] = useState(false);
    const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);

    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Load data
    useEffect(() => {
        loadLists();
        loadCustomFields();
    }, []);

    useEffect(() => {
        if (selectedList) {
            loadSubscribers(selectedList.id);
        }
    }, [selectedList]);

    const loadLists = async () => {
        setLoading(true);
        const data = await customerListService.getAllLists();
        setLists(data);
        setLoading(false);
    };

    const loadSubscribers = async (listId: string) => {
        const data = await customerListService.getSubscribers(listId);
        setSubscribers(data);
    };

    const loadCustomFields = async () => {
        const data = await customerListService.getCustomFields();
        setCustomFields(data);
    };

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        const result = await customerListService.createList(newListName, newListDesc);
        if (result) {
            showToast('Đã tạo danh sách mới!', 'success');
            await loadLists();
            setShowCreateListModal(false);
            setNewListName('');
            setNewListDesc('');
        } else {
            showToast('Lỗi tạo danh sách', 'error');
        }
    };

    const handleDeleteList = async (id: string) => {
        if (!confirm('Xóa danh sách này?')) return;
        const success = await customerListService.deleteList(id);
        if (success) {
            showToast('Đã xóa', 'success');
            if (selectedList?.id === id) setSelectedList(null);
            await loadLists();
        }
    };

    const filteredSubscribers = subscribers.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                    {onBack && (
                        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                            <ArrowLeft size={16} /> Quay lại
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Danh Sách & Chiến Dịch</h1>
                        <p className="text-sm text-gray-500">Quản lý khách hàng và chiến dịch email</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCustomFieldModal(true)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Settings size={16} /> Custom Fields
                        </button>
                        <button
                            onClick={() => setShowCreateListModal(true)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Plus size={16} /> Tạo danh sách mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 flex gap-6">
                {/* Lists Sidebar */}
                <div className="w-80 shrink-0">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Users size={18} className="text-green-600" />
                            Danh Sách ({lists.length})
                        </h3>

                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Đang tải...</div>
                        ) : lists.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Users size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chưa có danh sách nào</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lists.map(list => (
                                    <div
                                        key={list.id}
                                        onClick={() => setSelectedList(list)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all ${selectedList?.id === list.id
                                            ? 'bg-green-50 border border-green-200'
                                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-gray-800">{list.name}</div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {list.subscriber_count} subscribers
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {selectedList ? (
                        <div className="bg-white rounded-xl border border-gray-200">
                            {/* List Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-gray-800">{selectedList.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedList.description || 'Không có mô tả'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                                    >
                                        <Upload size={14} /> Import
                                    </button>
                                    <button
                                        onClick={() => setShowAddSubscriberModal(true)}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                                    >
                                        <Plus size={14} /> Thêm thủ công
                                    </button>
                                </div>
                            </div>

                            {/* Report Stats */}
                            <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-gray-100 bg-gray-50/50">
                                <div className="bg-white border border-blue-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 font-medium">Tổng khách hàng</div>
                                        <div className="text-2xl font-bold text-gray-800">{subscribers.length}</div>
                                    </div>
                                </div>
                                <div className="bg-white border border-red-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                        <UserMinus size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 font-medium">Đã hủy đăng ký</div>
                                        <div className="text-2xl font-bold text-gray-800">
                                            {subscribers.filter(s => s.status === 'unsubscribed').length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm kiếm subscriber..."
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Subscribers Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điện thoại</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày thêm</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredSubscribers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                                    <Mail size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p>Chưa có subscriber nào</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSubscribers.map(sub => (
                                                <tr key={sub.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">{sub.email}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {[sub.first_name, sub.last_name].filter(Boolean).join(' ') || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{sub.phone || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                                            sub.status === 'unsubscribed' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {new Date(sub.created_at).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => customerListService.deleteSubscriber(sub.id, selectedList.id).then(() => loadSubscribers(selectedList.id))}
                                                            className="p-1 text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Users size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Chọn một danh sách để xem subscribers</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create List Modal */}
            {showCreateListModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo Danh Sách Mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh sách *</label>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="VD: Khách hàng VIP"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={newListDesc}
                                    onChange={(e) => setNewListDesc(e.target.value)}
                                    placeholder="Mô tả danh sách..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowCreateListModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateList}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Tạo danh sách
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && selectedList && (
                <ImportModal
                    listId={selectedList.id}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={(count) => {
                        showToast(`Đã import ${count} subscribers!`, 'success');
                        loadSubscribers(selectedList.id);
                        loadLists();
                    }}
                />
            )}

            {/* Add Subscriber Modal */}
            {showAddSubscriberModal && selectedList && (
                <AddSubscriberModal
                    listId={selectedList.id}
                    customFields={customFields}
                    onClose={() => setShowAddSubscriberModal(false)}
                    onSuccess={() => {
                        showToast('Đã thêm subscriber!', 'success');
                        loadSubscribers(selectedList.id);
                        loadLists();
                    }}
                />
            )}

            {/* Custom Fields Modal */}
            {showCustomFieldModal && (
                <CustomFieldsModal
                    fields={customFields}
                    onClose={() => setShowCustomFieldModal(false)}
                    onUpdate={loadCustomFields}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// =============================================
// IMPORT MODAL COMPONENT
// =============================================

const ImportModal: React.FC<{
    listId: string;
    onClose: () => void;
    onSuccess: (count: number) => void;
}> = ({ listId, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'excel' | 'manual' | 'paste'>('excel');
    const [pasteData, setPasteData] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        // For now, handle CSV files (Excel would need xlsx library)
        const text = await file.text();
        const subscribers = customerListService.parseCsvData(text);

        if (subscribers.length === 0) {
            alert('Không tìm thấy dữ liệu hợp lệ');
            setLoading(false);
            return;
        }

        const count = await customerListService.bulkAddSubscribers(listId, subscribers);
        setLoading(false);
        onSuccess(count);
        onClose();
    };

    const handlePasteImport = async () => {
        if (!pasteData.trim()) return;

        setLoading(true);
        const subscribers = customerListService.parseCsvData(pasteData);

        if (subscribers.length === 0) {
            alert('Không tìm thấy dữ liệu hợp lệ');
            setLoading(false);
            return;
        }

        const count = await customerListService.bulkAddSubscribers(listId, subscribers);
        setLoading(false);
        onSuccess(count);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Nhập Khách Hàng</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {/* Mode Tabs */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={() => setMode('excel')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${mode === 'excel' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <FileSpreadsheet className={`mx-auto mb-2 ${mode === 'excel' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                            <div className="font-medium text-gray-800">Import Excel</div>
                            <div className="text-xs text-gray-500">Upload file .xlsx hoặc .xls</div>
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${mode === 'manual' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <User className={`mx-auto mb-2 ${mode === 'manual' ? 'text-purple-600' : 'text-gray-400'}`} size={24} />
                            <div className="font-medium text-gray-800">Nhập Thủ Công</div>
                            <div className="text-xs text-gray-500">Thêm từng khách hàng</div>
                        </button>
                        <button
                            onClick={() => setMode('paste')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${mode === 'paste' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <ClipboardList className={`mx-auto mb-2 ${mode === 'paste' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                            <div className="font-medium text-gray-800">Copy & Paste</div>
                            <div className="text-xs text-gray-500">Dán danh sách từ file khác</div>
                        </button>
                    </div>

                    {/* Mode Content */}
                    {mode === 'excel' && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleExcelUpload}
                                className="hidden"
                            />
                            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-4">Kéo thả file hoặc click để upload</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Chọn file'}
                            </button>
                        </div>
                    )}

                    {mode === 'paste' && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Dán dữ liệu CSV (email, first_name, last_name, phone):</p>
                            <textarea
                                value={pasteData}
                                onChange={(e) => setPasteData(e.target.value)}
                                placeholder="email,first_name,last_name,phone&#10;john@example.com,John,Doe,0901234567"
                                className="w-full h-48 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handlePasteImport}
                                className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                disabled={loading || !pasteData.trim()}
                            >
                                {loading ? 'Đang import...' : 'Import'}
                            </button>
                        </div>
                    )}

                    {mode === 'manual' && (
                        <div className="text-center py-8 text-gray-400">
                            <p>Đóng modal này và dùng nút "Thêm thủ công"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================
// ADD SUBSCRIBER MODAL
// =============================================

const AddSubscriberModal: React.FC<{
    listId: string;
    customFields: CustomFieldDefinition[];
    onClose: () => void;
    onSuccess: () => void;
}> = ({ listId, customFields, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [customData, setCustomData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) return;

        setLoading(true);
        const result = await customerListService.addSubscriber(listId, {
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            custom_fields: customData
        });
        setLoading(false);

        if (result) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm Subscriber</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Tên"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Họ"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0901234567"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Custom Fields */}
                    {customFields.map(field => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.name} {field.is_required && '*'}
                            </label>
                            <input
                                type={field.data_type === 'number' ? 'number' : field.data_type === 'date' ? 'date' : 'text'}
                                value={customData[field.field_key] || ''}
                                onChange={(e) => setCustomData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !email.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang thêm...' : 'Thêm subscriber'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================
// CUSTOM FIELDS MODAL
// =============================================

const CustomFieldsModal: React.FC<{
    fields: CustomFieldDefinition[];
    onClose: () => void;
    onUpdate: () => void;
}> = ({ fields, onClose, onUpdate }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newField, setNewField] = useState({ name: '', field_key: '', data_type: 'text' as const, is_required: false });

    const handleAddField = async () => {
        if (!newField.name || !newField.field_key) return;
        await customerListService.createCustomField(newField);
        onUpdate();
        setShowAdd(false);
        setNewField({ name: '', field_key: '', data_type: 'text', is_required: false });
    };

    const handleDeleteField = async (id: string) => {
        if (!confirm('Xóa trường này?')) return;
        await customerListService.deleteCustomField(id);
        onUpdate();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Trường Tùy Chỉnh</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
                </div>

                <div className="p-4">
                    {/* Info Box */}
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-purple-800 mb-2">Tạo Trường Tùy Chỉnh</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>• <strong>Tên Trường:</strong> Tên hiển thị</li>
                            <li>• <strong>Key:</strong> Mã định danh (không thể đổi sau)</li>
                            <li>• <strong>Loại Dữ Liệu:</strong> Text, Number, Email, Phone, URL, Date</li>
                        </ul>
                    </div>

                    {/* Fields List */}
                    <div className="space-y-2 mb-4">
                        {fields.length === 0 ? (
                            <p className="text-center py-4 text-gray-400">Chưa có trường tùy chỉnh nào</p>
                        ) : (
                            fields.map(field => (
                                <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-800">{field.name}</div>
                                        <div className="text-xs text-gray-500">
                                            Key: {field.field_key} | Type: {field.data_type}
                                            {field.is_required && ' | Required'}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteField(field.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add New Field */}
                    {showAdd ? (
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={newField.name}
                                    onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Tên trường"
                                    className="px-3 py-2 border border-gray-200 rounded-lg"
                                />
                                <input
                                    type="text"
                                    value={newField.field_key}
                                    onChange={(e) => setNewField(prev => ({ ...prev, field_key: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                                    placeholder="field_key"
                                    className="px-3 py-2 border border-gray-200 rounded-lg font-mono"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={newField.data_type}
                                    onChange={(e) => setNewField(prev => ({ ...prev, data_type: e.target.value as any }))}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="url">URL</option>
                                    <option value="date">Date</option>
                                    <option value="image">Image</option>
                                </select>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={newField.is_required} onChange={(e) => setNewField(prev => ({ ...prev, is_required: e.target.checked }))} />
                                    <span className="text-sm">Bắt buộc</span>
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600">Hủy</button>
                                <button onClick={handleAddField} className="flex-1 py-2 bg-purple-600 text-white rounded-lg">Thêm</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowAdd(true)} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 flex items-center justify-center gap-2">
                            <Plus size={16} /> Thêm trường mới
                        </button>
                    )}

                    {/* Usage Info */}
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Sử Dụng Trong Email</h4>
                        <p className="text-xs text-blue-700">
                            Dùng merge tags: {fields.map(f => `{{${f.field_key}}}`).join(', ') || '{{field_key}}'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerLists;
