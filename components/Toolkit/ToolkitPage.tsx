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

type ToolType = 'menu' | 'word-counter' | 'aspect-ratio' | 'text-compare' | 'lorem-ipsum' | 'one-time-reminder' | 'problem-to-question' | 'prompt-manager' | 'smart-salary' | 'unsplash-link';

interface Tool {
    id: ToolType;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const tools: Tool[] = [
    {
        id: 'word-counter',
        name: 'Đếm Từ',
        description: 'Đếm từ, ký tự, câu, đoạn văn và phân tích mật độ từ khóa',
        icon: <Type size={24} />,
        color: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
        id: 'aspect-ratio',
        name: 'Tỷ Lệ Khung Hình',
        description: 'Tính toán tỷ lệ khung hình từ kích thước hoặc ngược lại',
        icon: <Ratio size={24} />,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
        id: 'text-compare',
        name: 'So Sánh Văn Bản',
        description: 'So sánh và merge hai khối văn bản, hiển thị sự khác biệt',
        icon: <GitCompare size={24} />,
        color: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    {
        id: 'lorem-ipsum',
        name: 'Tạo Văn Bản Giả',
        description: 'Tạo Lorem Ipsum bằng tiếng Việt hoặc Latin cho thiết kế',
        icon: <FileText size={24} />,
        color: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    {
        id: 'one-time-reminder',
        name: 'Nhắc Việc Một Lần',
        description: 'Tạo nhắc việc và nhận thông báo trên trình duyệt',
        icon: <Bell size={24} />,
        color: 'bg-rose-50 text-rose-600 border-rose-100'
    },
    {
        id: 'problem-to-question',
        name: 'Vấn Đề → Câu Hỏi',
        description: 'Chuyển vấn đề/than phiền thành câu hỏi có thể hành động',
        icon: <HelpCircle size={24} />,
        color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
    },
    {
        id: 'prompt-manager',
        name: 'Kho Prompt',
        description: 'Lưu trữ và quản lý các prompt cho AI models',
        icon: <Terminal size={24} />,
        color: 'bg-slate-50 text-slate-600 border-slate-100'
    },
    {
        id: 'smart-salary',
        name: 'Theo Dõi Lương',
        description: 'Quản lý và theo dõi lương, thu nhập hàng tháng',
        icon: <Banknote size={24} />,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
        id: 'unsplash-link',
        name: 'Chuyển Đổi Link Unsplash',
        description: 'Làm sạch và tối ưu link ảnh Unsplash',
        icon: <Link size={24} />,
        color: 'bg-pink-50 text-pink-600 border-pink-100'
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
            <div>
                {/* Top Bar with Dropdown */}
                <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setActiveTool('menu')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Quay lại</span>
                    </button>

                    {/* Dropdown Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Wrench size={16} className="text-gray-500" />
                            <span className="font-medium text-gray-700">{activeToolName}</span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                {tools.map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => {
                                            setActiveTool(tool.id);
                                            setDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${activeTool === tool.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${tool.color}`}>
                                            {tool.icon}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${activeTool === tool.id ? 'text-blue-600' : 'text-gray-900'}`}>
                                                {tool.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{tool.description}</p>
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
        <div className="min-h-screen bg-[#F9FAFB] p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                        <Wrench size={32} className="text-gray-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bộ Công Cụ</h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        Tập hợp các công cụ hữu ích cho công việc hàng ngày. Tất cả đều miễn phí và hoạt động trực tiếp trên trình duyệt.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left group"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${tool.color}`}>
                                {tool.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {tool.name}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {tool.description}
                            </p>
                        </button>
                    ))}

                    {/* Coming Soon Placeholder */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                            <Wrench size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-sm">Thêm công cụ sắp ra mắt...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolkitPage;
