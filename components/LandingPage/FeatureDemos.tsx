import React, { useState } from 'react';
import {
    Zap, Video, Mail, Globe, MessageSquare, Copy, CheckCircle, CheckCircle2, Eye, Info,
    Sliders, Target, Frown, Heart, Users, Edit2, Trash2, X, Check,
    Grid, Filter, LayoutTemplate, HelpCircle, Package, DollarSign, MapPin, Megaphone, Sparkles, Download, ArrowRight,
    PenTool, Facebook, Instagram, Linkedin, AtSign, Search, Square, CheckSquare,
    Activity, AlertTriangle, XCircle, TrendingUp, Scissors, RefreshCw, Layout, ShoppingBag
} from 'lucide-react';

// --- SHARED HELPERS ---
const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-50 text-green-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
        </button>
    );
};

// ==========================================
// 1. HOOK GENERATOR DEMO
// ==========================================

const PSYCHOLOGY_TRIGGERS: Record<string, { label: string; color: string; description: string }> = {
    'Fear of Loss': { label: 'Sợ mất mát', color: 'red', description: 'Kích hoạt nỗi sợ bỏ lỡ cơ hội hoặc mất điều quan trọng' },
    'Curiosity Gap': { label: 'Khoảng trống tò mò', color: 'purple', description: 'Tạo cảm giác thiếu thông tin, muốn tìm hiểu thêm' },
    'Social Proof': { label: 'Bằng chứng xã hội', color: 'blue', description: 'Sử dụng hành vi đám đông để tạo niềm tin' },
};

const PsychologyTag = ({ trigger }: { trigger: string }) => {
    const info = PSYCHOLOGY_TRIGGERS[trigger] || { label: trigger, color: 'slate', description: '' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-${info.color}-50 text-${info.color}-600 border border-${info.color}-200`}>
            <Info size={10} /> {info.label}
        </span>
    );
};

export const HookGeneratorDemo = () => {
    const [activeTab, setActiveTab] = useState<'video' | 'social'>('video');
    const hookData = {
        analysis: {
            identified_pain_point: "Khách hàng chán nản vì dùng nhiều loại kem chống nắng nhưng vẫn bị bóng dầu, gây mụn ẩn.",
            identified_desire: "Muốn tìm kiếm một loại kem chống nắng 'nhẹ như không', kiềm dầu cả ngày và nâng tone tự nhiên."
        },
        hooks: {
            video_shorts: [
                { style: "Stop Scrolling", hook_text: "Dừng ngay việc bôi kem chống nắng sai cách nếu bạn không muốn mặt bóng như 'chảo dầu'!", visual_cue: "Cảnh quay cận mặt bóng dầu, sau đó chuyển sang làn da mịn màng.", psychology_trigger: "Fear of Loss" },
                { style: "Secret Reveal", hook_text: "Bí mật của các beauty blogger để có lớp nền lì mịn suốt 8 tiếng mà không cần phấn phủ.", visual_cue: "So sánh một bên mặt dùng sản phẩm vs bên mặt thường.", psychology_trigger: "Curiosity Gap" }
            ],
            social_post: [
                { style: "Storytelling", hook_text: "3 sai lầm mình ước mình biết sớm hơn trước khi chi 5 triệu tiền trị mụn...", psychology_trigger: "Fear of Loss", hashtag_suggestion: "#skincare #chongnang #reviewlamdep" },
                { style: "Social Proof", hook_text: "Tại sao 10,000 cô gái đã chuyển sang dùng 'em' chống nắng này trong tháng qua?", psychology_trigger: "Social Proof", hashtag_suggestion: "#trending #beauty #musthave" }
            ]
        }
    };

    return (
        <div className="space-y-6">
            {/* Analysis Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">🔍 Insight Analysis (AI Detected)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Pain Point</div>
                        <p className="text-sm text-red-800 font-medium">{hookData.analysis.identified_pain_point}</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Desire</div>
                        <p className="text-sm text-green-800 font-medium">{hookData.analysis.identified_desire}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5">
                <button onClick={() => setActiveTab('video')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'video' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Video size={16} /> Video Hooks
                </button>
                <button onClick={() => setActiveTab('social')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'social' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <MessageSquare size={16} /> Social Posts
                </button>
            </div>

            {/* Hook Cards */}
            <div className="space-y-4">
                {(activeTab === 'video' ? hookData.hooks.video_shorts : hookData.hooks.social_post).map((hook, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{hook.style}</span>
                                <h4 className="text-lg font-black text-slate-800 mt-1">{hook.hook_text}</h4>
                            </div>
                            <CopyButton text={hook.hook_text} />
                        </div>
                        {'visual_cue' in hook && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye size={14} className="text-amber-600" />
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Visual Cue</span>
                                </div>
                                <p className="text-sm text-amber-800 font-medium">{(hook as any).visual_cue}</p>
                            </div>
                        )}
                        <PsychologyTag trigger={hook.psychology_trigger} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// 2. PERSONA BUILDER DEMO
// ==========================================

const PersonalitySliderDisplay = ({ trait }: { trait: any }) => {
    const getColor = (val: number) => {
        if (val < 30) return 'bg-rose-500';
        if (val < 70) return 'bg-purple-500';
        return 'bg-indigo-500';
    };
    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">
                <span>{trait.leftLabel}</span>
                <span>{trait.rightLabel}</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-full h-2 bg-slate-200 rounded-lg overflow-hidden relative">
                    <div className={`h-full absolute top-0 left-0 rounded-lg ${getColor(trait.value)}`} style={{ width: `${trait.value}%` }}></div>
                    <div className="w-3 h-3 bg-white border-2 border-slate-400 rounded-full absolute top-1/2 -translate-y-1/2 -ml-1.5 shadow-sm" style={{ left: `${trait.value}%` }}></div>
                </div>
                <div className="w-8 text-center text-xs font-bold text-slate-500">{trait.value}</div>
            </div>
        </div>
    );
};

export const PersonaBuilderDemo = () => {
    const mockPersona = {
        fullname: "Minh Anh Designer",
        jobTitle: "Freelance Graphic Designer",
        ageRange: "24-28",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        bio: "Minh Anh là một Freelancer năng động, sống tại TP.HCM. Cô ấy yêu thích sự tự do, sáng tạo nhưng luôn áp lực về thu nhập không ổn định. Thường xuyên làm việc tại quán cafe và tìm kiếm các công cụ AI để tối ưu hiệu suất.",
        personality: [
            { leftLabel: 'Hướng nội', rightLabel: 'Hướng ngoại', value: 65 },
            { leftLabel: 'Cảm tính', rightLabel: 'Lý trí', value: 40 },
        ],
        goals: ["Tăng thu nhập thụ động", "Xây dựng thương hiệu cá nhân", "Cân bằng cuộc sống - công việc"],
        frustrations: ["Khách hàng ép giá, delay thanh toán", "Bí ý tưởng sáng tạo", "Không có thời gian chăm sóc bản thân"],
        motivations: ["Sự công nhận", "Tự do tài chính", "Trải nghiệm mới"],
        preferredChannels: ["Instagram", "Behance", "TikTok"]
    };

    return (
        <div className="bg-white rounded-3xl w-full shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Header */}
                    <div className="md:w-1/3 flex flex-col items-center text-center space-y-4 border-r border-slate-100 pr-8">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                            <img src={mockPersona.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{mockPersona.fullname}</h2>
                            <p className="text-indigo-600 font-medium text-sm">{mockPersona.jobTitle}</p>
                            <span className="text-xs text-slate-500">{mockPersona.ageRange} tuổi</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 italic leading-relaxed w-full text-left">
                            "{mockPersona.bio}"
                        </div>
                    </div>

                    {/* Details */}
                    <div className="md:w-2/3 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Sliders size={16} className="text-indigo-500" /> Tính cách
                            </h3>
                            <div className="grid grid-cols-1 gap-y-2">
                                {mockPersona.personality.map((trait, idx) => (
                                    <PersonalitySliderDisplay key={idx} trait={trait} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                                <h4 className="font-bold text-green-700 mb-2 flex items-center gap-1 text-xs"><Target size={12} /> Mục tiêu</h4>
                                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                    {mockPersona.goals.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                            </div>
                            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                                <h4 className="font-bold text-red-700 mb-2 flex items-center gap-1 text-xs"><Frown size={12} /> Nỗi đau</h4>
                                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                    {mockPersona.frustrations.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. STRATEGIC MODEL DEMO
// ==========================================

const EditableList = ({ items, title, colorClass }: { items: string[], title: string, colorClass: string }) => (
    <div className={`p-4 rounded-xl h-full border-t-4 bg-slate-50/50 shadow-sm flex flex-col ${colorClass}`}>
        <h4 className="font-bold uppercase text-[10px] tracking-wide mb-3 opacity-80">{title}</h4>
        <ul className="space-y-2 flex-1">
            {items.map((item, i) => (
                <li key={i} className="text-[11px] md:text-xs text-slate-700 leading-relaxed flex gap-2">
                    <span className="text-slate-400 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0"></span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

export const StrategicModelDemo = () => {
    const swotData = {
        strengths: ["Công nghệ lõi AI độc quyền", "Giao diện UX/UI tối giản, dễ dùng"],
        weaknesses: ["Thương hiệu mới, chưa nhiều case study", "Ngân sách marketing còn hạn chế"],
        opportunities: ["Thị trường Marketing Tech đang bùng nổ", "Nhu cầu tự động hóa của SME cao"],
        threats: ["Đối thủ lớn như ChatGPT, Jasper", "Chi phí quảng cáo ngày càng tăng"]
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50/30 rounded-xl"><EditableList items={swotData.strengths} title="Strengths" colorClass="border-green-500 text-green-800" /></div>
                <div className="bg-red-50/30 rounded-xl"><EditableList items={swotData.weaknesses} title="Weaknesses" colorClass="border-red-500 text-red-800" /></div>
                <div className="bg-blue-50/30 rounded-xl"><EditableList items={swotData.opportunities} title="Opportunities" colorClass="border-blue-500 text-blue-800" /></div>
                <div className="bg-orange-50/30 rounded-xl"><EditableList items={swotData.threats} title="Threats" colorClass="border-orange-500 text-orange-800" /></div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
                <Sparkles size={10} /> Generated by OptiMKT AI Strategy Engine
            </div>
        </div>
    );
};

// ==========================================
// 4. CONTENT GENERATOR DEMO
// ==========================================

export const ContentGeneratorDemo = () => {
    const contentData = {
        facebook: "🔥 KHÔNG GIỎI VIẾT LÁCH VẪN LÀM CONTENT ĐỈNH?\n\nBạn tốn hàng giờ để nặn ra một caption Facebook? Bạn bí ý tưởng mỗi khi cần viết bài quảng cáo?\n\n👉 Đừng lo, OptiMKT sẽ giúp bạn!\n\n✅ Tạo content đa kênh trong 3 giây\n✅ Tự động hoá ý tưởng theo phễu khách hàng\n✅ Tối ưu cho từng nền tảng (Fb, Insta, TikTok)\n\nThử ngay hôm nay để bùng nổ doanh số! 🚀\n#OptiMKT #MarketingAI #ContentCreator"
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-blue-50">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Facebook size={16} className="text-blue-600" />
                    Facebook Post
                </div>
                <button className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 bg-white rounded-lg border border-slate-200 text-slate-500">
                    <Copy size={12} /> Copy
                </button>
            </div>
            <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {contentData.facebook}
            </div>
        </div>
    );
};

// ==========================================
// 5. ADS HEALTH CHECKER DEMO
// ==========================================

export const AdsHealthCheckerDemo = () => {
    const result = {
        health_score: 42,
        status: "Cần cấp cứu gấp",
        diagnosis: {
            primary_issue: "Giá thầu (CPM) quá cao, CTR thấp báo động",
            explanation: "Quảng cáo của bạn đang tiếp cận sai đối tượng hoặc nội dung không đủ hấp dẫn (Creative Fatigue)."
        },
        metrics_analysis: {
            ctr: { value: 0.008, assessment: "Thấp (Nguy hiểm)" },
            cpm: { value: 152000, assessment: "Cao bất thường" },
            cpc: { value: 19000, assessment: "Đắt" },
            roas: { value: 0.8, assessment: "Lỗ vốn" }
        },
        actionable_steps: [
            { action: "Sáng tạo lại", detail: "Thay đổi hình ảnh/video mới ngay. Mẫu quảng cáo hiện tại đã bị bão hòa." },
            { action: "Cắt giảm", detail: "Tắt ngay các nhóm quảng cáo có CPC > 15,000đ để bảo toàn ngân sách." }
        ]
    };

    const getScoreColor = (score: number) => score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';

    return (
        <div className="space-y-4">
            {/* Score Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-6">
                    <div className={`shrink-0 w-24 h-24 rounded-full border-[5px] flex items-center justify-center ${getScoreColor(result.health_score).replace('bg-', 'border-').split(' ')[2]} bg-white`}>
                        <div className="text-center">
                            <span className={`text-3xl font-black ${getScoreColor(result.health_score).split(' ')[0]} tracking-tighter`}>{result.health_score}</span>
                            <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Health Score</div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-2 border ${getScoreColor(result.health_score).replace('text-', 'bg-').replace('bg-', 'text-').split(' ').slice(0, 2).join(' ')}`}>
                            {result.status}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1 leading-tight">{result.diagnosis.primary_issue}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">"{result.diagnosis.explanation}"</p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2">
                {Object.entries(result.metrics_analysis).map(([key, m]: [string, any]) => (
                    <div key={key} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{key}</div>
                        <div className="text-sm font-bold text-slate-900">{key === 'ctr' || key === 'roas' ? (m.value * (key === 'ctr' ? 100 : 1)).toFixed(1) + (key === 'ctr' ? '%' : 'x') : (m.value / 1000) + 'k'}</div>
                        <div className={`text-[9px] font-bold ${m.assessment.includes('Thấp') || m.assessment.includes('Cao') ? 'text-rose-500' : 'text-amber-500'}`}>{m.assessment.split(' ')[0]}</div>
                    </div>
                ))}
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Phác đồ xử lý</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {result.actionable_steps.map((step, idx) => (
                        <div key={idx} className="p-4 flex gap-3">
                            <div className="shrink-0 mt-0.5">
                                {idx === 0 ? <RefreshCw className="w-4 h-4 text-blue-500" /> : <Scissors className="w-4 h-4 text-rose-500" />}
                            </div>
                            <div>
                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700 mb-1">{step.action}</span>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{step.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 6. IMC PLANNER DEMO
// ==========================================

export const IMCPlannerDemo = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-[#8B5CF6] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Target size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">D: T-Shirt Essentials – Mặc Đẹp, Sắm Nhanh</h2>
                    <div className="flex items-center gap-3 text-white/80 text-sm font-medium">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white text-xs font-bold">D</span>
                        <span>•</span>
                        <span>áo thun</span>
                        <span>•</span>
                        <div className="flex items-center gap-1"><ShoppingBag size={14} /> Fashion</div>
                    </div>
                </div>
            </div>

            {/* Warnings */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase mb-1">
                    <AlertTriangle size={16} /> Golden Thread Warnings
                </div>
                <div className="space-y-1.5 pl-6">
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-2">
                        <CheckSquare size={14} className="text-emerald-500" />
                        KẾ HOẠCH LÀNH MẠNH: ROAS 0.9x là mục tiêu thực tế và an toàn.
                    </p>
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" />
                        Business Objective về doanh thu nhưng Marketing Objective chưa rõ hành vi mua hàng.
                    </p>
                </div>
            </div>

            {/* Strategic Foundation */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Target size={18} className="text-indigo-600" />
                    Strategic Foundation (Kim chỉ nam)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Business Obj */}
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 font-bold text-emerald-700 text-xs uppercase mb-2">
                            <DollarSign size={14} /> Business Objective
                        </div>
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                            Đạt doanh thu 50 triệu VND từ sản phẩm áo thun trong 4 tuần chiến dịch.
                        </p>
                    </div>

                    {/* Marketing Obj */}
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 font-bold text-blue-700 text-xs uppercase mb-2">
                            <TrendingUp size={14} /> Marketing Objective
                        </div>
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            Thúc đẩy 200 đơn hàng áo thun trong 4 tuần chiến dịch.
                        </p>
                    </div>

                    {/* Comm Obj */}
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 font-bold text-purple-700 text-xs uppercase mb-2">
                            <Megaphone size={14} /> Communication Objective
                        </div>
                        <p className="text-xs text-purple-800 font-medium leading-relaxed">
                            Tăng cường ý định mua hàng và kích thích hành động mua sắm áo thun của thương hiệu D.
                        </p>
                    </div>
                </div>
            </div>

            {/* Execution Model Placeholder */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Zap size={18} className="text-indigo-600" />
                    Execution Model (3 Giai đoạn)
                </h3>
                <div className="h-24 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
                    <Zap size={24} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">Chi tiết thực thi 3 giai đoạn (Awareness -{'>'} Consideration -{'>'} Conversion)</span>
                </div>
            </div>
        </div>
    );
};
