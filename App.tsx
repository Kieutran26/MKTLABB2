import React, { useState } from 'react';
import { User } from 'firebase/auth';
import Sidebar from './components/Sidebar';
import TranslationView from './components/TranslationView';
import VocabManager from './components/VocabManager';
import StartLearning from './components/StartLearning';
import StudySession from './components/StudySession';
import StarredView from './components/StarredView';
import PlanList from './components/PlanList';
import PlanCalendar from './components/PlanCalendar';
import PromptManager from './components/PromptManager';
import ToDoListPage from './components/ToDoListPage';
import ContentGenerator from './components/ContentGenerator';
import KeyVisuals from './components/KeyVisuals';
import VisualEmailBuilder from './components/VisualEmailBuilder';
import FrameVisual from './components/FrameVisual';
import UtmBuilder from './components/UtmBuilder';
import MockupGenerator from './components/MockupGenerator';
import ABTestingCalc from './components/ABTestingCalc';
import RoasForecaster from './components/RoasForecaster';
import BrandVault from './components/BrandVault';
import RivalRadar from './components/RivalRadar';
import PersonaBuilder from './components/PersonaBuilder';
import MindmapGenerator from './components/MindmapGenerator';
import ScamperTool from './components/ScamperTool';
import StrategicModelGenerator from './components/StrategicModelGenerator';
import SmartContentCalendar from './components/SmartContentCalendar';
import MastermindStrategyComponent from './components/MastermindStrategy';
import AutoBriefGenerator from './components/AutoBriefGenerator';
import SOPBuilder from './components/SOPBuilder';
import HookGenerator from './components/HookGenerator';
import CustomerJourneyMapper from './components/CustomerJourneyMapper';
import BudgetAllocator from './components/BudgetAllocator';
import InsightFinder from './components/InsightFinder';
import SmartSalary from './components/SmartSalary';
import CreativeAngleExplorer from './components/CreativeAngleExplorer';
import AdsHealthChecker from './components/AdsHealthChecker';
import BrandPositioningBuilder from './components/BrandPositioningBuilder';
import PricingAnalyzer from './components/PricingAnalyzer';
import AudienceEmotionMap from './components/AudienceEmotionMap';
import IMCPlanner from './components/IMCPlanner';
import MarketingKnowledge from './components/MarketingKnowledge';
import PESTELBuilder from './components/PESTELBuilder';
import PorterAnalyzer from './components/PorterAnalyzer';
import STPModelGenerator from './components/STPModelGenerator';
import HomePage from './components/HomePage';
import FeaturesGuide from './components/FeaturesGuide';
import LandingPage from './components/LandingPage/LandingPage';
import NewsPage from './components/News/NewsPage';
import ToolkitPage from './components/Toolkit/ToolkitPage';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './components/AuthContext';


import { ViewState, StudyMode, Word, MastermindStrategy } from './types';
import { BrandProvider } from './components/BrandContext';
import { TaskProvider } from './components/TaskContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('HOME_DASHBOARD');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Flexible config: can study by Set IDs OR by a specific list of Words
  const [studyConfig, setStudyConfig] = useState<{
    mode: StudyMode,
    setIds?: string[],
    specificWords?: Word[]
  } | null>(null);

  // Content Generator Data Transfer
  const [contentGenData, setContentGenData] = useState<{
    topic?: string;
    context?: string;
  } | null>(null);

  // Start session from Sets (Standard learning)
  const startSetSession = (mode: StudyMode, setIds: string[]) => {
    setStudyConfig({ mode, setIds });
    setCurrentView('LEARN_SESSION');
  };

  // Start session from Specific Words (Starred learning)
  const startWordSession = (mode: StudyMode, words: Word[]) => {
    setStudyConfig({ mode, specificWords: words });
    setCurrentView('LEARN_SESSION');
  };

  // Navigate to Content Generator with pre-filled data
  const navigateToContentGenerator = (topic: string, context: string) => {
    setContentGenData({ topic, context });
    setCurrentView('CONTENT_WRITER');
  };

  // Handle Deploy Strategy to Calendar
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployedStrategy, setDeployedStrategy] = useState<MastermindStrategy | null>(null);

  const handleDeployToCalendar = (strategy: MastermindStrategy) => {
    setDeployedStrategy(strategy);
    setCurrentView('SMART_CALENDAR');
  };

  const renderContent = () => {
    // Auth loading state
    if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FCFDFC]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white text-stone-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 4L4 9V19L14 24L24 19V9L14 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M4 9L14 14L24 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M14 14V24" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-sm text-stone-500">Đang tải...</p>
        </div>
      );
    }

    // Not logged in → show login page
    if (!user) {
      return <LoginPage />;
    }

    switch (currentView) {
      case 'HOME_DASHBOARD':
        return <HomePage setView={setCurrentView} />;
      case 'LANDING_INTRO':
        return <LandingPage setView={setCurrentView} />;
      case 'FEATURES_GUIDE':
        return <FeaturesGuide onBack={() => setCurrentView('HOME_DASHBOARD')} />;
      case 'HOME':
        return <TranslationView />;
      case 'LEARN_SELECT':
        return <StartLearning onStart={startSetSession} />;
      case 'LEARN_SESSION':
        if (!studyConfig) return <StartLearning onStart={startSetSession} />;
        return (
          <div className="absolute inset-0 bg-soft-bg z-30">
            <StudySession
              mode={studyConfig.mode}
              setIds={studyConfig.setIds}
              initialWords={studyConfig.specificWords}
              onExit={() => {
                if (studyConfig.specificWords) {
                  setCurrentView('STARRED');
                } else {
                  setCurrentView('LEARN_SELECT');
                }
              }}
            />
          </div>
        );
      case 'VOCAB_MANAGER':
        return <VocabManager />;
      case 'STARRED':
        return <StarredView onStartStudy={startWordSession} />;
      case 'PLAN_LIST':
        return <PlanList />;
      case 'PLAN_CALENDAR':
        return <PlanCalendar />;
      case 'PROMPTS':
        return <PromptManager />;
      case 'TODO':
        return <ToDoListPage />;
      case 'CONTENT_WRITER':
        return <ContentGenerator initialData={contentGenData} />;
      case 'VISUAL_EMAIL':
        return <VisualEmailBuilder />;
      case 'KEY_VISUALS_LIST':
        return <KeyVisuals initialView="list" />;
      case 'KEY_VISUALS_CREATE':
        return <KeyVisuals initialView="create" />;
      case 'FRAME_VISUAL':
        return <FrameVisual />;
      case 'UTM_BUILDER':
        return <UtmBuilder />;
      case 'MOCKUP_GENERATOR':
        return <MockupGenerator />;
      case 'AB_TESTING':
        return <ABTestingCalc />;
      case 'ROAS_FORECASTER':
        return <RoasForecaster />;
      case 'BRAND_VAULT':
        return <BrandVault />;
      case 'RIVAL_RADAR':
        return <RivalRadar />;
      case 'PERSONA_BUILDER':
        return <PersonaBuilder />;
      case 'MINDMAP_GENERATOR':
        return <MindmapGenerator />;
      case 'SCAMPER_TOOL':
        return <ScamperTool />;
      case 'STRATEGIC_MODELS':
        return <StrategicModelGenerator />;
      case 'SMART_CALENDAR':
        return <SmartContentCalendar
          onNavigateToContent={navigateToContentGenerator}
          initialStrategy={deployedStrategy} // Pass the deployed strategy
        />;
      case 'AUTO_BRIEF':
        return <AutoBriefGenerator />;
      case 'SOP_BUILDER':
        return <SOPBuilder />;
      case 'HOOK_GENERATOR':
        return <HookGenerator />;
      case 'CUSTOMER_JOURNEY_MAPPER':
        return <CustomerJourneyMapper />;
      case 'BUDGET_ALLOCATOR':
        return <BudgetAllocator />;
      case 'INSIGHT_FINDER':
        return <InsightFinder />;
      case 'CREATIVE_ANGLE_EXPLORER':
        return <CreativeAngleExplorer />;
      case 'SMART_SALARY':
        return <SmartSalary />;
      case 'MASTERMIND_STRATEGY':
        return <MastermindStrategyComponent onDeployToCalendar={handleDeployToCalendar} />;
      case 'ADS_HEALTH_CHECKER':
        return <AdsHealthChecker isActive={true} />;
      case 'BRAND_POSITIONING_BUILDER':
        return <BrandPositioningBuilder isActive={true} />;
      case 'PRICING_ANALYZER':
        return <PricingAnalyzer isActive={true} />;
      case 'AUDIENCE_EMOTION_MAP':
        return <AudienceEmotionMap isActive={true} />;
      case 'IMC_PLANNER':
        return <IMCPlanner />;
      case 'NEWS_AGGREGATOR':
        return <NewsPage />;
      case 'MARKETING_KNOWLEDGE':
        return <MarketingKnowledge />;
      case 'PESTEL_BUILDER':
        return <PESTELBuilder />;
      case 'PORTER_ANALYZER':
        return <PorterAnalyzer />;
      case 'TOOLKIT':
        return <ToolkitPage />;
      case 'STP_MODEL':
        return <STPModelGenerator />;
      case 'LOGIN':
        return <LoginPage onBack={() => setCurrentView('HOME_DASHBOARD')} />;

      default:
        return <TranslationView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-soft-bg text-soft-text font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Sidebar is hidden when in full-screen study session, Landing Page, or Login */}
      {currentView !== 'LEARN_SESSION' && currentView !== 'LANDING_INTRO' && currentView !== 'LOGIN' && (
        <Sidebar
          currentView={currentView}
          setView={setCurrentView}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          user={user}
        />
      )}

      <main
        className={`flex-1 transition-all duration-300 relative ${
          currentView !== 'LEARN_SESSION' && currentView !== 'LANDING_INTRO' && currentView !== 'LOGIN'
            ? sidebarCollapsed
              ? 'ml-[4.75rem]'
              : 'ml-[17rem]'
            : ''
        }`}
      >
        {/* Global Header / Brand Switcher Area */}
        {currentView !== 'LEARN_SESSION' && currentView !== 'LANDING_INTRO' && (
          // Only show BrandSelector on specific pages if needed, or globally here.
          // Currently removed from global to avoid obstruction as per previous request.
          null
        )}
        {renderContent()}

      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrandProvider>
        <TaskProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AppContent />
            </ConfirmProvider>
          </ToastProvider>
        </TaskProvider>
      </BrandProvider>
    </AuthProvider>
  );
}

export default App;