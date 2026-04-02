import React, { useState } from 'react';
import { Wrench, Type, Ratio, GitCompare, Terminal, Banknote, ChevronDown, ArrowLeft, FileText, Bell, HelpCircle, Link } from 'lucide-react';
import WordCounter from './WordCounter';
import AspectRatioCalculator from './AspectRatioCalculator';
import TextCompare from './TextCompare';
import LoremIpsumGenerator from './LoremIpsumGenerator';
import OneTimeReminder from './OneTimeReminder';
import ProblemToQuestion from './ProblemToQuestion';
import UnsplashLinkConverter from './UnsplashLinkConverter';
import PromptManager from '../PromptManager';
import SmartSalary from '../SmartSalary';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const iconBoxClass =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200/90 bg-stone-50 text-stone-600';

type ToolType = 'menu' | 'word-counter' | 'aspect-ratio' | 'text-compare' | 'lorem-ipsum' | 'one-time-reminder' | 'problem-to-question' | 'prompt-manager' | 'smart-salary' | 'unsplash-link';

interface Tool {
    id: ToolType;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const tools: Tool[] = [
    {
        id: 'word-counter',
        name: 'Đếm Từ',
        description: 'Đếm từ, ký tự, câu, đoạn văn và phân tích mật độ từ khóa',
        icon: <Type size={22} strokeWidth={1.5} />,
    },
    {
        id: 'aspect-ratio',
        name: 'Tỷ Lệ Khung Hình',
        description: 'Tính toán tỷ lệ khung hình từ kích thước hoặc ngược lại',
        icon: <Ratio size={22} strokeWidth={1.5} />,
    },
    {
        id: 'text-compare',
        name: 'So Sánh Văn Bản',
        description: 'So sánh và merge hai khối văn bản, hiển thị sự khác biệt',
        icon: <GitCompare size={22} strokeWidth={1.5} />,
    },
    {
        id: 'lorem-ipsum',
        name: 'Tạo Văn Bản Giả',
        description: 'Tạo Lorem Ipsum bằng tiếng Việt hoặc Latin cho thiết kế',
        icon: <FileText size={22} strokeWidth={1.5} />,
    },
    {
        id: 'one-time-reminder',
        name: 'Nhắc Việc Một Lần',
        description: 'Tạo nhắc việc và nhận thông báo trên trình duyệt',
        icon: <Bell size={22} strokeWidth={1.5} />,
    },
    {
        id: 'problem-to-question',
        name: 'Vấn Đề → Câu Hỏi',
        description: 'Chuyển vấn đề/than phiền thành câu hỏi có thể hành động',
        icon: <HelpCircle size={22} strokeWidth={1.5} />,
    },
    {
        id: 'prompt-manager',
        name: 'Kho Prompt',
        description: 'Lưu trữ và quản lý các prompt cho AI models',
        icon: <Terminal size={22} strokeWidth={1.5} />,
    },
    {
        id: 'smart-salary',
        name: 'Theo Dõi Lương',
        description: 'Quản lý và theo dõi lương, thu nhập hàng tháng',
        icon: <Banknote size={22} strokeWidth={1.5} />,
    },
    {
        id: 'unsplash-link',
        name: 'Chuyển Đổi Link Unsplash',
        description: 'Làm sạch và tối ưu link ảnh Unsplash',
        icon: <Link size={22} strokeWidth={1.5} />,
    },
];

const ToolkitPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ToolType>('menu');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const getToolComponent = () => {
        switch (activeTool) {
            case 'word-counter':
                return <WordCounter />;
            case 'aspect-ratio':
                return <AspectRatioCalculator />;
            case 'text-compare':
                return <TextCompare />;
            case 'lorem-ipsum':
                return <LoremIpsumGenerator />;
            case 'one-time-reminder':
                return <OneTimeReminder />;
            case 'problem-to-question':
                return <ProblemToQuestion />;
            case 'prompt-manager':
                return <PromptManager />;
            case 'smart-salary':
                return <SmartSalary />;
            case 'unsplash-link':
                return <UnsplashLinkConverter />;
            default:
                return null;
        }
    };

    const activeToolData = tools.find(t => t.id === activeTool);
    const activeToolName = activeToolData?.name || 'Chọn công cụ';

    // If a tool is active, show it with back button and dropdown
    if (activeTool !== 'menu') {
        return (
            <div className="min-h-screen bg-[#FCFDFC] font-sans text-stone-900">
                <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/70 bg-[#FCFDFC]/95 px-4 py-3 backdrop-blur-sm sm:px-6">
                    <button
                        type="button"
                        onClick={() => setActiveTool('menu')}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
                    >
                        <ArrowLeft size={18} strokeWidth={1.5} />
                        <span>Quay lại</span>
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50"
                        >
                            <Wrench size={16} className="text-stone-500" strokeWidth={1.5} />
                            <span>{activeToolName}</span>
                            <ChevronDown size={16} className={`text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-stone-200/90 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                                {tools.map(tool => (
                                    <button
                                        type="button"
                                        key={tool.id}
                                        onClick={() => {
                                            setActiveTool(tool.id);
                                            setDropdownOpen(false);
                                        }}
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${activeTool === tool.id ? 'bg-stone-100' : 'hover:bg-stone-50'
                                            }`}
                                    >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200/90 bg-stone-50 text-stone-600 [&_svg]:h-[18px] [&_svg]:w-[18px] ${activeTool === tool.id ? 'border-stone-300 bg-white' : ''
                                            }`}>
                                            {tool.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium ${activeTool === tool.id ? 'text-stone-900' : 'text-stone-800'}`}>
                                                {tool.name}
                                            </p>
                                            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-stone-500">{tool.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {getToolComponent()}
            </div>
        );
    }

    // Main Menu View
    return (
        <div className="min-h-screen bg-[#FCFDFC] font-sans text-stone-900">
            <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
                <div className="mb-12 text-center">
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200/90 bg-white text-stone-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <Wrench size={28} strokeWidth={1.5} />
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Tiện ích trình duyệt
                    </p>
                    <h1 className="mb-3 text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
                        Bộ Công Cụ
                    </h1>
                    <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-500 sm:text-base">
                        Tập hợp các công cụ hữu ích cho công việc hàng ngày. Tất cả đều miễn phí và hoạt động trực tiếp trên trình duyệt.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {tools.map(tool => (
                        <button
                            type="button"
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`${cardClass} group p-6 text-left transition-colors hover:border-stone-300`}
                        >
                            <div className={`${iconBoxClass} mb-5`}>
                                {tool.icon}
                            </div>
                            <h3 className="mb-2 text-lg font-medium tracking-tight text-stone-900 transition-colors group-hover:text-stone-700">
                                {tool.name}
                            </h3>
                            <p className="text-sm leading-relaxed text-stone-500">
                                {tool.description}
                            </p>
                        </button>
                    ))}

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/40 p-8 text-center">
                        <div className={`${iconBoxClass} mb-4 opacity-70`}>
                            <Wrench size={22} strokeWidth={1.5} className="text-stone-400" />
                        </div>
                        <p className="text-sm text-stone-400">Thêm công cụ sắp ra mắt...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolkitPage;
