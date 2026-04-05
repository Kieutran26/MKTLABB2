import React, { useState } from 'react';
import {
    Brain, Lightbulb, Image as ImageIcon, TrendingUp,
    Target, Users, Map, Heart, Zap, PenTool, CalendarDays,
    Mail, Film, MonitorPlay, PieChart, Calculator, Activity,
    ShieldCheck, Radar, Compass, DollarSign, FileText, FileCheck,
    BrainCircuit, Terminal, Link2, PlusSquare, List, ChevronDown, ChevronRight,
    ArrowLeft, Banknote
} from 'lucide-react';

interface FeaturesGuideProps {
    onBack?: () => void;
}

const cardClass =
    'overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const iconWrapLg =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200/90 bg-stone-50 text-stone-600';

const iconWrapSm =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200/90 bg-stone-50 text-stone-500';

const FeaturesGuide: React.FC<FeaturesGuideProps> = ({ onBack }) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>('strategy');

    const categories = [
        {
            id: 'strategy',
            title: 'Strategy & Research',
            icon: Brain,
            description: 'Các công cụ giúp bạn nghiên cứu thị trường, hiểu khách hàng và xây dựng chiến lược.',
            features: [
                {
                    name: 'Mastermind Strategy',
                    icon: Brain,
                    purpose: 'Xây dựng chiến lược marketing tổng thể cho thương hiệu.',
                    howItWorks: 'Nhập thông tin thương hiệu → AI phân tích và đề xuất chiến lược theo 4 giai đoạn: Awareness, Consideration, Conversion, Loyalty.'
                },
                {
                    name: 'Strategic Models',
                    icon: Target,
                    purpose: 'Tạo các mô hình chiến lược: AIDA, 4P, 5W1H, SMART.',
                    howItWorks: 'Chọn mô hình → Nhập thông tin sản phẩm/dịch vụ → AI tự động tạo nội dung theo framework được chọn.'
                },
                {
                    name: 'Insight Finder',
                    icon: BrainCircuit,
                    purpose: 'Tìm kiếm insight khách hàng từ dữ liệu và xu hướng.',
                    howItWorks: 'Nhập ngành hàng và đối tượng → AI phân tích hành vi, pain points và đưa ra insight hữu ích.'
                },
                {
                    name: 'Customer Journey',
                    icon: Map,
                    purpose: 'Vẽ hành trình khách hàng từ nhận biết đến trung thành.',
                    howItWorks: 'Nhập ngành hàng và mục tiêu → AI tạo bản đồ 4 giai đoạn với touchpoints, thông điệp và nội dung gợi ý.'
                },
                {
                    name: 'Brand Vault',
                    icon: ShieldCheck,
                    purpose: 'Lưu trữ và quản lý thông tin thương hiệu.',
                    howItWorks: 'Tạo profile thương hiệu với logo, màu sắc, tone of voice → Sử dụng làm nguồn dữ liệu cho các công cụ khác.'
                },
                {
                    name: 'Persona Builder',
                    icon: Users,
                    purpose: 'Xây dựng chân dung khách hàng mục tiêu.',
                    howItWorks: 'Nhập đặc điểm demographic → AI tạo persona chi tiết với hành vi, sở thích, pain points.'
                },
                {
                    name: 'Rival Radar',
                    icon: Radar,
                    purpose: 'Phân tích đối thủ cạnh tranh.',
                    howItWorks: 'Nhập tên đối thủ → AI thu thập và phân tích điểm mạnh, yếu, chiến lược của họ.'
                },
                {
                    name: 'Brand Positioning',
                    icon: Compass,
                    purpose: 'Xác định vị thế thương hiệu trên thị trường.',
                    howItWorks: 'Nhập thông tin thương hiệu và đối thủ → AI đề xuất USP, positioning statement và strategy map.'
                },
                {
                    name: 'Pricing Analyzer',
                    icon: DollarSign,
                    purpose: 'Phân tích và tối ưu chiến lược giá.',
                    howItWorks: 'Nhập giá hiện tại, chi phí, đối thủ → AI tính toán margin, break-even và đề xuất điều chỉnh.'
                },
                {
                    name: 'Audience Emotion Map',
                    icon: Heart,
                    purpose: 'Vẽ bản đồ cảm xúc khách hàng qua từng giai đoạn.',
                    howItWorks: 'Nhập pain point và ngành hàng → AI phân tích cảm xúc theo Plutchik\'s Wheel với intensity score và content hooks.'
                },
            ]
        },
        {
            id: 'ideation',
            title: 'Ideation & Content',
            icon: Lightbulb,
            description: 'Các công cụ hỗ trợ sáng tạo nội dung và lên kế hoạch đăng bài.',
            features: [
                {
                    name: 'Hook Generator',
                    icon: Zap,
                    purpose: 'Tạo câu mở đầu cuốn hút cho content.',
                    howItWorks: 'Nhập chủ đề và đối tượng → AI tạo nhiều phiên bản hook với các góc nhìn khác nhau.'
                },
                {
                    name: 'Viết Content',
                    icon: PenTool,
                    purpose: 'Viết bài đăng mạng xã hội, blog, email...',
                    howItWorks: 'Chọn nền tảng và tone → Nhập topic → AI tạo nội dung hoàn chỉnh theo format phù hợp.'
                },
                {
                    name: 'Mindmap AI',
                    icon: BrainCircuit,
                    purpose: 'Tạo sơ đồ tư duy để brainstorm ý tưởng.',
                    howItWorks: 'Nhập chủ đề trung tâm → AI tự động phân nhánh thành các ý tưởng con có liên quan.'
                },
                {
                    name: 'SCAMPER Ideation',
                    icon: Lightbulb,
                    purpose: 'Sử dụng framework SCAMPER để tìm ý tưởng mới.',
                    howItWorks: 'Nhập sản phẩm/dịch vụ → AI áp dụng 7 kỹ thuật SCAMPER để đề xuất cải tiến.'
                },
                {
                    name: 'Smart Content Calendar',
                    icon: CalendarDays,
                    purpose: 'Lên lịch đăng bài thông minh.',
                    howItWorks: 'Import chiến lược từ Mastermind → AI đề xuất lịch đăng bài theo từng giai đoạn và kênh.'
                },
                {
                    name: 'Auto Brief',
                    icon: FileText,
                    purpose: 'Tạo brief cho designer/agency một cách nhanh chóng.',
                    howItWorks: 'Nhập yêu cầu cơ bản → AI tạo brief chi tiết với objectives, deliverables, timeline.'
                },
                {
                    name: 'SOP Builder',
                    icon: FileCheck,
                    purpose: 'Tạo quy trình chuẩn (SOP) cho team.',
                    howItWorks: 'Nhập tên quy trình → AI tạo các bước thực hiện chi tiết, checklist và lưu ý.'
                },
                {
                    name: 'Creative Angle Explorer',
                    icon: Lightbulb,
                    purpose: 'Khám phá các góc nhìn sáng tạo cho content.',
                    howItWorks: 'Nhập sản phẩm và đối tượng → AI đề xuất nhiều góc tiếp cận độc đáo.'
                },
                {
                    name: 'Kho Prompt',
                    icon: Terminal,
                    purpose: 'Lưu trữ và quản lý các prompt AI.',
                    howItWorks: 'Thêm prompt với tiêu đề và model → Tìm kiếm và copy nhanh khi cần sử dụng.'
                },
            ]
        },
        {
            id: 'design',
            title: 'Design & Visuals',
            icon: ImageIcon,
            description: 'Các công cụ hỗ trợ thiết kế và tạo hình ảnh.',
            features: [
                {
                    name: 'Visual Email',
                    icon: Mail,
                    purpose: 'Tạo email marketing với hình ảnh đẹp.',
                    howItWorks: 'Chọn template → Tùy chỉnh nội dung và hình ảnh → Export HTML để gửi.'
                },
                {
                    name: 'Frame Visual',
                    icon: Film,
                    purpose: 'Tạo khung hình cho video và ảnh.',
                    howItWorks: 'Upload hình ảnh → Chọn frame và overlay → Download ảnh hoàn chỉnh.'
                },
                {
                    name: 'Mockup Generator',
                    icon: MonitorPlay,
                    purpose: 'Tạo mockup sản phẩm chuyên nghiệp.',
                    howItWorks: 'Upload design → Chọn thiết bị/packaging → AI tự động tạo mockup realistic.'
                },
                {
                    name: 'Tạo dự án KV',
                    icon: PlusSquare,
                    purpose: 'Tạo mới dự án Key Visual.',
                    howItWorks: 'Nhập yêu cầu sáng tạo → AI đề xuất concept và tạo prompt cho hình ảnh.'
                },
                {
                    name: 'Danh sách KV',
                    icon: List,
                    purpose: 'Quản lý các dự án Key Visual đã tạo.',
                    howItWorks: 'Xem danh sách → Mở, chỉnh sửa hoặc xóa các dự án cũ.'
                },
            ]
        },
        {
            id: 'ads',
            title: 'Ads & Performance',
            icon: TrendingUp,
            description: 'Các công cụ đo lường và tối ưu hiệu suất quảng cáo.',
            features: [
                {
                    name: 'Budget Allocator',
                    icon: PieChart,
                    purpose: 'Phân bổ ngân sách marketing tối ưu.',
                    howItWorks: 'Nhập tổng ngân sách và mục tiêu → AI đề xuất cách chia ngân sách theo kênh và giai đoạn.'
                },
                {
                    name: 'UTM Builder',
                    icon: Link2,
                    purpose: 'Tạo link UTM để tracking chiến dịch.',
                    howItWorks: 'Nhập URL và các tham số → Tự động tạo link với UTM parameters chuẩn.'
                },
                {
                    name: 'A/B Testing Calc',
                    icon: Calculator,
                    purpose: 'Tính toán sample size và significance cho A/B test.',
                    howItWorks: 'Nhập số liệu hiện tại → Tính sample size cần thiết và thời gian chạy test.'
                },
                {
                    name: 'ROAS Forecaster',
                    icon: TrendingUp,
                    purpose: 'Dự báo ROAS và hiệu quả quảng cáo.',
                    howItWorks: 'Nhập ngân sách, CPC, CVR → AI tính doanh thu dự kiến và ROAS.'
                },
                {
                    name: 'Ads Health Checker',
                    icon: Activity,
                    purpose: 'Kiểm tra "sức khỏe" chiến dịch quảng cáo.',
                    howItWorks: 'Nhập metrics hiện tại → AI đánh giá và đề xuất cải thiện.'
                },
                {
                    name: 'Theo dõi Lương',
                    icon: Banknote,
                    purpose: 'Quản lý thu nhập và chi phí cá nhân.',
                    howItWorks: 'Nhập lương và chi tiêu hàng tháng → Theo dõi và phân tích xu hướng tài chính.'
                },
            ]
        }
    ];

    return (
        <div className="min-h-full bg-[#FCFDFC] font-sans text-stone-900">
            <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
                <div className="mb-10">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50 hover:text-stone-900"
                        >
                            <ArrowLeft size={18} strokeWidth={1.5} />
                            Quay lại
                        </button>
                    )}
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Tài liệu sản phẩm
                    </p>
                    <h1 className="mb-3 text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
                        Hướng dẫn sử dụng
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
                        Tìm hiểu mục đích và cách hoạt động của tất cả các tính năng trong OptiMKT.
                    </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                    {categories.map((category) => (
                        <div key={category.id} className={cardClass}>
                            <button
                                type="button"
                                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-stone-50/70 sm:p-6"
                                aria-expanded={expandedCategory === category.id}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <div className={iconWrapLg}>
                                        <category.icon size={22} strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <h2 className="font-medium tracking-tight text-stone-900">{category.title}</h2>
                                        <p className="mt-0.5 text-sm text-stone-500">{category.features.length} công cụ</p>
                                    </div>
                                </div>
                                {expandedCategory === category.id ? (
                                    <ChevronDown size={20} className="shrink-0 text-stone-400" strokeWidth={1.5} />
                                ) : (
                                    <ChevronRight size={20} className="shrink-0 text-stone-400" strokeWidth={1.5} />
                                )}
                            </button>

                            {expandedCategory === category.id && (
                                <div className="border-t border-stone-200/90 bg-stone-50/30">
                                    {category.features.map((feature, index) => (
                                        <div
                                            key={feature.name}
                                            className={`px-5 py-5 sm:px-6 sm:py-6 ${index !== category.features.length - 1 ? 'border-b border-stone-200/80' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={iconWrapSm}>
                                                    <feature.icon size={18} strokeWidth={1.5} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="mb-4 text-base font-medium tracking-tight text-stone-900">
                                                        {feature.name}
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                                                Mục đích
                                                            </p>
                                                            <p className="text-sm leading-relaxed text-stone-700">{feature.purpose}</p>
                                                        </div>
                                                        <div>
                                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                                                Cách hoạt động
                                                            </p>
                                                            <p className="text-sm leading-relaxed text-stone-600">{feature.howItWorks}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesGuide;
