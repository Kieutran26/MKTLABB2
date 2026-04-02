import { VocabSet, Word, TranslationRecord, Plan, SavedPrompt, ToDoTask, ContentHistoryRecord, KeyVisualProject, EmailTemplate, EmailHistoryRecord, StoryboardProject, UtmRecord, UtmPreset, RoasScenario, Brand, Competitor, Persona, MindmapProject, ScamperSession, CalendarProject, MastermindStrategy, SavedEmailDesign } from '../types';

const KEYS = {
  // ... (Existing keys)
  SETS: 'eng_app_sets',
  WORDS: 'eng_app_words',
  HISTORY: 'eng_app_history',
  PLANS: 'eng_app_plans',
  PROMPTS: 'eng_app_prompts',
  TODOS: 'eng_app_todos',
  CONTENT_HISTORY: 'eng_app_content_history',
  KV_PROJECTS: 'eng_app_kv_projects',
  EMAIL_TEMPLATES: 'eng_app_email_templates',
  EMAIL_HISTORY: 'eng_app_email_history',
  STORYBOARDS: 'eng_app_storyboards',
  UTM_HISTORY: 'eng_app_utm_history',
  UTM_PRESETS: 'eng_app_utm_presets',
  ROAS_SCENARIOS: 'eng_app_roas_scenarios',
  BRANDS: 'eng_app_brands',
  ACTIVE_BRAND_ID: 'eng_app_active_brand_id',
  COMPETITORS: 'eng_app_competitors',
  PERSONAS: 'eng_app_personas',
  MINDMAPS: 'eng_app_mindmaps',
  SCAMPER_SESSIONS: 'eng_app_scamper_sessions',
  CALENDAR_PROJECTS: 'eng_app_calendar_projects',
  MASTERMIND_STRATEGIES: 'eng_app_mastermind_strategies',
  SAVED_EMAIL_DESIGNS: 'eng_app_saved_email_designs'
};

export const StorageService = {
  // ... (Keep existing methods) ...
  // (All previous methods here...)
  getSets: (): VocabSet[] => {
    const data = localStorage.getItem(KEYS.SETS);
    return data ? JSON.parse(data) : [];
  },
  saveSet: (newSet: VocabSet) => {
    const sets = StorageService.getSets();
    localStorage.setItem(KEYS.SETS, JSON.stringify([...sets, newSet]));
  },
  updateSet: (updatedSet: VocabSet) => {
    const sets = StorageService.getSets();
    const index = sets.findIndex(s => s.id === updatedSet.id);
    if (index !== -1) {
      sets[index] = updatedSet;
      localStorage.setItem(KEYS.SETS, JSON.stringify(sets));
    }
  },
  deleteSet: (setId: string) => {
    const sets = StorageService.getSets();
    const newSets = sets.filter(s => s.id !== setId);
    localStorage.setItem(KEYS.SETS, JSON.stringify(newSets));

    // Also delete words in this set
    const words = StorageService.getWords();
    const newWords = words.filter(w => w.setId !== setId);
    localStorage.setItem(KEYS.WORDS, JSON.stringify(newWords));
  },
  getWords: (): Word[] => {
    const data = localStorage.getItem(KEYS.WORDS);
    return data ? JSON.parse(data) : [];
  },
  getWordsBySet: (setIds: string[]): Word[] => {
    const allWords = StorageService.getWords();
    return allWords.filter(w => setIds.includes(w.setId));
  },
  getStarredWords: (): Word[] => {
    const allWords = StorageService.getWords();
    return allWords.filter(w => w.starred);
  },
  addWords: (newWords: Word[]) => {
    const words = StorageService.getWords();
    localStorage.setItem(KEYS.WORDS, JSON.stringify([...words, ...newWords]));
  },
  updateWord: (updatedWord: Word) => {
    const words = StorageService.getWords();
    const index = words.findIndex(w => w.id === updatedWord.id);
    if (index !== -1) {
      words[index] = updatedWord;
      localStorage.setItem(KEYS.WORDS, JSON.stringify(words));
    }
  },
  deleteWord: (wordId: string) => {
    const words = StorageService.getWords();
    const newWords = words.filter(w => w.id !== wordId);
    localStorage.setItem(KEYS.WORDS, JSON.stringify(newWords));
  },
  toggleStar: (wordId: string) => {
    const words = StorageService.getWords();
    const index = words.findIndex(w => w.id === wordId);
    if (index !== -1) {
      words[index].starred = !words[index].starred;
      localStorage.setItem(KEYS.WORDS, JSON.stringify(words));
    }
  },
  getHistory: (): TranslationRecord[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addHistory: (record: TranslationRecord) => {
    const history = StorageService.getHistory();
    const newHistory = [record, ...history].slice(0, 50);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(newHistory));
  },
  deleteHistory: (id: string) => {
    const history = StorageService.getHistory();
    const newHistory = history.filter(h => h.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(newHistory));
  },
  clearAllHistory: () => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
  },

  getPlans: (): Plan[] => {
    const data = localStorage.getItem(KEYS.PLANS);
    return data ? JSON.parse(data) : [];
  },
  addPlan: (plan: Plan) => {
    const plans = StorageService.getPlans();
    localStorage.setItem(KEYS.PLANS, JSON.stringify([...plans, plan]));
  },
  updatePlan: (updatedPlan: Plan) => {
    const plans = StorageService.getPlans();
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      plans[index] = updatedPlan;
      localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
    }
  },
  deletePlan: (id: string) => {
    const plans = StorageService.getPlans();
    const newPlans = plans.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PLANS, JSON.stringify(newPlans));
  },
  getPrompts: (): SavedPrompt[] => {
    const data = localStorage.getItem(KEYS.PROMPTS);
    return data ? JSON.parse(data) : [];
  },
  addPrompt: (prompt: SavedPrompt) => {
    const prompts = StorageService.getPrompts();
    localStorage.setItem(KEYS.PROMPTS, JSON.stringify([prompt, ...prompts]));
  },
  updatePrompt: (updatedPrompt: SavedPrompt) => {
    const prompts = StorageService.getPrompts();
    const index = prompts.findIndex(p => p.id === updatedPrompt.id);
    if (index !== -1) {
      prompts[index] = updatedPrompt;
      localStorage.setItem(KEYS.PROMPTS, JSON.stringify(prompts));
    }
  },
  deletePrompt: (id: string) => {
    const prompts = StorageService.getPrompts();
    const newPrompts = prompts.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PROMPTS, JSON.stringify(newPrompts));
  },
  getTasks: (): ToDoTask[] => {
    const data = localStorage.getItem(KEYS.TODOS);
    return data ? JSON.parse(data) : [];
  },
  addTask: (task: ToDoTask) => {
    const tasks = StorageService.getTasks();
    localStorage.setItem(KEYS.TODOS, JSON.stringify([task, ...tasks]));
  },
  toggleTask: (id: string) => {
    const tasks = StorageService.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index].completed = !tasks[index].completed;
      localStorage.setItem(KEYS.TODOS, JSON.stringify(tasks));
    }
  },
  deleteTask: (id: string) => {
    const tasks = StorageService.getTasks();
    const newTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TODOS, JSON.stringify(newTasks));
  },
  clearCompletedTasks: () => {
    const tasks = StorageService.getTasks();
    const newTasks = tasks.filter(t => !t.completed);
    localStorage.setItem(KEYS.TODOS, JSON.stringify(newTasks));
  },
  getContentHistory: (): ContentHistoryRecord[] => {
    const data = localStorage.getItem(KEYS.CONTENT_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addContentHistory: (record: ContentHistoryRecord) => {
    const history = StorageService.getContentHistory();
    const newHistory = [record, ...history].slice(0, 20);
    localStorage.setItem(KEYS.CONTENT_HISTORY, JSON.stringify(newHistory));
  },
  deleteContentHistory: (id: string) => {
    const history = StorageService.getContentHistory();
    const newHistory = history.filter(h => h.id !== id);
    localStorage.setItem(KEYS.CONTENT_HISTORY, JSON.stringify(newHistory));
  },
  getKVProjects: (): KeyVisualProject[] => {
    const data = localStorage.getItem(KEYS.KV_PROJECTS);
    return data ? JSON.parse(data) : [];
  },
  saveKVProject: (project: KeyVisualProject) => {
    const projects = StorageService.getKVProjects();
    const index = projects.findIndex(p => p.id === project.id);
    let newProjects;
    if (index !== -1) {
      projects[index] = project;
      newProjects = projects;
    } else {
      newProjects = [project, ...projects];
    }
    try {
      localStorage.setItem(KEYS.KV_PROJECTS, JSON.stringify(newProjects));
    } catch (e) {
      alert("Bộ nhớ trình duyệt đã đầy. Không thể lưu thêm hình ảnh vào dự án.");
    }
  },
  deleteKVProject: (id: string) => {
    const projects = StorageService.getKVProjects();
    const newProjects = projects.filter(p => p.id !== id);
    localStorage.setItem(KEYS.KV_PROJECTS, JSON.stringify(newProjects));
  },
  getEmailTemplates: (): EmailTemplate[] => {
    const data = localStorage.getItem(KEYS.EMAIL_TEMPLATES);
    return data ? JSON.parse(data) : [];
  },
  saveEmailTemplate: (template: EmailTemplate) => {
    const templates = StorageService.getEmailTemplates();
    const newTemplates = [template, ...templates];
    try {
      localStorage.setItem(KEYS.EMAIL_TEMPLATES, JSON.stringify(newTemplates));
      return true;
    } catch (e) {
      console.error("Storage quota exceeded", e);
      return false;
    }
  },
  deleteEmailTemplate: (id: string) => {
    const templates = StorageService.getEmailTemplates();
    const newTemplates = templates.filter(t => t.id !== id);
    localStorage.setItem(KEYS.EMAIL_TEMPLATES, JSON.stringify(newTemplates));
  },
  getEmailHistory: (): EmailHistoryRecord[] => {
    const data = localStorage.getItem(KEYS.EMAIL_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addEmailHistory: (record: EmailHistoryRecord) => {
    const history = StorageService.getEmailHistory();
    const newHistory = [record, ...history].slice(0, 20);
    try {
      localStorage.setItem(KEYS.EMAIL_HISTORY, JSON.stringify(newHistory));
      return true;
    } catch (e) {
      console.error("Storage quota exceeded", e);
      return false;
    }
  },
  deleteEmailHistory: (id: string) => {
    const history = StorageService.getEmailHistory();
    const newHistory = history.filter(h => h.id !== id);
    localStorage.setItem(KEYS.EMAIL_HISTORY, JSON.stringify(newHistory));
  },
  getStoryboards: (): StoryboardProject[] => {
    const data = localStorage.getItem(KEYS.STORYBOARDS);
    return data ? JSON.parse(data) : [];
  },
  saveStoryboard: (project: StoryboardProject) => {
    const projects = StorageService.getStoryboards();
    const index = projects.findIndex(p => p.id === project.id);
    let newProjects;
    if (index !== -1) {
      projects[index] = project;
      newProjects = projects;
    } else {
      newProjects = [project, ...projects];
    }
    try {
      localStorage.setItem(KEYS.STORYBOARDS, JSON.stringify(newProjects));
      return true;
    } catch (e) {
      alert("Bộ nhớ đầy, vui lòng xóa bớt dự án cũ.");
      return false;
    }
  },
  deleteStoryboard: (id: string) => {
    const projects = StorageService.getStoryboards();
    const newProjects = projects.filter(p => p.id !== id);
    localStorage.setItem(KEYS.STORYBOARDS, JSON.stringify(newProjects));
  },
  getUtmHistory: (): UtmRecord[] => {
    const data = localStorage.getItem(KEYS.UTM_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addUtmRecord: (record: UtmRecord) => {
    const history = StorageService.getUtmHistory();
    const newHistory = [record, ...history].slice(0, 100);
    localStorage.setItem(KEYS.UTM_HISTORY, JSON.stringify(newHistory));
  },
  deleteUtmRecord: (id: string) => {
    const history = StorageService.getUtmHistory();
    const newHistory = history.filter(h => h.id !== id);
    localStorage.setItem(KEYS.UTM_HISTORY, JSON.stringify(newHistory));
  },
  getUtmPresets: (): UtmPreset[] => {
    const data = localStorage.getItem(KEYS.UTM_PRESETS);
    return data ? JSON.parse(data) : [
      { id: 'def1', name: 'Facebook Ads (Traffic)', source: 'facebook', medium: 'cpc' },
      { id: 'def2', name: 'Google Ads (Search)', source: 'google', medium: 'cpc' },
      { id: 'def3', name: 'Email Newsletter', source: 'newsletter', medium: 'email' },
      { id: 'def4', name: 'Organic Facebook', source: 'facebook', medium: 'social' },
      { id: 'def5', name: 'Zalo Message', source: 'zalo', medium: 'chat' },
    ];
  },
  saveUtmPreset: (preset: UtmPreset) => {
    const presets = StorageService.getUtmPresets();
    localStorage.setItem(KEYS.UTM_PRESETS, JSON.stringify([...presets, preset]));
  },
  deleteUtmPreset: (id: string) => {
    const presets = StorageService.getUtmPresets();
    const newPresets = presets.filter(p => p.id !== id);
    localStorage.setItem(KEYS.UTM_PRESETS, JSON.stringify(newPresets));
  },
  getRoasHistory: (): RoasScenario[] => {
    const data = localStorage.getItem(KEYS.ROAS_SCENARIOS);
    return data ? JSON.parse(data) : [];
  },
  saveRoasScenario: (scenario: RoasScenario) => {
    const history = StorageService.getRoasHistory();
    const newHistory = [scenario, ...history].slice(0, 50);
    localStorage.setItem(KEYS.ROAS_SCENARIOS, JSON.stringify(newHistory));
  },
  deleteRoasScenario: (id: string) => {
    const history = StorageService.getRoasHistory();
    const newHistory = history.filter(h => h.id !== id);
    localStorage.setItem(KEYS.ROAS_SCENARIOS, JSON.stringify(newHistory));
  },
  getBrands: (): Brand[] => {
    const data = localStorage.getItem(KEYS.BRANDS);
    return data ? JSON.parse(data) : [];
  },
  saveBrand: (brand: Brand) => {
    const brands = StorageService.getBrands();
    const index = brands.findIndex(b => b.id === brand.id);
    let newBrands;
    if (index !== -1) {
      brands[index] = brand;
      newBrands = brands;
    } else {
      newBrands = [brand, ...brands];
    }
    try {
      localStorage.setItem(KEYS.BRANDS, JSON.stringify(newBrands));
      if (newBrands.length === 1) {
        StorageService.setActiveBrandId(brand.id);
      }
      return true;
    } catch (e) {
      alert("Bộ nhớ đầy.");
      return false;
    }
  },
  deleteBrand: (id: string) => {
    const brands = StorageService.getBrands();
    const newBrands = brands.filter(b => b.id !== id);
    localStorage.setItem(KEYS.BRANDS, JSON.stringify(newBrands));
    if (StorageService.getActiveBrandId() === id) {
      if (newBrands.length > 0) {
        StorageService.setActiveBrandId(newBrands[0].id);
      } else {
        localStorage.removeItem(KEYS.ACTIVE_BRAND_ID);
      }
    }
  },
  getActiveBrandId: (): string | null => {
    return localStorage.getItem(KEYS.ACTIVE_BRAND_ID);
  },
  setActiveBrandId: (id: string) => {
    localStorage.setItem(KEYS.ACTIVE_BRAND_ID, id);
  },
  getCompetitors: (): Competitor[] => {
    const data = localStorage.getItem(KEYS.COMPETITORS);
    return data ? JSON.parse(data) : [];
  },
  saveCompetitor: (competitor: Competitor) => {
    const competitors = StorageService.getCompetitors();
    const index = competitors.findIndex(c => c.id === competitor.id);
    let newCompetitors;
    if (index !== -1) {
      competitors[index] = competitor;
      newCompetitors = competitors;
    } else {
      newCompetitors = [competitor, ...competitors];
    }
    try {
      localStorage.setItem(KEYS.COMPETITORS, JSON.stringify(newCompetitors));
      return true;
    } catch (e) {
      alert("Storage quota exceeded.");
      return false;
    }
  },
  deleteCompetitor: (id: string) => {
    const competitors = StorageService.getCompetitors();
    const newCompetitors = competitors.filter(c => c.id !== id);
    localStorage.setItem(KEYS.COMPETITORS, JSON.stringify(newCompetitors));
  },
  getPersonas: (): Persona[] => {
    const data = localStorage.getItem(KEYS.PERSONAS);
    return data ? JSON.parse(data) : [];
  },
  savePersona: (persona: Persona) => {
    const personas = StorageService.getPersonas();
    const index = personas.findIndex(p => p.id === persona.id);
    let newPersonas;
    if (index !== -1) {
      personas[index] = persona;
      newPersonas = personas;
    } else {
      newPersonas = [persona, ...personas];
    }
    try {
      localStorage.setItem(KEYS.PERSONAS, JSON.stringify(newPersonas));
      return true;
    } catch (e) {
      alert("Storage quota exceeded.");
      return false;
    }
  },
  deletePersona: (id: string) => {
    const personas = StorageService.getPersonas();
    const newPersonas = personas.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PERSONAS, JSON.stringify(newPersonas));
  },
  getPersonasByBrand: (brandId: string): Persona[] => {
    const personas = StorageService.getPersonas();
    return personas.filter(p => p.brandId === brandId);
  },
  getMindmaps: (): MindmapProject[] => {
    const data = localStorage.getItem(KEYS.MINDMAPS);
    return data ? JSON.parse(data) : [];
  },
  saveMindmap: (project: MindmapProject) => {
    const projects = StorageService.getMindmaps();
    const index = projects.findIndex(p => p.id === project.id);
    let newProjects;
    if (index !== -1) {
      projects[index] = project;
      newProjects = projects;
    } else {
      newProjects = [project, ...projects];
    }
    try {
      localStorage.setItem(KEYS.MINDMAPS, JSON.stringify(newProjects));
      return true;
    } catch (e) {
      alert("Storage quota exceeded.");
      return false;
    }
  },
  deleteMindmap: (id: string) => {
    const projects = StorageService.getMindmaps();
    const newProjects = projects.filter(p => p.id !== id);
    localStorage.setItem(KEYS.MINDMAPS, JSON.stringify(newProjects));
  },
  getScamperSessions: (): ScamperSession[] => {
    const data = localStorage.getItem(KEYS.SCAMPER_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  saveScamperSession: (session: ScamperSession) => {
    const sessions = StorageService.getScamperSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    let newSessions;
    if (index !== -1) {
      sessions[index] = session;
      newSessions = sessions;
    } else {
      newSessions = [session, ...sessions];
    }
    if (newSessions.length > 50) newSessions.pop();
    try {
      localStorage.setItem(KEYS.SCAMPER_SESSIONS, JSON.stringify(newSessions));
      return true;
    } catch (e) {
      alert("Storage full.");
      return false;
    }
  },
  deleteScamperSession: (id: string) => {
    const sessions = StorageService.getScamperSessions();
    const newSessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(KEYS.SCAMPER_SESSIONS, JSON.stringify(newSessions));
  },
  getCalendarProjects: (): CalendarProject[] => {
    const data = localStorage.getItem(KEYS.CALENDAR_PROJECTS);
    return data ? JSON.parse(data) : [];
  },
  saveCalendarProject: (project: CalendarProject) => {
    const projects = StorageService.getCalendarProjects();
    const index = projects.findIndex(p => p.id === project.id);
    let newProjects;
    if (index !== -1) {
      projects[index] = project;
      newProjects = projects;
    } else {
      newProjects = [project, ...projects];
    }
    try {
      localStorage.setItem(KEYS.CALENDAR_PROJECTS, JSON.stringify(newProjects));
      return true;
    } catch (e) {
      alert("Storage quota exceeded.");
      return false;
    }
  },
  deleteCalendarProject: (id: string) => {
    const projects = StorageService.getCalendarProjects();
    const newProjects = projects.filter(p => p.id !== id);
    localStorage.setItem(KEYS.CALENDAR_PROJECTS, JSON.stringify(newProjects));
  },

  // --- MASTERMIND STRATEGY ---
  getMastermindStrategies: (): MastermindStrategy[] => {
    const data = localStorage.getItem(KEYS.MASTERMIND_STRATEGIES);
    return data ? JSON.parse(data) : [];
  },
  saveMastermindStrategy: (strategy: MastermindStrategy) => {
    const list = StorageService.getMastermindStrategies();
    const index = list.findIndex(s => s.id === strategy.id);
    let newList;
    if (index !== -1) {
      list[index] = strategy;
      newList = list;
    } else {
      newList = [strategy, ...list];
    }

    try {
      localStorage.setItem(KEYS.MASTERMIND_STRATEGIES, JSON.stringify(newList));
      return true;
    } catch (e) {
      alert("Storage full.");
      return false;
    }
  },
  deleteMastermindStrategy: (id: string) => {
    const list = StorageService.getMastermindStrategies();
    const newList = list.filter(s => s.id !== id);
    localStorage.setItem(KEYS.MASTERMIND_STRATEGIES, JSON.stringify(newList));
  },

  // Saved Email Designs (Visual Email Builder)
  getSavedEmailDesigns: (): SavedEmailDesign[] => {
    const data = localStorage.getItem(KEYS.SAVED_EMAIL_DESIGNS);
    return data ? JSON.parse(data) : [];
  },
  saveEmailDesign: (design: SavedEmailDesign) => {
    const designs = StorageService.getSavedEmailDesigns();
    const index = designs.findIndex(d => d.id === design.id);
    let newDesigns;
    if (index !== -1) {
      designs[index] = { ...design, updatedAt: Date.now() };
      newDesigns = designs;
    } else {
      newDesigns = [design, ...designs];
    }
    try {
      localStorage.setItem(KEYS.SAVED_EMAIL_DESIGNS, JSON.stringify(newDesigns));
      return true;
    } catch (e) {
      alert("Bộ nhớ đầy. Vui lòng xóa bớt thiết kế cũ.");
      return false;
    }
  },
  deleteSavedEmailDesign: (id: string) => {
    const designs = StorageService.getSavedEmailDesigns();
    const newDesigns = designs.filter(d => d.id !== id);
    localStorage.setItem(KEYS.SAVED_EMAIL_DESIGNS, JSON.stringify(newDesigns));
  }
};