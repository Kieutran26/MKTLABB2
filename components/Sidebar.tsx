import React, { useState } from 'react';
import { ViewState } from '../types';
import {
  Home, GraduationCap, Library, Star, ChevronDown, ChevronRight, BookOpen, CreditCard, Calendar, List,
  CheckSquare, PenTool, Image as ImageIcon, PlusSquare, Mail, Film, Link2,
  MonitorPlay, Calculator, TrendingUp, ShieldCheck, Radar, Users, BrainCircuit, Lightbulb, Target,
  CalendarDays, Brain, FileText, FileCheck, Zap, Map, PieChart, Activity, Compass, DollarSign, Heart,
  HelpCircle, Globe, Layers, Rocket
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const NavGroup = ({
  title, icon: Icon, expanded, setExpanded, items, setView, currentView
}: any) => {
  const isActive = (id: string) => {
    if (currentView === id) return true;
    if (id === 'LEARN_SELECT' && currentView === 'LEARN_SESSION') return true;
    if (id === 'KEY_VISUALS_LIST' && currentView === 'KEY_VISUALS_LIST') return true;
    return false;
  };

  const hasActive = items.some((item: any) => isActive(item.id));

  return (
    <div className="py-0.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-300 focus-visible:ring-offset-1 rounded-lg hover:bg-stone-100/60"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150"
          style={{ color: '#78716c' }}
          aria-hidden
        >
          <Icon size={14} strokeWidth={1.25} />
        </span>
        <span className="min-w-0 flex-1 text-xs font-normal leading-tight tracking-tight text-stone-600 transition-colors group-hover:text-stone-800">
          {title}
        </span>
        {hasActive && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" aria-hidden />
        )}
        {expanded
          ? <ChevronDown size={13} strokeWidth={1.25} className="shrink-0 text-stone-400" />
          : <ChevronRight size={13} strokeWidth={1.25} className="shrink-0 text-stone-400" />
        }
      </button>

      <div
        className={`overflow-hidden transition-all duration-250 ease-in-out
          ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <ul className="mt-0.5 mb-1 space-y-0.5 pl-9">
          {items.map((item: any) => {
            const active = isActive(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setView(item.id as ViewState)}
                  className={`group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-300 focus-visible:ring-offset-1
                    ${active
                      ? 'font-semibold'
                      : 'font-medium text-stone-500 hover:text-stone-800'
                    }`}
                >
                  {active && (
                    <span className="h-px w-4 shrink-0 bg-stone-400" aria-hidden />
                  )}
                  {!active && (
                    <span className="h-px w-4 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" aria-hidden>
                      <span className="block h-px w-full bg-stone-400" />
                    </span>
                  )}
                  <span
                    className={`min-w-0 truncate text-xs transition-colors ${active ? 'text-stone-900' : ''}`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [learnExpanded, setLearnExpanded] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [strategyExpanded, setStrategyExpanded] = useState(true);
  const [ideationExpanded, setIdeationExpanded] = useState(false);
  const [designExpanded, setDesignExpanded] = useState(false);
  const [adsExpanded, setAdsExpanded] = useState(false);

  const learnItems = [
    { id: 'HOME', label: 'Dịch văn bản', icon: Home },
    { id: 'LEARN_SELECT', label: 'Bắt đầu học', icon: GraduationCap },
    { id: 'VOCAB_MANAGER', label: 'Quản lý từ vựng', icon: Library },
    { id: 'STARRED', label: 'Từ đã đánh dấu', icon: Star },
  ];

  const planItems = [
    { id: 'PLAN_CALENDAR', label: 'Lịch thanh toán', icon: Calendar },
    { id: 'PLAN_LIST', label: 'Danh sách Plans', icon: List },
  ];

  const strategyItems = [
    { id: 'MASTERMIND_STRATEGY', label: 'Mastermind Strategy', icon: Brain },
    { id: 'IMC_PLANNER', label: 'IMC Planner', icon: Target },
    { id: 'STP_MODEL', label: 'STP Model', icon: Layers },
    { id: 'PESTEL_BUILDER', label: 'PESTEL Builder', icon: Globe },
    { id: 'PORTER_ANALYZER', label: "Porter's Analyzer", icon: Target },
    { id: 'STRATEGIC_MODELS', label: 'Strategic Models', icon: Target },
    { id: 'INSIGHT_FINDER', label: 'Insight Finder', icon: BrainCircuit },
    { id: 'CUSTOMER_JOURNEY_MAPPER', label: 'Customer Journey', icon: Map },
    { id: 'BRAND_VAULT', label: 'Brand Vault', icon: ShieldCheck },
    { id: 'PERSONA_BUILDER', label: 'Persona Builder', icon: Users },
    { id: 'RIVAL_RADAR', label: 'Rival Radar', icon: Radar },
    { id: 'BRAND_POSITIONING_BUILDER', label: 'Brand Positioning', icon: Compass },
    { id: 'PRICING_ANALYZER', label: 'Pricing Analyzer', icon: DollarSign },
    { id: 'AUDIENCE_EMOTION_MAP', label: 'Audience Emotion Map', icon: Heart },
  ];

  const ideationItems = [
    { id: 'HOOK_GENERATOR', label: 'Hook Generator', icon: Zap },
    { id: 'CONTENT_WRITER', label: 'Viết Content', icon: PenTool },
    { id: 'MINDMAP_GENERATOR', label: 'Mindmap AI', icon: BrainCircuit },
    { id: 'SCAMPER_TOOL', label: 'SCAMPER Ideation', icon: Lightbulb },
    { id: 'SMART_CALENDAR', label: 'Smart Content Calendar', icon: CalendarDays },
    { id: 'AUTO_BRIEF', label: 'Auto Brief', icon: FileText },
    { id: 'SOP_BUILDER', label: 'SOP Builder', icon: FileCheck },
    { id: 'CREATIVE_ANGLE_EXPLORER', label: 'Creative Angle Explorer', icon: Lightbulb },
  ];

  const designItems = [
    { id: 'VISUAL_EMAIL', label: 'Visual Email', icon: Mail },
    { id: 'FRAME_VISUAL', label: 'Frame Visual', icon: Film },
    { id: 'MOCKUP_GENERATOR', label: 'Mockup Generator', icon: MonitorPlay },
    { id: 'KEY_VISUALS_CREATE', label: 'Tạo dự án KV', icon: PlusSquare },
    { id: 'KEY_VISUALS_LIST', label: 'Danh sách KV', icon: List },
  ];

  const adsItems = [
    { id: 'BUDGET_ALLOCATOR', label: 'Budget Allocator', icon: PieChart },
    { id: 'UTM_BUILDER', label: 'UTM Builder', icon: Link2 },
    { id: 'AB_TESTING', label: 'A/B Testing Calc', icon: Calculator },
    { id: 'ROAS_FORECASTER', label: 'ROAS Forecaster', icon: TrendingUp },
    { id: 'ADS_HEALTH_CHECKER', label: 'Ads Health Checker', icon: Activity },
  ];

  const logoActive = currentView === 'HOME_DASHBOARD' || currentView === 'HOME';
  const footerActive = currentView === 'LANDING_INTRO' || currentView === 'FEATURES_GUIDE';

  return (
    <aside className="w-60 bg-[#FAF9F7] h-screen fixed left-0 top-0 border-r border-stone-200/80 flex flex-col z-20 font-sans text-xs">
      {/* Logo */}
      <div className="px-5 py-6">
        <button
          type="button"
          onClick={() => setView('HOME_DASHBOARD')}
          className="group flex w-full items-center gap-3 px-1 py-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-300 focus-visible:ring-offset-1 rounded-lg hover:bg-stone-100/60 transition-colors duration-150"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            aria-hidden
          >
            <GraduationCap
              size={18}
              strokeWidth={1.25}
              className="text-stone-600"
            />
          </span>
          <span className="text-lg font-normal tracking-tight text-stone-800">
            OptiMKT
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-stone-200/80" />

      {/* Nav */}
      <nav className="flex-1 min-h-0 py-3 pb-24 overflow-y-auto custom-scrollbar px-2.5 space-y-0.5">

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

        <div className="my-3 mx-1 border-t border-stone-200/80" />

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

        {/* Single items */}
        {[
          { id: 'TODO', label: 'To-Do List', icon: CheckSquare },
          { id: 'NEWS_AGGREGATOR', label: 'Tin Tức Tổng Hợp', icon: Globe, badge: 'Mới', badgeColor: '#BE123C' },
          { id: 'MARKETING_KNOWLEDGE', label: 'Kho Kiến Thức', icon: BookOpen },
          { id: 'TOOLKIT', label: 'Bộ Công Cụ', icon: Zap, badge: 'Mới', badgeColor: '#047857' },
        ].map(({ id, label, icon: Icon, badge, badgeColor }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id as ViewState)}
              className={`group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-300 focus-visible:ring-offset-1
                ${active
                  ? 'font-semibold text-stone-900'
                  : 'font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                }`}
            >
              <Icon
                size={14}
                strokeWidth={1.25}
                className="shrink-0"
                style={{ color: active ? '#78716c' : '#a8a29e' }}
              />
              <span className={`min-w-0 flex-1 truncate leading-tight transition-colors ${active ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>{label}</span>
              {badge && (
                <span
                  className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500"
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-200/80 px-4 py-4 bg-[#FAF9F7] space-y-1">
        <button
          type="button"
          onClick={() => setView('LANDING_INTRO')}
          className={`group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150 focus:outline-none
            ${currentView === 'LANDING_INTRO'
              ? 'text-stone-900 font-semibold'
              : 'text-stone-400 hover:text-stone-700'
            }`}
        >
          <Rocket size={13} strokeWidth={1.25} className="shrink-0 text-stone-500" />
          <span className="min-w-0 leading-tight text-stone-600">Xem Landing Page</span>
        </button>
        <button
          type="button"
          onClick={() => setView('FEATURES_GUIDE')}
          className={`group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150 focus:outline-none
            ${currentView === 'FEATURES_GUIDE'
              ? 'text-stone-900 font-semibold'
              : 'text-stone-400 hover:text-stone-700'
            }`}
        >
          <HelpCircle size={13} strokeWidth={1.25} className="shrink-0 text-stone-500" />
          <span className="min-w-0 leading-tight text-stone-600">Hướng dẫn sử dụng</span>
        </button>
        <div className="pt-1 text-center text-[10px] font-medium text-stone-400 tracking-wide">
          v1.7.0 &middot; OptiMKT
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
