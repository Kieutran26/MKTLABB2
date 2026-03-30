import React, { useState, useEffect } from 'react';
import {
    X, Plus, Send, Calendar, Clock, MoreVertical, Play, Pause,
    Trash2, Edit3, Eye, CheckCircle, AlertCircle, Mail, Users,
    ChevronRight, Search, Filter
} from 'lucide-react';
import { campaignService, EmailCampaign, CampaignAnalytics } from '../../services/campaignService';
import { supabase } from '../../lib/supabase';
import { customerListService, CustomerList } from '../../services/customerListService';
import { emailDesignService } from '../../services/emailDesignService';
import { resendService } from '../../services/resendService';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmModal';
import { generateEmailHTML } from '../../utils/emailRenderer';
import { ScheduledCampaignsModal } from './ScheduledCampaignsModal';

interface CampaignManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateCampaign: () => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ isOpen, onClose, onCreateCampaign }) => {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [lists, setLists] = useState<CustomerList[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showScheduledModal, setShowScheduledModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
    const [templates, setTemplates] = useState<Array<{ id: string; name: string; doc?: any }>>([]);
    const [templateSearch, setTemplateSearch] = useState('');
    const [analyticsMap, setAnalyticsMap] = useState<Record<string, CampaignAnalytics>>({});

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        preheader: '',
        senderName: '',
        senderEmail: '',
        replyTo: '',
        listId: '',
        templateId: '',
        scheduledAt: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        const [campaignList, customerLists, savedDesigns] = await Promise.all([
            campaignService.getAllCampaigns(),
            customerListService.getAllLists(),
            emailDesignService.getAll()
        ]);
        setCampaigns(campaignList);
        setLists(customerLists);
        setTemplates(savedDesigns || []);

        // Fetch analytics for all campaigns
        const analyticsData: Record<string, CampaignAnalytics> = {};
        for (const campaign of campaignList) {
            const analytics = await campaignService.getAnalytics(campaign.id);
            if (analytics) {
                analyticsData[campaign.id] = analytics;
            }
        }
        setAnalyticsMap(analyticsData);

        setLoading(false);
    };

    const handleCreateCampaign = async () => {
        if (!formData.name || !formData.subject || !formData.senderName || !formData.senderEmail) {
            return;
        }

        console.log('[DEBUG] Creating Campaign with formData:', formData);

        const campaign = await campaignService.createCampaign({
            name: formData.name,
            subject: formData.subject,
            preheader: formData.preheader,
            sender_name: formData.senderName,
            sender_email: formData.senderEmail,
            reply_to: formData.replyTo,
            list_id: formData.listId || undefined,
            template_id: formData.templateId || undefined,
            scheduled_at: formData.scheduledAt || undefined
        });

        if (campaign) {
            await loadData();
            setShowCreateModal(false);
            resetForm();
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        const confirmed = await confirm({
            title: 'Xóa chiến dịch',
            message: 'Bạn có chắc muốn xóa chiến dịch này?',
            type: 'danger',
            confirmText: 'Xóa',
            cancelText: 'Huỷ'
        });
        if (!confirmed) return;
        await campaignService.deleteCampaign(id);
        await loadData();
        toast.success('Xóa thành công', 'Chiến dịch đã được xóa');
    };

    const handleSendCampaign = async (id: string) => {
        const campaign = campaigns.find(c => c.id === id);
        if (!campaign) return;

        if (!campaign.list_id) {
            toast.warning('Thiếu danh sách', 'Vui lòng chọn danh sách khách hàng trước khi gửi!');
            return;
        }

        // Check if campaign is scheduled for future
        const isFutureScheduled = campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date();

        const confirmed = await confirm({
            title: isFutureScheduled ? 'Kích hoạt lịch gửi' : 'Gửi chiến dịch',
            message: isFutureScheduled
                ? `Chiến dịch này được lên lịch gửi vào ${new Date(campaign.scheduled_at!).toLocaleString('vi-VN')}. Bạn có muốn kích hoạt để tự động gửi vào lúc đó không?`
                : 'Gửi chiến dịch này ngay bây giờ?',
            type: 'send',
            confirmText: isFutureScheduled ? 'Kích hoạt' : 'Gửi ngay',
            cancelText: 'Huỷ'
        });
        if (!confirmed) return;

        // If future scheduled, just ensure status is 'scheduled' and notify user
        if (isFutureScheduled) {
            await campaignService.updateCampaign(id, { status: 'scheduled' });
            await loadData();
            toast.success('Đã kích hoạt lịch gửi', `Email sẽ được gửi tự động vào ${new Date(campaign.scheduled_at!).toLocaleString('vi-VN')}`);
            return;
        }

        // Mark as sending
        await campaignService.updateCampaign(id, { status: 'sending' });
        await loadData();

        try {
            // Get subscribers from the list
            const subscribers = await customerListService.getSubscribers(campaign.list_id);
            const activeSubscribers = subscribers.filter(s => s.status === 'active');

            if (activeSubscribers.length === 0) {
                alert('⚠️ Danh sách không có subscriber nào!');
                await campaignService.updateCampaign(id, { status: 'draft' });
                await loadData();
                return;
            }

            // Get email template HTML
            let emailHtml = '';

            // Fetch template first if ID exists
            let template = null;
            if (campaign.template_id) {
                console.log(`[DEBUG] Fetching template ID: ${campaign.template_id}`);
                template = await emailDesignService.getById(campaign.template_id);
                console.log(`[DEBUG] Fetched template result:`, template ? 'FOUND' : 'NULL');
                if (template) {
                    console.log(`[DEBUG] Template Doc Blocks:`, template.doc?.blocks?.length || 0);
                    // Check if it looks like default content
                    const firstBlock = template.doc?.blocks?.[0];
                    if (firstBlock && firstBlock.content && firstBlock.content.includes('Chào mừng')) {
                        console.warn('[DEBUG] WARNING: Template seems to contain default "Chào mừng" content!');
                    }
                }
            }

            if (template && template.doc) {
                console.log(`[DEBUG] Generating HTML from template doc...`);
                emailHtml = generateEmailHTML(template.doc);
            }

            // Fallback to simple template if no template selected
            if (!emailHtml) {
                emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1>Xin chào {{firstName}}!</h1>
                        <p>${campaign.subject}</p>
                        ${campaign.preheader ? `<p style="color: #666;">${campaign.preheader}</p>` : ''}
                        <hr/>
                        <p style="font-size: 12px; color: #999;">Email này được gửi từ ${campaign.sender_name}</p>
                    </div>
                `;
            }

            // Send campaign using Resend with tracking
            const result = await resendService.sendCampaign({
                campaignId: id,  // Add campaign ID for tracking
                subject: campaign.subject,
                html: emailHtml,
                fromName: campaign.sender_name,
                fromEmail: campaign.sender_email,
                replyTo: campaign.reply_to,
                subscribers: activeSubscribers.map(s => ({
                    id: s.id,  // Add subscriber ID for tracking
                    email: s.email,
                    firstName: s.first_name,
                    lastName: s.last_name
                }))
            });
            // Log detailed results for debugging
            console.log('Send campaign results:', result);
            result.results.forEach((r, i) => {
                if (!r.success) {
                    console.error(`Email ${i + 1} failed:`, r.error);
                }
            });

            // Mark as sent and update analytics with real data
            await campaignService.markAsSent(id);

            // Update campaign analytics for accurate reporting
            await supabase
                .from('campaign_analytics')
                .upsert({
                    campaign_id: id,
                    total_sent: result.sentCount + result.failedCount,
                    total_delivered: result.sentCount,
                    total_bounced: result.failedCount,
                    open_rate: 0, // Will be updated when tracking opens
                    click_rate: 0, // Will be updated when tracking clicks
                    updated_at: new Date().toISOString()
                }, { onConflict: 'campaign_id' });

            await loadData();

            if (result.failedCount > 0) {
                const errorMsgs = result.results.filter(r => !r.success).map(r => r.error).slice(0, 3).join(', ');
                toast.warning(`Gửi ${result.sentCount}/${activeSubscribers.length} email`, errorMsgs);
            } else {
                toast.success('Gửi thành công!', `Đã gửi ${result.sentCount}/${activeSubscribers.length} email`);
            }
        } catch (error: any) {
            console.error('Send campaign error:', error);
            await campaignService.updateCampaign(id, { status: 'draft' });
            await loadData();
            toast.error('Lỗi gửi email', error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subject: '',
            preheader: '',
            senderName: '',
            senderEmail: '',
            replyTo: '',
            listId: '',
            templateId: '',
            scheduledAt: ''
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Nháp' },
            scheduled: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Đã lên lịch' },
            sending: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Đang gửi' },
            sent: { bg: 'bg-green-100', text: 'text-green-600', label: 'Đã gửi' },
            paused: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Tạm dừng' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-600', label: 'Đã hủy' }
        };
        const badge = badges[status] || badges.draft;
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Send size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Quản Lý Chiến Dịch</h2>
                            <p className="text-sm text-blue-100">Xem và quản lý các chiến dịch email</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm chiến dịch..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả</option>
                            <option value="draft">Nháp</option>
                            <option value="scheduled">Đã lên lịch</option>
                            <option value="sent">Đã gửi</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowScheduledModal(true)}
                            className="px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Calendar size={16} />
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Plus size={16} /> Tạo chiến dịch
                        </button>
                    </div>
                </div>

                {/* Campaign List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Đang tải...</div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail size={28} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 mb-4">Chưa có chiến dịch nào</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                            >
                                Tạo chiến dịch đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCampaigns.map(campaign => (
                                <div
                                    key={campaign.id}
                                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-medium text-gray-900 truncate">{campaign.name}</h3>
                                                {getStatusBadge(campaign.status)}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{campaign.subject}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(campaign.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                                {campaign.scheduled_at && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Lịch: {new Date(campaign.scheduled_at).toLocaleString('vi-VN')}
                                                    </span>
                                                )}
                                                {campaign.list_id && (
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        {lists.find(l => l.id === campaign.list_id)?.name || 'Danh sách'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Campaign Stats */}
                                        {campaign.status === 'sent' && analyticsMap[campaign.id] && (
                                            <div className="flex items-center gap-4 mx-4 px-4 border-l border-gray-200">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {analyticsMap[campaign.id].total_sent || 0}
                                                    </div>
                                                    <div className="text-xs text-gray-400">Đã gửi</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-emerald-600">
                                                        {analyticsMap[campaign.id].open_rate?.toFixed(1) || 0}%
                                                    </div>
                                                    <div className="text-xs text-gray-400">Mở</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {analyticsMap[campaign.id].click_rate?.toFixed(1) || 0}%
                                                    </div>
                                                    <div className="text-xs text-gray-400">Nhấp</div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 ml-4">
                                            {campaign.status === 'draft' && (
                                                <button
                                                    onClick={() => handleSendCampaign(campaign.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Gửi ngay"
                                                >
                                                    <Play size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedCampaign(campaign)}
                                                className="p-2 text-gray-400 hover:bg-gray-200 rounded-lg"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <span>Tổng: {campaigns.length} chiến dịch</span>
                    <span>
                        Đã gửi: {campaigns.filter(c => c.status === 'sent').length} |
                        Nháp: {campaigns.filter(c => c.status === 'draft').length}
                    </span>
                </div>
            </div>

            {/* Scheduled Campaigns Modal */}
            {
                showScheduledModal && (
                    <ScheduledCampaignsModal
                        campaigns={campaigns}
                        onClose={() => setShowScheduledModal(false)}
                    />
                )
            }

            {/* Create Campaign Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Tạo Chiến Dịch Mới</h3>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="VD: Summer Sale 2024"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề email *</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="VD: Ưu đãi mùa hè - Giảm 50%!"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preheader</label>
                                    <input
                                        type="text"
                                        value={formData.preheader}
                                        onChange={(e) => setFormData(prev => ({ ...prev, preheader: e.target.value }))}
                                        placeholder="Text hiện sau tiêu đề..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên người gửi *</label>
                                        <input
                                            type="text"
                                            value={formData.senderName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                                            placeholder="Your Company"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email người gửi *</label>
                                        <input
                                            type="email"
                                            value={formData.senderEmail}
                                            onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
                                            placeholder="hello@company.com"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn danh sách</label>
                                    <select
                                        value={formData.listId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, listId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Chọn danh sách --</option>
                                        {lists.map(list => (
                                            <option key={list.id} value={list.id}>
                                                {list.name} ({list.subscriber_count} subscribers)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lên lịch gửi</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduledAt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Template Selection */}
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-purple-800 uppercase tracking-wide">MẪU EMAIL</label>
                                        <button
                                            onClick={onCreateCampaign}
                                            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Tạo mẫu mới
                                        </button>
                                    </div>
                                    <div className="relative mb-3">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={templateSearch}
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                            placeholder="Tìm kiếm mẫu..."
                                            className="w-full pl-9 pr-4 py-2 border border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                        {templates.filter(t => (t.name || '').toLowerCase().includes(templateSearch.toLowerCase())).length === 0 ? (
                                            <div className="text-center py-4 text-purple-400">
                                                <Mail size={24} className="mx-auto mb-1 opacity-50" />
                                                <p className="text-sm">Chưa có mẫu nào. Hãy tạo mẫu đầu tiên!</p>
                                            </div>
                                        ) : (
                                            templates.filter(t => (t.name || '').toLowerCase().includes(templateSearch.toLowerCase())).map(template => (
                                                <div
                                                    key={template.id}
                                                    onClick={() => setFormData(prev => ({ ...prev, templateId: template.id }))}
                                                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${formData.templateId === template.id
                                                        ? 'border-purple-500 bg-purple-100'
                                                        : 'border-transparent bg-white hover:border-purple-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            <Mail size={16} className="text-purple-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{template.name}</div>
                                                        </div>
                                                        {formData.templateId === template.id && (
                                                            <CheckCircle size={18} className="text-purple-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateCampaign}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Tạo chiến dịch
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Campaign Detail Modal */}
            {
                selectedCampaign && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
                                <h3 className="font-bold text-white">Chi Tiết Chiến Dịch</h3>
                                <button onClick={() => setSelectedCampaign(null)} className="p-1 hover:bg-white/10 rounded text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h2>
                                    {getStatusBadge(selectedCampaign.status)}
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Tiêu đề email</div>
                                        <div className="font-medium text-gray-900">{selectedCampaign.subject}</div>
                                    </div>

                                    {selectedCampaign.preheader && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs text-gray-500 mb-1">Preheader</div>
                                            <div className="text-gray-700">{selectedCampaign.preheader}</div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs text-gray-500 mb-1">Người gửi</div>
                                            <div className="font-medium text-gray-900">{selectedCampaign.sender_name}</div>
                                            <div className="text-sm text-gray-600">{selectedCampaign.sender_email}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs text-gray-500 mb-1">Danh sách</div>
                                            <div className="font-medium text-gray-900">
                                                {selectedCampaign.list_id
                                                    ? lists.find(l => l.id === selectedCampaign.list_id)?.name || 'Không xác định'
                                                    : 'Chưa chọn'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs text-gray-500 mb-1">Ngày tạo</div>
                                            <div className="font-medium text-gray-900">
                                                {new Date(selectedCampaign.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                        {selectedCampaign.scheduled_at && (
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <div className="text-xs text-blue-600 mb-1">Lịch gửi</div>
                                                <div className="font-medium text-blue-800">
                                                    {new Date(selectedCampaign.scheduled_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        )}
                                        {selectedCampaign.sent_at && (
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="text-xs text-green-600 mb-1">Đã gửi lúc</div>
                                                <div className="font-medium text-green-800">
                                                    {new Date(selectedCampaign.sent_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                                {selectedCampaign.status === 'draft' && (
                                    <button
                                        onClick={() => { handleSendCampaign(selectedCampaign.id); setSelectedCampaign(null); }}
                                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                        <Play size={16} /> Gửi ngay
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }


            <ScheduledCampaignsModal
                isOpen={showScheduledModal}
                onClose={() => setShowScheduledModal(false)}
            />
        </div>
    );
};



export default CampaignManager;
