import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BarChart3, Send, Mail, MousePointerClick,
    Calendar, ChevronDown, Plus, ArrowRight, MessageSquare,
    X, Search, Info, FileText, Users
} from 'lucide-react';
import { campaignService, EmailCampaign as CampaignType, CampaignAnalytics } from '../services/campaignService';
import CustomerLists from './EmailMarketing/CustomerLists';
import CampaignManager from './EmailMarketing/CampaignManager';
import { ScheduledCampaignsModal } from './EmailMarketing/ScheduledCampaignsModal';

// Types
interface EmailCampaign {
    id: string;
    name: string;
    status: 'active' | 'draft' | 'completed';
    sentCount: number;
    openRate: number;
    clickRate: number;
    createdAt: number;
}

interface EmailStats {
    totalCampaigns: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    sent: number;
    opened: number;
    clicked: number;
    failed: number;
}

interface CampaignFormData {
    name: string;
    subject: string;
    preheader: string;
    senderName: string;
    senderEmail: string;
    replyTo: string;
    cc: string;
    bcc: string;
    templateId: string | null;
}

// Create Campaign Modal Component
const CreateCampaignModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CampaignFormData) => void;
    onCreateTemplate: () => void;
}> = ({ isOpen, onClose, onSave, onCreateTemplate }) => {
    const [formData, setFormData] = useState<CampaignFormData>({
        name: '',
        subject: '',
        preheader: '',
        senderName: '',
        senderEmail: '',
        replyTo: '',
        cc: '',
        bcc: '',
        templateId: null
    });
    const [templateSearch, setTemplateSearch] = useState('');
    const [templates] = useState<{ id: string; name: string }[]>([]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.name || !formData.subject || !formData.senderName || !formData.senderEmail) {
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Tạo Campaign</h2>
                        <p className="text-sm text-gray-500">Cấu hình campaign email của bạn</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Campaign Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên Campaign <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Summer Sale"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu đề Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Don't miss our sale!"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Preheader */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preheader (Preview text)
                        </label>
                        <input
                            type="text"
                            value={formData.preheader}
                            onChange={(e) => setFormData(prev => ({ ...prev, preheader: e.target.value }))}
                            placeholder="This appears after subject..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Sender Info Section */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Thông Tin Người Gửi</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">
                                    Tên người gửi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.senderName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                                    placeholder="Your Company"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">
                                    Email người gửi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.senderEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
                                    placeholder="hello@company.com"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Reply-To</label>
                                <input
                                    type="email"
                                    value={formData.replyTo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, replyTo: e.target.value }))}
                                    placeholder="reply@..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">CC</label>
                                <input
                                    type="email"
                                    value={formData.cc}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cc: e.target.value }))}
                                    placeholder="cc@..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">BCC</label>
                                <input
                                    type="email"
                                    value={formData.bcc}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bcc: e.target.value }))}
                                    placeholder="bcc@..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Template Section */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Mẫu Email</h3>
                            <button
                                onClick={onCreateTemplate}
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                <Plus size={14} />
                                Tạo mẫu mới
                            </button>
                        </div>

                        {/* Template Search */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={templateSearch}
                                onChange={(e) => setTemplateSearch(e.target.value)}
                                placeholder="Tìm kiếm mẫu..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Template List / Empty State */}
                        {templates.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chưa có mẫu nào. Hãy tạo mẫu đầu tiên!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => setFormData(prev => ({ ...prev, templateId: template.id }))}
                                        className={`w-full p-3 rounded-lg border text-left transition-all ${formData.templateId === template.id
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dynamic Fields Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            <span className="font-medium">Trường động:</span> Sử dụng{' '}
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">{'{{firstName}}'}</code>,{' '}
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">{'{{email}}'}</code>{' '}
                            trong tiêu đề/mẫu.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-500">
                        Danh sách: <span className="font-medium text-gray-700">h</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                        >
                            <X size={16} />
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 shadow-sm"
                        >
                            Lưu chiến dịch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmailReport: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const [dateRange, setDateRange] = useState('30');
    const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentView, setCurrentView] = useState<'report' | 'lists'>('report');
    const [stats, setStats] = useState<EmailStats>({
        totalCampaigns: 0,
        totalSent: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        failed: 0
    });
    const [loading, setLoading] = useState(true);
    const [analyticsMap, setAnalyticsMap] = useState<Record<string, CampaignAnalytics>>({});
    const [showCampaignManager, setShowCampaignManager] = useState(false);
    const [showScheduledModal, setShowScheduledModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        const [campaignList, overallStats] = await Promise.all([
            campaignService.getAllCampaigns(),
            campaignService.getOverallStats(parseInt(dateRange))
        ]);
        setCampaigns(campaignList);
        setStats(overallStats);

        // Fetch analytics for each campaign
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

    const handleSaveCampaign = async (data: CampaignFormData) => {
        const campaign = await campaignService.createCampaign({
            name: data.name,
            subject: data.subject,
            preheader: data.preheader,
            sender_name: data.senderName,
            sender_email: data.senderEmail,
            reply_to: data.replyTo,
            cc: data.cc,
            bcc: data.bcc,
            template_id: data.templateId || undefined
        });
        if (campaign) {
            await loadData();
        }
        setShowCreateModal(false);
    };

    const handleCreateTemplate = () => {
        setShowCreateModal(false);
        // Navigate to Visual Email Builder would happen via parent
    };

    // Show CustomerLists view
    if (currentView === 'lists') {
        return <CustomerLists onBack={() => setCurrentView('report')} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
                            >
                                <ArrowLeft size={16} />
                                Quay lại
                            </button>
                        )}
                    </div>
                    {/* View Tabs */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setCurrentView('report')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'report' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <BarChart3 size={16} className="inline mr-1" /> Report
                        </button>
                        <button
                            onClick={() => setCurrentView('lists')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'lists' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users size={16} className="inline mr-1" /> Danh sách
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <BarChart3 size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Bảng Điều Khiển Email</h1>
                            <p className="text-sm text-gray-500">Tổng quan hiệu suất và thống kê chiến dịch email</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7">7 ngày qua</option>
                                <option value="30">30 ngày qua</option>
                                <option value="90">90 ngày qua</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Calendar Button */}
                        <button
                            onClick={() => setShowScheduledModal(true)}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            title="Lịch chiến dịch"
                        >
                            <Calendar size={18} />
                        </button>

                        {/* Create Campaign Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={16} />
                            Chiến dịch
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {/* Total Campaigns */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Calendar size={20} className="text-blue-600" />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{dateRange} ngày</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCampaigns}</div>
                        <div className="text-sm text-gray-500">Tổng Chiến Dịch</div>
                    </div>

                    {/* Emails Sent */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Send size={20} className="text-indigo-600" />
                            </div>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSent}</div>
                        <div className="text-sm text-gray-500">Email Đã Gửi</div>
                    </div>

                    {/* Open Rate */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Mail size={20} className="text-emerald-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgOpenRate}%</div>
                        <div className="text-sm text-gray-500">Tỷ Lệ Mở TB</div>
                    </div>

                    {/* Click Rate */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <MousePointerClick size={20} className="text-gray-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgClickRate}%</div>
                        <div className="text-sm text-gray-500">Tỷ Lệ Nhấp TB</div>
                    </div>
                </div>

                {/* Performance Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Chi Tiết Hiệu Suất</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {/* Sent */}
                        <div className="bg-gray-50 rounded-xl p-5 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.sent}</div>
                            <div className="text-sm text-gray-500">Đã gửi</div>
                        </div>

                        {/* Opened */}
                        <div className="bg-gray-50 rounded-xl p-5 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">{stats.opened}</div>
                            <div className="text-sm text-gray-500">Đã mở</div>
                        </div>

                        {/* Clicked */}
                        <div className="bg-gray-50 rounded-xl p-5 text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.clicked}</div>
                            <div className="text-sm text-gray-500">Đã nhấp</div>
                        </div>

                        {/* Failed */}
                        <div className="bg-gray-50 rounded-xl p-5 text-center">
                            <div className="text-3xl font-bold text-red-500 mb-2">{stats.failed}</div>
                            <div className="text-sm text-gray-500">Thất bại</div>
                        </div>
                    </div>
                </div>

                {/* Recent Campaigns */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900">Chiến Dịch Gần Đây</h2>
                        <button
                            onClick={() => setShowCampaignManager(true)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            Xem tất cả
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={28} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500">Chưa có chiến dịch nào. Hãy tạo chiến dịch đầu tiên!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.slice(0, 5).map((campaign) => {
                                const analytics = analyticsMap[campaign.id];
                                return (
                                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${campaign.status === 'sent' ? 'bg-blue-500' :
                                                campaign.status === 'sending' ? 'bg-yellow-500' :
                                                    campaign.status === 'draft' ? 'bg-gray-400' : 'bg-gray-300'
                                                }`} />
                                            <div>
                                                <div className="font-medium text-gray-900">{campaign.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(campaign.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="text-gray-500">
                                                <span className="font-medium text-gray-900">{analytics?.total_sent || 0}</span> gửi
                                            </div>
                                            <div className="text-gray-500">
                                                <span className="font-medium text-green-600">{analytics?.open_rate?.toFixed(1) || 0}%</span> mở
                                            </div>
                                            <div className="text-gray-500">
                                                <span className="font-medium text-purple-600">{analytics?.click_rate?.toFixed(1) || 0}%</span> nhấp
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Campaign Modal */}
            <CreateCampaignModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleSaveCampaign}
                onCreateTemplate={handleCreateTemplate}
            />

            {/* Campaign Manager Modal */}
            <CampaignManager
                isOpen={showCampaignManager}
                onClose={() => { setShowCampaignManager(false); loadData(); }}
                onCreateCampaign={() => { }}
            />

            {/* Scheduled Campaigns Modal */}
            {showScheduledModal && (
                <ScheduledCampaignsModal
                    isOpen={showScheduledModal}
                    onClose={() => setShowScheduledModal(false)}
                />
            )}
        </div>
    );
};

export default EmailReport;
