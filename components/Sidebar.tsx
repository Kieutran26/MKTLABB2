import React, { useState } from 'react';
import { ViewState } from '../types';
import {
  Home, GraduationCap, Library, Star, ChevronDown, ChevronRight, BookOpen, CreditCard, Calendar, List,
  Terminal, CheckSquare, Megaphone, PenTool, Image as ImageIcon, PlusSquare, Briefcase, Mail, Film, Link2,
  MonitorPlay, Calculator, TrendingUp, ShieldCheck, Radar, Users, BrainCircuit, Lightbulb, Target,
  CalendarDays, Brain, Banknote, FileText, FileCheck, Zap, Map, PieChart, Activity, Compass, DollarSign, Heart,
  HelpCircle, Globe, Layers, Search, Rocket
} from 'lucide-react';


interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

// Extracted NavGroup to avoid closure scope issues and improve performance
const NavGroup = ({ title, icon: Icon, expanded, setExpanded, items, setView, currentView }: any) => {
  const isActive = (id: string) => {
    if (currentView === id) return true;
    if (id === 'LEARN_SELECT' && currentView === 'LEARN_SESSION') return true;
    if (id === 'KEY_VISUALS_LIST' && currentView === 'KEY_VISUALS_LIST') return true;
    return false;
  };

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 mx-2 rounded-xl font-medium transition-all duration-200 w-[calc(100%-16px)]
            ${expanded ? 'text-slate-800 bg-white shadow-soft' : 'text-slate-600 hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${expanded ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-400'}`}>
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="text-xs font-semibold">{title}</span>
        </div>
        {expanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-slate-400" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-slate-400" />}
      </button>

      <div className={`space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        {items.map((item: any) => {
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-[calc(100%-32px)] ml-8 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border border-transparent
                  ${active
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm translate-x-1'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <item.icon size={16} strokeWidth={1.5} className={active ? 'text-indigo-600' : item.color || 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [learnExpanded, setLearnExpanded] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(false);

  // New Categories State
  const [strategyExpanded, setStrategyExpanded] = useState(true);

  const [ideationExpanded, setIdeationExpanded] = useState(false);
  const [designExpanded, setDesignExpanded] = useState(false);
  const [adsExpanded, setAdsExpanded] = useState(false);

  const learnItems = [
    { id: 'HOME', label: 'Dịch văn bản', icon: Home, color: 'text-blue-500' },
    { id: 'LEARN_SELECT', label: 'Bắt đầu học', icon: GraduationCap, color: 'text-indigo-500' },
    { id: 'VOCAB_MANAGER', label: 'Quản lý từ vựng', icon: Library, color: 'text-emerald-500' },
    { id: 'STARRED', label: 'Từ đã đánh dấu', icon: Star, color: 'text-amber-400' },
  ];

  const planItems = [
    { id: 'PLAN_CALENDAR', label: 'Lịch thanh toán', icon: Calendar, color: 'text-rose-500' },
    { id: 'PLAN_LIST', label: 'Danh sách Plans', icon: List, color: 'text-rose-400' },
  ];

  // 1. Strategy & Research
  const strategyItems = [
    { id: 'MASTERMIND_STRATEGY', label: 'Mastermind Strategy', icon: Brain, color: 'text-indigo-600' },
    { id: 'IMC_PLANNER', label: 'IMC Planner', icon: Target, color: 'text-purple-600' },
    { id: 'STP_MODEL', label: 'STP Model', icon: Layers, color: 'text-violet-600' },
    { id: 'PESTEL_BUILDER', label: 'PESTEL Builder', icon: Globe, color: 'text-teal-600' },
    { id: 'PORTER_ANALYZER', label: "Porter's Analyzer", icon: Target, color: 'text-rose-600' },
    { id: 'STRATEGIC_MODELS', label: 'Strategic Models', icon: Target, color: 'text-blue-600' },
    { id: 'INSIGHT_FINDER', label: 'Insight Finder', icon: BrainCircuit, color: 'text-cyan-600' },
    { id: 'CUSTOMER_JOURNEY_MAPPER', label: 'Customer Journey', icon: Map, color: 'text-indigo-500' },
    { id: 'BRAND_VAULT', label: 'Brand Vault', icon: ShieldCheck, color: 'text-indigo-600' },
    { id: 'PERSONA_BUILDER', label: 'Persona Builder', icon: Users, color: 'text-purple-600' },
    { id: 'RIVAL_RADAR', label: 'Rival Radar', icon: Radar, color: 'text-red-600' },
    { id: 'BRAND_POSITIONING_BUILDER', label: 'Brand Positioning', icon: Compass, color: 'text-teal-600' },
    { id: 'PRICING_ANALYZER', label: 'Pricing Analyzer', icon: DollarSign, color: 'text-emerald-600' },
    { id: 'AUDIENCE_EMOTION_MAP', label: 'Audience Emotion Map', icon: Heart, color: 'text-pink-600' },
  ];




  // 2. Ideation & Content Creation
  const ideationItems = [
    { id: 'HOOK_GENERATOR', label: 'Hook Generator', icon: Zap, color: 'text-amber-500' },
    { id: 'CONTENT_WRITER', label: 'Viết Content', icon: PenTool, color: 'text-violet-500' },
    { id: 'MINDMAP_GENERATOR', label: 'Mindmap AI', icon: BrainCircuit, color: 'text-cyan-500' },
    { id: 'SCAMPER_TOOL', label: 'SCAMPER Ideation', icon: Lightbulb, color: 'text-yellow-500' },
    { id: 'SMART_CALENDAR', label: 'Smart Content Calendar', icon: CalendarDays, color: 'text-indigo-500' },
    { id: 'AUTO_BRIEF', label: 'Auto Brief', icon: FileText, color: 'text-violet-600' },
    { id: 'SOP_BUILDER', label: 'SOP Builder', icon: FileCheck, color: 'text-emerald-600' },
    { id: 'CREATIVE_ANGLE_EXPLORER', label: 'Creative Angle Explorer', icon: Lightbulb, color: 'text-amber-600' },
  ];

  // 3. Design & Visuals
  const designItems = [
    { id: 'VISUAL_EMAIL', label: 'Visual Email', icon: Mail, color: 'text-pink-500' },
    { id: 'FRAME_VISUAL', label: 'Frame Visual', icon: Film, color: 'text-orange-500' },
    { id: 'MOCKUP_GENERATOR', label: 'Mockup Generator', icon: MonitorPlay, color: 'text-fuchsia-600' },
    { id: 'KEY_VISUALS_CREATE', label: 'Tạo dự án KV', icon: PlusSquare, color: 'text-cyan-500' },
    { id: 'KEY_VISUALS_LIST', label: 'Danh sách KV', icon: List, color: 'text-cyan-600' },
  ];

  // 4. Ads & Performance
  const adsItems = [
    { id: 'BUDGET_ALLOCATOR', label: 'Budget Allocator', icon: PieChart, color: 'text-purple-600' },
    { id: 'UTM_BUILDER', label: 'UTM Builder', icon: Link2, color: 'text-indigo-500' },
    { id: 'AB_TESTING', label: 'A/B Testing Calc', icon: Calculator, color: 'text-teal-600' },
    { id: 'ROAS_FORECASTER', label: 'ROAS Forecaster', icon: TrendingUp, color: 'text-green-600' },
    { id: 'ADS_HEALTH_CHECKER', label: 'Ads Health Checker', icon: Activity, color: 'text-rose-500' },
  ];

  return (
    <div className="w-64 bg-soft-surface h-screen fixed left-0 top-0 border-r border-soft-border flex flex-col shadow-soft z-20">
      <div className="p-6 pb-2">
        <button
          onClick={() => setView('HOME_DASHBOARD')}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white group-hover:bg-indigo-700 transition-colors">
            <GraduationCap size={20} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 group-hover:text-indigo-600 transition-colors">
            OptiMKT
          </h1>
        </button>
      </div>

      <nav className="flex-1 min-h-0 py-4 pb-20 space-y-1 overflow-y-auto custom-scrollbar px-2">

        <NavGroup
          title="Strategy & Research"
          icon={Brain}
          expanded={strategyExpanded}
          setExpanded={setStrategyExpanded}
          items={strategyItems}
          setView={setView}
          currentView={currentView}
        />



        <NavGroup
          title="Ideation & Content"
          icon={Lightbulb}
          expanded={ideationExpanded}
          setExpanded={setIdeationExpanded}
          items={ideationItems}
          setView={setView}
          currentView={currentView}
        />

        <NavGroup
          title="Design & Visuals"
          icon={ImageIcon}
          expanded={designExpanded}
          setExpanded={setDesignExpanded}
          items={designItems}
          setView={setView}
          currentView={currentView}
        />

        <NavGroup
          title="Ads & Performance"
          icon={TrendingUp}
          expanded={adsExpanded}
          setExpanded={setAdsExpanded}
          items={adsItems}
          setView={setView}
          currentView={currentView}
        />

        <div className="my-4 border-t border-slate-100 mx-4"></div>

        <NavGroup
          title="Học Tiếng Anh"
          icon={BookOpen}
          expanded={learnExpanded}
          setExpanded={setLearnExpanded}
          items={learnItems}
          setView={setView}
          currentView={currentView}
        />

        <NavGroup
          title="Quản lý Plans"
          icon={CreditCard}
          expanded={planExpanded}
          setExpanded={setPlanExpanded}
          items={planItems}
          setView={setView}
          currentView={currentView}
        />


        {/* Single Item: To-Do List */}
        <div className="mt-4 px-2">
          <button
            onClick={() => setView('TODO')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${currentView === 'TODO'
                ? 'bg-white shadow-soft text-indigo-700 border border-indigo-50'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${currentView === 'TODO' ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-400'}`}>
                <CheckSquare size={18} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold">To-Do List</span>
            </div>
          </button>
        </div>

        {/* Single Item: Tin Tức Tổng Hợp */}
        <div className="px-2 mb-1">
          <button
            onClick={() => setView('NEWS_AGGREGATOR')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${currentView === 'NEWS_AGGREGATOR'
                ? 'bg-white shadow-soft text-indigo-700 border border-indigo-50'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${currentView === 'NEWS_AGGREGATOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-400'}`}>
                <Globe size={18} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold">Tin Tức Tổng Hợp</span>
            </div>
            {/* Optional "New" Badge */}
            <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">Mới</span>
          </button>
        </div>

        {/* Single Item: Kho Kiến Thức */}
        <div className="px-2">
          <button
            onClick={() => setView('MARKETING_KNOWLEDGE')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${currentView === 'MARKETING_KNOWLEDGE'
                ? 'bg-white shadow-soft text-indigo-700 border border-indigo-50'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${currentView === 'MARKETING_KNOWLEDGE' ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-400'}`}>
                <BookOpen size={18} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold">Kho Kiến Thức</span>
            </div>
          </button>
        </div>

        {/* Single Item: Bộ Công Cụ */}
        <div className="px-2">
          <button
            onClick={() => setView('TOOLKIT')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${currentView === 'TOOLKIT'
                ? 'bg-white shadow-soft text-indigo-700 border border-indigo-50'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${currentView === 'TOOLKIT' ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-400'}`}>
                <Zap size={18} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold">Bộ Công Cụ</span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">Mới</span>
          </button>
        </div>

      </nav>

      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
        <button
          onClick={() => setView('LANDING_INTRO')}
          className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors mb-3"
        >
          <Rocket size={14} />
          <span>Xem Landing Page</span>
        </button>
        <button
          onClick={() => setView('FEATURES_GUIDE')}
          className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors mb-2"
        >
          <HelpCircle size={14} />
          <span>Hướng dẫn sử dụng</span>
        </button>
        <div className="text-xs text-slate-400 text-center">v1.7.0 • Soft Line Edition</div>
      </div>
    </div>
  );
};

export default Sidebar;