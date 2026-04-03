import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ViewState } from '../types';
import { useAuth } from './AuthContext';
import {
  Home, GraduationCap, Library, Star, ChevronDown, ChevronRight, BookOpen, CreditCard, Calendar, List,
  CheckSquare, PenTool, ImageIcon, PlusSquare, Mail, Film, Link2,
  MonitorPlay, Calculator, TrendingUp, ShieldCheck, Radar, Users, BrainCircuit, Lightbulb, Target,
  CalendarDays, Brain, FileText, FileCheck, Zap, Map, PieChart, Activity, Compass, DollarSign, Heart,
  HelpCircle, Globe, Layers, Rocket, Sparkles, PanelLeftClose, PanelLeftOpen,
  LogOut, ChevronUp, UserCircle
} from 'lucide-react';

const SIDEBAR_BG = '#FCFDFC';
const NAV_TEXT = '#4A4A4A';
const BORDER_SUBTLE = '#E8E5E1';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  user?: FirebaseUser | null;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: 'new';
};

const BadgeNew = () => (
  <span
    className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold tracking-wide"
    style={{ backgroundColor: '#FFE8D6', color: '#C45C26' }}
  >
    Mới
  </span>
);

const NavGroup = ({
  title,
  icon: Icon,
  expanded,
  setExpanded,
  items,
  setView,
  currentView,
  collapsed,
  onExpandSidebar,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  items: NavItem[];
  setView: (view: ViewState) => void;
  currentView: ViewState;
  collapsed: boolean;
  onExpandSidebar: () => void;
}) => {
  const isActive = (id: string) => {
    if (currentView === id) return true;
    if (id === 'LEARN_SELECT' && currentView === 'LEARN_SESSION') return true;
    if (id === 'KEY_VISUALS_LIST' && currentView === 'KEY_VISUALS_LIST') return true;
    return false;
  };

  const hasActive = items.some((item) => isActive(item.id));

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <button
          type="button"
          title={title}
          onClick={onExpandSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          style={{ color: hasActive ? NAV_TEXT : `${NAV_TEXT}99` }}
          aria-label={title}
        >
          <Icon size={20} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="py-0.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`group w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150 hover:bg-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
          hasActive && !expanded ? 'bg-black/[0.06]' : ''
        }`}
        style={{ color: NAV_TEXT }}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
          <Icon size={18} strokeWidth={1.5} />
        </span>
        <span
          className="min-w-0 flex-1 text-[11px] font-medium leading-snug tracking-tight"
          style={{ color: NAV_TEXT }}
        >
          {title}
        </span>
        {hasActive && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full opacity-50" style={{ backgroundColor: NAV_TEXT }} aria-hidden />
        )}
        {expanded ? (
          <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 opacity-45" style={{ color: NAV_TEXT }} />
        ) : (
          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 opacity-45" style={{ color: NAV_TEXT }} />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-250 ease-in-out
          ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mt-0.5 mb-1 ml-4 border-l pl-3" style={{ borderColor: BORDER_SUBTLE }}>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(item.id);
              const ItemIcon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setView(item.id as ViewState)}
                    className={`group w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 hover:bg-black/[0.06] ${
                      active ? 'bg-black/[0.06]' : ''
                    }`}
                    style={{ color: NAV_TEXT }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-80" aria-hidden>
                      {ItemIcon ? <ItemIcon size={16} strokeWidth={1.5} /> : null}
                    </span>
                    <span className="min-w-0 flex-1 text-[11px] font-normal leading-snug">
                      {item.label}
                    </span>
                    {item.badge === 'new' ? <BadgeNew /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  collapsed = false,
  onCollapsedChange,
  user,
}) => {
  const { signOutUser } = useAuth();
  const [planExpanded, setPlanExpanded] = useState(false);
  const [strategyExpanded, setStrategyExpanded] = useState(true);
  const [ideationExpanded, setIdeationExpanded] = useState(false);
  const [designExpanded, setDesignExpanded] = useState(false);
  const [adsExpanded, setAdsExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const expandSidebar = () => onCollapsedChange?.(false);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOutUser();
  };

  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.photoURL;
  const initials = getUserInitials(user?.displayName, user?.email);

  const planItems: NavItem[] = [
    { id: 'PLAN_CALENDAR', label: 'Lịch thanh toán', icon: Calendar },
    { id: 'PLAN_LIST', label: 'Danh sách Plans', icon: List },
  ];

  const strategyItems: NavItem[] = [
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

  const ideationItems: NavItem[] = [
    { id: 'HOOK_GENERATOR', label: 'Hook Generator', icon: Zap },
    { id: 'CONTENT_WRITER', label: 'Viết Content', icon: PenTool },
    { id: 'MINDMAP_GENERATOR', label: 'Mindmap AI', icon: BrainCircuit },
    { id: 'SCAMPER_TOOL', label: 'SCAMPER Ideation', icon: Lightbulb },
    { id: 'SMART_CALENDAR', label: 'Smart Content Calendar', icon: CalendarDays },
    { id: 'AUTO_BRIEF', label: 'Auto Brief', icon: FileText },
    { id: 'SOP_BUILDER', label: 'SOP Builder', icon: FileCheck },
    { id: 'CREATIVE_ANGLE_EXPLORER', label: 'Creative Angle Explorer', icon: Lightbulb },
  ];

  const designItems: NavItem[] = [
    { id: 'VISUAL_EMAIL', label: 'Visual Email', icon: Mail },
    { id: 'FRAME_VISUAL', label: 'Frame Visual', icon: Film },
    { id: 'MOCKUP_GENERATOR', label: 'Mockup Generator', icon: MonitorPlay },
    { id: 'KEY_VISUALS_CREATE', label: 'Tạo dự án KV', icon: PlusSquare },
    { id: 'KEY_VISUALS_LIST', label: 'Danh sách KV', icon: List },
    { id: 'CHAIN_LINK', label: 'Chain Link', icon: Link2 },
  ];

  const adsItems: NavItem[] = [
    { id: 'BUDGET_ALLOCATOR', label: 'Budget Allocator', icon: PieChart },
    { id: 'UTM_BUILDER', label: 'UTM Builder', icon: Link2 },
    { id: 'AB_TESTING', label: 'A/B Testing Calc', icon: Calculator },
    { id: 'ROAS_FORECASTER', label: 'ROAS Forecaster', icon: TrendingUp },
    { id: 'ADS_HEALTH_CHECKER', label: 'Ads Health Checker', icon: Activity },
  ];

  const singleNavItems: { id: ViewState; label: string; icon: any }[] = [
    { id: 'TODO', label: 'To-Do List', icon: CheckSquare },
    { id: 'NEWS_AGGREGATOR', label: 'Tin Tức Tổng Hợp', icon: Globe },
    { id: 'MARKETING_KNOWLEDGE', label: 'Kho Kiến Thức', icon: BookOpen },
    { id: 'TOOLKIT', label: 'Bộ Công Cụ', icon: Zap },
  ];

  return (
    <aside
      className="h-screen fixed left-0 top-0 z-40 flex flex-col border-r transition-[width] duration-300 ease-out"
      style={{
        width: collapsed ? '4.75rem' : '17rem',
        backgroundColor: SIDEBAR_BG,
        borderColor: BORDER_SUBTLE,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: NAV_TEXT,
      }}
    >
      <button
        type="button"
        onClick={() => onCollapsedChange?.(!collapsed)}
        className="fixed z-[100] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-[left,background-color] duration-300 ease-out hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 top-[42px]"
        style={{
          borderColor: BORDER_SUBTLE,
          left: collapsed ? 'calc(4.75rem - 14px)' : 'calc(17rem - 14px)',
        }}
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen size={16} strokeWidth={1.5} style={{ color: '#2C2C2C' }} />
        ) : (
          <PanelLeftClose size={16} strokeWidth={1.5} style={{ color: '#2C2C2C' }} />
        )}
      </button>

      <div className={`flex shrink-0 items-center ${collapsed ? 'flex-col gap-2 px-2 py-5' : 'justify-start gap-2 px-4 py-5'}`}>
        <button
          type="button"
          onClick={() => setView('HOME_DASHBOARD')}
          className={`group flex min-w-0 items-center gap-2.5 rounded-lg py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${collapsed ? 'justify-center px-0' : 'px-1'}`}
          title="Trang chủ"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden>
            <Sparkles size={22} strokeWidth={1.5} style={{ color: NAV_TEXT }} />
          </span>
          {!collapsed && (
            <span
              className="truncate text-[0.875rem] font-semibold tracking-tight"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#2C2C2C' }}
            >
              OptiM.KI
            </span>
          )}
        </button>
      </div>

      <div className="mx-4 border-t" style={{ borderColor: BORDER_SUBTLE }} />

      <nav className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        <NavGroup
          title="Models & Content"
          icon={Brain}
          expanded={strategyExpanded}
          setExpanded={setStrategyExpanded}
          items={strategyItems}
          setView={setView}
          currentView={currentView}
          collapsed={collapsed}
          onExpandSidebar={expandSidebar}
        />

        <NavGroup
          title="Idea Strategy AI"
          icon={Lightbulb}
          expanded={ideationExpanded}
          setExpanded={setIdeationExpanded}
          items={ideationItems}
          setView={setView}
          currentView={currentView}
          collapsed={collapsed}
          onExpandSidebar={expandSidebar}
        />

        <NavGroup
          title="Design & Visuals"
          icon={ImageIcon}
          expanded={designExpanded}
          setExpanded={setDesignExpanded}
          items={designItems}
          setView={setView}
          currentView={currentView}
          collapsed={collapsed}
          onExpandSidebar={expandSidebar}
        />

        <NavGroup
          title="Ads & Performance"
          icon={TrendingUp}
          expanded={adsExpanded}
          setExpanded={setAdsExpanded}
          items={adsItems}
          setView={setView}
          currentView={currentView}
          collapsed={collapsed}
          onExpandSidebar={expandSidebar}
        />

        <div className="my-3 mx-1 border-t" style={{ borderColor: BORDER_SUBTLE }} />

        <NavGroup
          title="Quản lý Plan"
          icon={CreditCard}
          expanded={planExpanded}
          setExpanded={setPlanExpanded}
          items={planItems}
          setView={setView}
          currentView={currentView}
          collapsed={collapsed}
          onExpandSidebar={expandSidebar}
        />

        {!collapsed &&
          singleNavItems.map(({ id, label, icon: Icon }) => {
            const active = currentView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
                  active ? 'bg-black/[0.06]' : ''
                }`}
                style={{ color: NAV_TEXT }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-90" aria-hidden>
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-[11px] font-medium leading-snug">{label}</span>
              </button>
            );
          })}

        {collapsed &&
          singleNavItems.map(({ id, label, icon: Icon }) => {
            const active = currentView === id;
            return (
              <div key={id} className="flex justify-center py-1">
                <button
                  type="button"
                  title={label}
                  onClick={() => {
                    setView(id);
                    expandSidebar();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.06]"
                  style={{ color: active ? NAV_TEXT : `${NAV_TEXT}99` }}
                  aria-label={label}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </button>
              </div>
            );
          })}
      </nav>

      <div
        className="shrink-0 space-y-1 border-t px-3 py-4"
        style={{ backgroundColor: SIDEBAR_BG, borderColor: BORDER_SUBTLE }}
      >
        {!collapsed ? (
          <>
            <div className="relative mb-1">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.06]"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-stone-200/70"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold leading-snug" style={{ color: NAV_TEXT }}>
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] leading-snug opacity-60" style={{ color: NAV_TEXT }}>
                    {user?.email}
                  </p>
                </div>
                <ChevronUp
                  size={14}
                  strokeWidth={1.5}
                  className={`shrink-0 transition-transform ${userMenuOpen ? 'rotate-0' : 'rotate-180'}`}
                  style={{ color: NAV_TEXT }}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-xl border border-stone-200/90 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                    <div className="mb-1 border-b border-stone-100 px-3 pb-2 pt-1">
                      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-stone-400">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-stone-600">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('FEATURES_GUIDE')}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] transition-colors hover:bg-stone-50"
                      style={{ color: NAV_TEXT }}
                    >
                      <HelpCircle size={14} strokeWidth={1.5} />
                      Hướng dẫn sử dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('LANDING_INTRO')}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] transition-colors hover:bg-stone-50"
                      style={{ color: NAV_TEXT }}
                    >
                      <Rocket size={14} strokeWidth={1.5} />
                      Xem Landing Page
                    </button>
                    <div className="mt-1 border-t border-stone-100 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-1 text-center text-[10px] font-medium tracking-wide opacity-45" style={{ color: NAV_TEXT }}>
              v1.7.0 · OptiM.KI
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-stone-200/70"
                title={displayName}
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600"
                title={displayName}
              >
                {initials}
              </div>
            )}
            <button
              type="button"
              title="Hướng dẫn sử dụng"
              onClick={() => setView('FEATURES_GUIDE')}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.06]"
              style={{ color: currentView === 'FEATURES_GUIDE' ? NAV_TEXT : `${NAV_TEXT}99` }}
              aria-label="Hướng dẫn sử dụng"
            >
              <HelpCircle size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              title="Đăng xuất"
              onClick={handleSignOut}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.06]"
              style={{ color: `${NAV_TEXT}99` }}
              aria-label="Đăng xuất"
            >
              <LogOut size={20} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
