import React from 'react';
import {
    ArrowRight,
    Zap,
    BarChart,
    Globe,
    Layout,
    PenTool,
    Mail,
    Users,
    Check,
    Star,
    Shield,
    Rocket,
    Home,
    GraduationCap,
    Library,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Calendar,
    List,
    CheckSquare,
    Image,
    MonitorPlay,
    PlusSquare,
    Film,
    Link2,
    PieChart,
    Calculator,
    TrendingUp,
    Activity,
    Target,
    Layers,
    Brain,
    BrainCircuit,
    Map,
    ShieldCheck,
    Radar,
    Compass,
    DollarSign,
    Heart,
    FileText,
    FileCheck,
    Lightbulb,
    Keyboard,
    Monitor
} from 'lucide-react';
import { ViewState } from '../../types';
import { FEATURE_INFO } from './FeatureInfo';
import {
    HookGeneratorDemo,
    PersonaBuilderDemo,
    StrategicModelDemo,
    ContentGeneratorDemo,
    AdsHealthCheckerDemo,
    IMCPlannerDemo
} from './FeatureDemos';

interface LandingPageProps {
    setView: (view: ViewState) => void;
}

// Data for Features
const FEATURE_CATEGORIES = [
    {
        title: "Strategy & Research",
        icon: Brain,
        description: "Xây dựng nền tảng chiến lược vững chắc với các mô hình chuẩn MBA.",
        color: "text-indigo-600",
        items: [
            { id: 'MASTERMIND_STRATEGY', label: 'Mastermind Strategy', icon: Brain, color: 'text-indigo-600', desc: 'Hoạch định chiến lược tổng thể' },
            { id: 'IMC_PLANNER', label: 'IMC Planner', icon: Target, color: 'text-purple-600', desc: 'Lập kế hoạch truyền thông tích hợp' },
            { id: 'STP_MODEL', label: 'STP Model', icon: Layers, color: 'text-violet-600', desc: 'Phân khúc, mục tiêu và định vị' },
            { id: 'PESTEL_BUILDER', label: 'PESTEL Builder', icon: Globe, color: 'text-teal-600', desc: 'Phân tích môi trường vĩ mô' },
            { id: 'PORTER_ANALYZER', label: "Porter's Analyzer", icon: Target, color: 'text-rose-600', desc: 'Phân tích 5 áp lực cạnh tranh' },
            { id: 'STRATEGIC_MODELS', label: 'Strategic Models', icon: Target, color: 'text-blue-600', desc: 'Các mô hình chiến lược khác' },
            { id: 'INSIGHT_FINDER', label: 'Insight Finder', icon: BrainCircuit, color: 'text-cyan-600', desc: 'Tìm kiếm insight khách hàng' },
            { id: 'CUSTOMER_JOURNEY_MAPPER', label: 'Customer Journey', icon: Map, color: 'text-indigo-500', desc: 'Bản đồ hành trình khách hàng' },
            { id: 'BRAND_VAULT', label: 'Brand Vault', icon: ShieldCheck, color: 'text-indigo-600', desc: 'Kho lưu trữ tài sản thương hiệu' },
            { id: 'PERSONA_BUILDER', label: 'Persona Builder', icon: Users, color: 'text-purple-600', desc: 'Xây dựng chân dung khách hàng' },
            { id: 'RIVAL_RADAR', label: 'Rival Radar', icon: Radar, color: 'text-red-600', desc: 'Phân tích đối thủ cạnh tranh' },
            { id: 'BRAND_POSITIONING_BUILDER', label: 'Brand Positioning', icon: Compass, color: 'text-teal-600', desc: 'Xây dựng định vị thương hiệu' },
            { id: 'PRICING_ANALYZER', label: 'Pricing Analyzer', icon: DollarSign, color: 'text-emerald-600', desc: 'Chiến lược định giá sản phẩm' },
            { id: 'AUDIENCE_EMOTION_MAP', label: 'Audience Emotion Map', icon: Heart, color: 'text-pink-600', desc: 'Bản đồ cảm xúc khán giả' },
            { id: 'MARKETING_KNOWLEDGE', label: 'Marketing Knowledge', icon: BookOpen, color: 'text-indigo-600', desc: 'Kho kiến thức Marketing' },
        ]
    },
    {
        title: "Ideation & Content",
        icon: Lightbulb,
        description: "Sáng tạo nội dung đột phá không giới hạn với sự hỗ trợ của AI.",
        color: "text-amber-500",
        items: [
            { id: 'HOOK_GENERATOR', label: 'Hook Generator', icon: Zap, color: 'text-amber-500', desc: 'Tạo tiêu đề thu hút' },
            { id: 'CONTENT_WRITER', label: 'Viết Content', icon: PenTool, color: 'text-violet-500', desc: 'Trợ lý viết bài đa kênh' },
            { id: 'MINDMAP_GENERATOR', label: 'Mindmap AI', icon: BrainCircuit, color: 'text-cyan-500', desc: 'Sơ đồ tư duy ý tưởng' },
            { id: 'SCAMPER_TOOL', label: 'SCAMPER Ideation', icon: Lightbulb, color: 'text-yellow-500', desc: 'Phương pháp sáng tạo SCAMPER' },
            { id: 'SMART_CALENDAR', label: 'Smart Content Calendar', icon: Calendar, color: 'text-indigo-500', desc: 'Lịch nội dung thông minh' },
            { id: 'AUTO_BRIEF', label: 'Auto Brief', icon: FileText, color: 'text-violet-600', desc: 'Tự động tạo Brief' },
            { id: 'SOP_BUILDER', label: 'SOP Builder', icon: FileCheck, color: 'text-emerald-600', desc: 'Xây dựng quy trình chuẩn' },
            { id: 'CREATIVE_ANGLE_EXPLORER', label: 'Creative Angle Explorer', icon: Lightbulb, color: 'text-amber-600', desc: 'Khám phá góc tiếp cận mới' },
            { id: 'NEWS_AGGREGATOR', label: 'Tin Tức Tổng Hợp', icon: Globe, color: 'text-blue-500', desc: 'Cập nhật xu hướng mới nhất' },
        ]
    },
    {
        title: "Design & Visuals",
        icon: Image as any, // Alias conflict with local Image var if exists, using as any safe bet or rename
        description: "Thiết kế hình ảnh và email chuyên nghiệp, nhất quán.",
        color: "text-pink-600",
        items: [
            { id: 'VISUAL_EMAIL', label: 'Visual Email', icon: Mail, color: 'text-pink-500', desc: 'Thiết kế Email Marketing' },
            { id: 'FRAME_VISUAL', label: 'Frame Visual', icon: Film, color: 'text-orange-500', desc: 'Tạo Frame hình ảnh' },
            { id: 'MOCKUP_GENERATOR', label: 'Mockup Generator', icon: MonitorPlay, color: 'text-fuchsia-600', desc: 'Tạo Mockup sản phẩm' },
            { id: 'KEY_VISUALS_CREATE', label: 'Tạo dự án KV', icon: PlusSquare, color: 'text-cyan-500', desc: 'Thiết kế Key Visual' },
            { id: 'KEY_VISUALS_LIST', label: 'Danh sách KV', icon: List, color: 'text-cyan-600', desc: 'Quản lý Key Visual' },
        ]
    },
    {
        title: "Ads & Performance",
        icon: TrendingUp,
        description: "Tối ưu hóa ngân sách và đo lường hiệu quả chiến dịch.",
        color: "text-teal-600",
        items: [
            { id: 'BUDGET_ALLOCATOR', label: 'Budget Allocator', icon: PieChart, color: 'text-purple-600', desc: 'Phân bổ ngân sách' },
            { id: 'UTM_BUILDER', label: 'UTM Builder', icon: Link2, color: 'text-indigo-500', desc: 'Trình tạo mã UTM' },
            { id: 'AB_TESTING', label: 'A/B Testing Calc', icon: Calculator, color: 'text-teal-600', desc: 'Tính toán A/B Testing' },
            { id: 'ROAS_FORECASTER', label: 'ROAS Forecaster', icon: TrendingUp, color: 'text-green-600', desc: 'Dự báo ROAS' },
            { id: 'ADS_HEALTH_CHECKER', label: 'Ads Health Checker', icon: Activity, color: 'text-rose-500', desc: 'Kiểm tra sức khỏe quảng cáo' },
            { id: 'TOOLKIT', label: 'Bộ Công Cụ', icon: Zap, color: 'text-amber-500', desc: 'Các tiện ích hỗ trợ khác' },
        ]
    },
    {
        title: "Learning & Plans",
        icon: GraduationCap,
        description: "Nâng cao kỹ năng và quản lý công việc hiệu quả.",
        color: "text-blue-600",
        items: [
            { id: 'HOME', label: 'Dịch văn bản', icon: Home, color: 'text-blue-500', desc: 'Công cụ dịch thuật' },
            { id: 'LEARN_SELECT', label: 'Bắt đầu học', icon: GraduationCap, color: 'text-indigo-500', desc: 'Học từ vựng tiếng Anh' },
            { id: 'VOCAB_MANAGER', label: 'Quản lý từ vựng', icon: Library, color: 'text-emerald-500', desc: 'Kho từ vựng cá nhân' },
            { id: 'PLAN_CALENDAR', label: 'Lịch thanh toán', icon: Calendar, color: 'text-rose-500', desc: 'Quản lý hạn thanh toán' },
            { id: 'PLAN_LIST', label: 'Danh sách Plans', icon: List, color: 'text-rose-400', desc: 'Quản lý các gói đăng ký' },
            { id: 'TODO', label: 'To-Do List', icon: CheckSquare, color: 'text-indigo-600', desc: 'Danh sách việc cần làm' },
        ]
    }
];

// Sub-components defined BEFORE LandingPage to avoid hoisting/scope issues

const NavGroup = ({ category, activeId, setActiveId }: { category: any, activeId: string, setActiveId: (id: string) => void }) => {
    const [expanded, setExpanded] = React.useState(true);
    const Icon = category.icon;

    return (
        <div className="mb-4 pb-4 border-b border-slate-100 last:mb-0 last:pb-0 last:border-0">
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${expanded ? 'text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <div className="flex items-center gap-2">
                    <Icon size={16} className={category.color} />
                    <span>{category.title}</span>
                </div>
                {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>

            {expanded && (
                <div className="mt-1 space-y-0.5 pl-2">
                    {category.items.map((item: any) => {
                        const ItemIcon = item.icon;
                        const isActive = activeId === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveId(item.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <ItemIcon size={14} className={isActive ? 'text-indigo-600' : item.color} />
                                <span className="text-left line-clamp-1">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const FeaturePreview = ({ featureId, setView }: { featureId: string, setView: (view: ViewState) => void }) => {
    // Find feature data
    let activeItem: any = null;
    for (const cat of FEATURE_CATEGORIES) {
        const found = cat.items.find(i => i.id === featureId);
        if (found) {
            activeItem = found;
            break;
        }
    }

    if (!activeItem) return null;
    const Icon = activeItem.icon;

    // Render specific demo content based on activeItem.id
    const renderFeatureDemo = () => {
        switch (activeItem.id) {
            case 'HOOK_GENERATOR':
                return <HookGeneratorDemo />;

            case 'PERSONA_BUILDER':
                return <PersonaBuilderDemo />;

            case 'MASTERMIND_STRATEGY':
            case 'STRATEGIC_MODEL_GENERATOR':
                return <StrategicModelDemo />;

            case 'CONTENT_WRITER':
            case 'CONTENT_GENERATOR':
                return <ContentGeneratorDemo />;

            case 'IMC_PLANNER':
                return <IMCPlannerDemo />;

            case 'ADS_HEALTH_CHECKER':
                return <AdsHealthCheckerDemo />;

            default:
                return (
                    <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                        <Zap size={48} className="mb-4 text-slate-200" strokeWidth={1} />
                        <p className="font-medium">Chọn tính năng để xem demo chi tiết</p>
                    </div>
                );
        }
    };


    return (
        <div className="h-full flex flex-col">
            {/* Fake App Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="text-slate-400"><Icon size={20} /></div>
                    <span className="text-sm font-semibold text-slate-700">/ {activeItem.label}</span>
                </div>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-8 bg-slate-50/30 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8 animate-fade-in relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl ${activeItem.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} flex items-center justify-center mb-4`}>
                                <Icon size={24} className={activeItem.color} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">{activeItem.label}</h2>

                            {/* P/I/O Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase">
                                        <Zap size={14} /> Tác dụng
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium">
                                        {FEATURE_INFO[activeItem.id as keyof typeof FEATURE_INFO]?.purpose || activeItem.desc}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase">
                                        <Keyboard size={14} /> Đầu vào
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium">
                                        {FEATURE_INFO[activeItem.id as keyof typeof FEATURE_INFO]?.input || "Thông tin cơ bản về yêu cầu của bạn."}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase">
                                        <Monitor size={14} /> Đầu ra
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium">
                                        {FEATURE_INFO[activeItem.id as keyof typeof FEATURE_INFO]?.output || "Kết quả chi tiết được hiển thị bên dưới."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setView(activeItem.id as ViewState)}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Zap size={18} />
                                    Dùng thử ngay
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Demo Interface */}
                    <div className="animate-slide-up">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kết quả mô phỏng</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {renderFeatureDemo()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const USPItem = ({ icon, color, title, desc }: { icon: React.ReactNode, color: string, title: string, desc: string }) => (
    <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-600">{desc}</p>
        </div>
    </div>
);

const PricingCard = ({ title, price, per, features, popular }: { title: string, price: string, per: string, features: string[], popular?: boolean }) => (
    <div className={`relative p-8 rounded-3xl border ${popular ? 'border-indigo-500 bg-slate-800' : 'border-slate-700 bg-slate-900'} flex flex-col`}>
        {popular && (
            <div className="absolute top-0 right-0 -mt-3 mr-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-glow">
                Phổ biến nhất
            </div>
        )}
        <h3 className={`text-lg font-medium mb-4 ${popular ? 'text-indigo-300' : 'text-slate-400'}`}>{title}</h3>
        <div className="mb-6">
            <span className="text-4xl font-bold text-white">{price}</span>
            <span className="text-slate-400 text-sm">{per}</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    {feature}
                </li>
            ))}
        </ul>
        <button className={`w-full py-3 rounded-xl font-bold transition-all ${popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>
            Chọn {title}
        </button>
    </div>
);

// Main Component
const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
    const [activeFeature, setActiveFeature] = React.useState('MASTERMIND_STRATEGY');

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('HOME')}>
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform -rotate-3">
                                <span className="text-white font-bold text-lg">O</span>
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                OptiMKT
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Tính năng</a>
                            <a href="#usp" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Ưu điểm</a>
                            <a href="#pricing" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Bảng giá</a>
                            <button
                                onClick={() => setView('HOME_DASHBOARD')}
                                className="bg-slate-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-slate-800 transition-all hover:shadow-lg flex items-center gap-2"
                            >
                                Vào ứng dụng <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden relative">
                <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-bl from-indigo-50 to-white opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -z-10 w-1/2 h-full bg-gradient-to-tr from-purple-50 to-white opacity-50 blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Phiên bản mới nhất 2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                        Giải pháp Marketing <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                            Tất cả trong một
                        </span>
                    </h1>

                    <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Tối ưu hóa quy trình marketing của bạn với bộ công cụ AI mạnh mẽ. Từ lập kế hoạch, viết nội dung đến phân tích dữ liệu - tất cả đều có tại OptiMKT.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => setView('HOME_DASHBOARD')}
                            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200"
                        >
                            Bắt đầu miễn phí
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                            <Zap size={20} className="text-yellow-500" /> Xem demo
                        </button>
                    </div>

                    {/* Hero Image / Dashboard Mockup */}
                    <div className="mt-16 mx-auto max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden bg-white p-2 sm:p-4 rotate-1 hover:rotate-0 transition-all duration-700">
                        <div className="bg-slate-50 rounded-xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
                            {/* Simplified Mockup UI */}
                            <div className="w-full h-full p-8 grid grid-cols-4 gap-4">
                                <div className="col-span-1 bg-white rounded-lg shadow-sm h-full flex flex-col gap-3 p-4">
                                    <div className="h-8 w-24 bg-slate-100 rounded"></div>
                                    <div className="space-y-2 mt-4">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 w-full bg-slate-50 rounded"></div>)}
                                    </div>
                                </div>
                                <div className="col-span-3 grid grid-rows-3 gap-4">
                                    <div className="row-span-1 grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="h-8 w-8 bg-blue-100 rounded-full mb-2"></div><div className="h-4 w-20 bg-slate-100 rounded"></div></div>
                                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="h-8 w-8 bg-green-100 rounded-full mb-2"></div><div className="h-4 w-20 bg-slate-100 rounded"></div></div>
                                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="h-8 w-8 bg-purple-100 rounded-full mb-2"></div><div className="h-4 w-20 bg-slate-100 rounded"></div></div>
                                    </div>
                                    <div className="row-span-2 bg-white rounded-lg shadow-sm p-4">
                                        <div className="flex justify-between mb-4"><div className="h-6 w-32 bg-slate-100 rounded"></div></div>
                                        <div className="h-32 bg-slate-50 rounded flex items-end justify-around pb-2 px-2">
                                            {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                                <div key={i} className="w-8 bg-indigo-200 rounded-t" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-bold text-indigo-600 tracking-wide uppercase mb-2">Trải nghiệm ứng dụng</h2>
                        <p className="text-3xl md:text-4xl font-extrabold text-slate-900">Giao diện tất cả trong một</p>
                        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                            Khám phá kho công cụ mạnh mẽ được tổ chức khoa học, giúp bạn dễ dàng truy cập và tối ưu hóa quy trình làm việc.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col lg:flex-row h-[700px] lg:h-[800px]">
                        {/* Fake Sidebar */}
                        <div className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-white">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                        <Zap size={18} />
                                    </div>
                                    OptiMKT
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {FEATURE_CATEGORIES.map((category, idx) => (
                                    <NavGroup key={idx} category={category} activeId={activeFeature} setActiveId={setActiveFeature} />
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">U</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">User Demo</p>
                                        <p className="text-xs text-slate-500 truncate">user@optimkt.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                            <FeaturePreview featureId={activeFeature} setView={setView} />
                        </div>
                    </div>
                </div>
            </section>


            {/* USP Section */}
            <section id="usp" className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6"> Tại sao chọn <span className="text-indigo-600">OptiMKT</span>?</h2>
                            <div className="space-y-8">
                                <USPItem
                                    icon={<Rocket className="text-white" size={24} />}
                                    color="bg-blue-500"
                                    title="Tốc độ vượt trội"
                                    desc="Hệ thống được tối ưu hóa để vận hành mượt mà, giúp bạn tiết kiệm thời gian quý báu."
                                />
                                <USPItem
                                    icon={<Zap className="text-white" size={24} />}
                                    color="bg-yellow-500"
                                    title="AI thông minh"
                                    desc="Tích hợp các mô hình AI tiên tiến nhất để hỗ trợ sáng tạo và ra quyết định chính xác."
                                />
                                <USPItem
                                    icon={<Shield className="text-white" size={24} />}
                                    color="bg-green-500"
                                    title="Bảo mật & An toàn"
                                    desc="Dữ liệu doanh nghiệp của bạn được mã hóa và bảo vệ theo tiêu chuẩn quốc tế."
                                />
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl transform rotate-3 opacity-20 blur-xl"></div>
                            <div className="relative bg-white border border-slate-100 rounded-2xl p-8 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                        <Star size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800">Đánh giá từ chuyên gia</h4>
                                        <div className="flex text-yellow-500 gap-1">
                                            <Star size={16} fill="currentColor" />
                                            <Star size={16} fill="currentColor" />
                                            <Star size={16} fill="currentColor" />
                                            <Star size={16} fill="currentColor" />
                                            <Star size={16} fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-600 italic leading-relaxed">
                                    "OptiMKT đã thay đổi hoàn toàn cách đội ngũ marketing của chúng tôi làm việc. Năng suất tăng gấp 3 lần nhờ các công cụ AI tự động hóa."
                                </p>
                                <div className="mt-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Hoàng Kim</p>
                                        <p className="text-xs text-slate-500">CMO tại TravelVibe</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-bold text-indigo-400 tracking-wide uppercase mb-2">Bảng giá linh hoạt</h2>
                        <p className="text-3xl md:text-4xl font-extrabold text-white">Chọn gói phù hợp với bạn</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PricingCard
                            title="Starter"
                            price="0đ"
                            per="/ tháng"
                            features={["Truy cập tính năng cơ bản", "1 User", "50 Credit/tháng", "Hỗ trợ qua email"]}
                        />
                        <PricingCard
                            title="Professional"
                            price="499.000đ"
                            per="/ tháng"
                            popular
                            features={["Tất cả tính năng Starter", "5 Users", "Không giới hạn Credit", "Phân tích nâng cao", "Hỗ trợ 24/7"]}
                        />
                        <PricingCard
                            title="Enterprise"
                            price="Liên hệ"
                            per=""
                            features={["Giải pháp tùy chỉnh", "Không giới hạn User", "API Access", "Training trực tiếp", "Account Manager riêng"]}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">O</span>
                        </div>
                        <span className="font-bold text-slate-800">OptiMKT</span>
                    </div>
                    <p className="mb-4">&copy; 2026 OptiMKT. All rights reserved.</p>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="hover:text-indigo-600">Điều khoản</a>
                        <a href="#" className="hover:text-indigo-600">Bảo mật</a>
                        <a href="#" className="hover:text-indigo-600">Liên hệ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
