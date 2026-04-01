/**
 * ============================================================
 *  OptiMKT — Landing Page (Standalone Single File)
 *  Style: Editorial Minimalism
 * ============================================================
 *
 *  DEPENDENCIES:
 *    npm install framer-motion lucide-react
 *
 *  FONTS (thêm vào index.css hoặc global.css):
 *    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
 *
 *  Sử dụng:
 *    import LandingPage from './LandingPage';
 *    <Route path="/" element={<LandingPage />} />
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Menu, X, ArrowRight, Play, ChevronDown,
  Target, Lightbulb, Palette, Megaphone,
  Zap, BarChart3, Layers, Star, Check, Quote,
  Clock, Shield, Users, Code2, Globe,
  Twitter, Linkedin, Github, Youtube,
  ChevronRight, LayoutGrid, BookOpen, ListChecks, Wrench, GraduationCap
} from 'lucide-react';

/* ─────────────────── SHARED STYLES ─────────────────── */
const PRIMARY = 'hsl(142,20%,38%)';
const FONT_HEADING = "'Playfair Display', serif";
const FONT_BODY = "'Inter', sans-serif";

/* ─────────────────── DATA ─────────────────── */

const NAV_LINKS = ['Giới thiệu', 'Ai dùng', 'Giá cả'];

const FEATURES = [
  { icon: Target,    label: 'Strategy & Research', desc: 'Phân tích thị trường, lập chiến lược chuyên sâu' },
  { icon: Lightbulb, label: 'Ideation & Content',  desc: 'Tạo ý tưởng và nội dung sáng tạo với AI' },
  { icon: Palette,   label: 'Design & Visuals',    desc: 'Mockup, Visual Brief và hình ảnh thương hiệu' },
  { icon: Megaphone, label: 'Ads & Performance',   desc: 'Tối ưu ngân sách và đo lường hiệu quả quảng cáo' },
];

const SIDEBAR_ITEMS = [
  { icon: LayoutGrid, label: 'Models & Content', children: ['Mastermind Strategy', 'Hook Generator', 'Viral Content', 'Content Calendar'] },
  { icon: Lightbulb, label: 'Idea Strategy AI', children: ['Insight Finder', 'Trend Scanner', 'Persona Builder'] },
  { icon: Palette, label: 'Design & Visuals', children: ['Visual Brief', 'Mockup Generator', 'Key Visuals'] },
  { icon: Megaphone, label: 'Ads & Performance', children: ['Budget Allocation', 'A/B Testing', 'ROAS Forecaster'] },
  { icon: BookOpen, label: 'Quản lý Plan', children: [] },
  { icon: ListChecks, label: 'To-Do List', children: [] },
  { icon: Globe, label: 'Tin Tức Tổng Hợp', children: [] },
  { icon: Wrench, label: 'Bộ Công Cụ', children: [] },
];

const TAB_CONTENTS = {
  'Mastermind Strategy': { title: 'Mastermind Strategy', subtitle: 'Xây dựng chiến lược nội dung tổng thể dựa trên kết nối con người.', tabs: ['Giai đoạn 1', 'Giai đoạn 2', 'Giai đoạn 3'] },
  'Hook Generator': { title: 'Hook Generator', subtitle: 'Tạo hook cuốn hút cho nội dung của bạn chỉ trong vài giây.', tabs: ['Mạng xã hội', 'Email', 'Quảng cáo'] },
  'Viral Content': { title: 'Viral Content', subtitle: 'Phân tích và tạo nội dung có tiềm năng lan truyền cao.', tabs: ['Facebook', 'TikTok', 'Instagram'] },
  'Content Calendar': { title: 'Content Calendar', subtitle: 'Lập lịch và quản lý nội dung theo tuần, tháng.', tabs: ['Tuần này', 'Tháng này', 'Quý này'] },
};

const REASONS = [
  { icon: Zap, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', title: 'Tiết kiệm thời gian', desc: 'Tự động hoá quy trình làm việc từ nghiên cứu đến tạo content, giảm 70% thời gian thực thi.' },
  { icon: BarChart3, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', title: 'Dựa trên dữ liệu', desc: 'Mọi quyết định đều được hỗ trợ bởi AI phân tích xu hướng thị trường theo thời gian thực.' },
  { icon: Layers, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', title: 'Dễ sử dụng & Toàn diện', desc: 'Giao diện trực quan, không cần kỹ năng kỹ thuật — bắt đầu ngay trong vài phút.' },
];

const STATS = [
  { value: '2,000+', label: 'Marketer đang dùng', color: 'text-gray-900' },
  { value: '70%', label: 'Tiết kiệm thời gian', color: 'text-orange-500' },
  { value: '50+', label: 'Công cụ AI', color: 'text-emerald-700' },
];

const PLANS = [
  { name: 'Starter', price: '0', unit: 'đ', period: '', desc: 'Bắt đầu miễn phí, không cần thẻ', features: ['Truy cập miễn phí một số tool', 'MKT cơ bản', '2 Projects'], cta: 'Bắt đầu miễn phí', featured: false },
  { name: 'Professional', price: '499.000', unit: 'đ', period: '/ tháng', desc: 'Đầy đủ tính năng cho Marketer', features: ['Toàn bộ công cụ AI', 'Priority Support', 'Không giới hạn Projects', 'Tính năng nâng cao', 'Export & Sharing', 'Analytics & MKT'], cta: 'Bắt đầu dùng thử', featured: true },
  { name: 'Enterprise', price: 'Liên hệ', unit: '', period: '', desc: 'Giải pháp tùy chỉnh cho doanh nghiệp', features: ['Custom workspace', 'SLA Support', 'Onboarding riêng', 'API Access', 'SSO / White-label', 'Tư vấn triển khai'], cta: 'Liên hệ tư vấn', featured: false },
];

/* ─────────────────── NAVBAR ─────────────────── */

function Navbar({ setView }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href={setView ? '#' : '/'} onClick={(e) => setView ? onAppLink(e, setView) : undefined} className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}><Sparkles className="w-4 h-4 text-white" /></div>
          <span className="font-semibold text-base tracking-tight" style={{ fontFamily: FONT_HEADING }}>OptiMKT</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => <a key={l} href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{l}</a>)}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <a href={setView ? '#' : '/login'} onClick={(e) => setView ? onAppLink(e, setView) : undefined} className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">Đăng nhập</a>
          <a href={setView ? '#' : '/register'} onClick={(e) => setView ? onAppLink(e, setView) : undefined} className="px-5 py-2 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer">Bắt đầu miễn phí</a>
        </div>
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-3">
          {NAV_LINKS.map(l => <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-900 py-1">{l}</a>)}
          <div className="pt-2 flex flex-col gap-2">
            <a href={setView ? '#' : '/login'} onClick={(e) => { if (setView) onAppLink(e, setView); setMobileOpen(false); }} className="text-sm text-center py-2 border border-gray-200 rounded-full text-gray-700 cursor-pointer">Đăng nhập</a>
            <a href={setView ? '#' : '/register'} onClick={(e) => { if (setView) onAppLink(e, setView); setMobileOpen(false); }} className="block text-center py-2 rounded-full bg-gray-900 text-white text-sm font-medium cursor-pointer">Bắt đầu miễn phí</a>
          </div>
        </div>
      )}
    </motion.header>
  );
}

/* ─────────────────── HERO ─────────────────── */

const HERO_HEADLINE_TYPEWRITER_PHRASES = [
  'Thông minh & Toàn diện',
  'Tất cả trong một',
];

function HeroHeadlineTypewriter({ phrases, className, delay = 0 }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timeouts = [];

    const after = (ms, fn) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    const typeChar = (phrase, i, onDone) => {
      if (cancelled) return;
      if (i < phrase.length) {
        setDisplayed(phrase.slice(0, i + 1));
        after(55, () => typeChar(phrase, i + 1, onDone));
      } else onDone();
    };

    const eraseChar = (phrase, len, onDone) => {
      if (cancelled) return;
      if (len > 0) {
        setDisplayed(phrase.slice(0, len - 1));
        after(35, () => eraseChar(phrase, len - 1, onDone));
      } else onDone();
    };

    const run = (idx) => {
      if (cancelled) return;
      const phrase = phrases[idx % phrases.length];
      typeChar(phrase, 0, () => {
        after(1800, () => {
          eraseChar(phrase, phrase.length, () => {
            run(idx + 1);
          });
        });
      });
    };

    after(delay * 1000, () => run(0));

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [phrases, delay]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

function HeroFloatingShapes() {
  const pill =
    'pointer-events-none absolute z-[5] hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200/90 bg-white/85 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm';

  return (
    <>
      {/* Trái — cao, ngang dòng 1 headline (~-12°) */}
      <motion.div
        className={`${pill} left-12 xl:left-16 2xl:left-20 top-[5.25rem]`}
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: [-13, -10, -13],
        }}
        transition={{
          opacity: { duration: 0.45, delay: 0.35 },
          y: { duration: 0.45, delay: 0.35 },
          rotate: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
        <span>Siêu tốc</span>
      </motion.div>

      {/* Trái — thấp, gần CTA (~+8°) */}
      <motion.div
        className={`${pill} left-12 xl:left-16 2xl:left-20 top-[21.5rem] sm:top-[22.5rem]`}
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: [8, 11, 8],
        }}
        transition={{
          opacity: { duration: 0.45, delay: 0.45 },
          y: { duration: 0.45, delay: 0.45 },
          rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Code2 className="w-3.5 h-3.5 shrink-0 text-gray-500" />
        <span>Kéo thả</span>
      </motion.div>

      {/* Phải — giữa block headline (~-17°) */}
      <motion.div
        className={`${pill} right-12 xl:right-16 2xl:right-20 top-[8.5rem] sm:top-[9rem]`}
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: [-18, -15, -18],
        }}
        transition={{
          opacity: { duration: 0.45, delay: 0.4 },
          y: { duration: 0.45, delay: 0.4 },
          rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Palette className="w-3.5 h-3.5 shrink-0 text-[hsl(142,20%,38%)]" />
        <span>Đẹp mắt</span>
      </motion.div>
    </>
  );
}

const STAT_VALUE_CLASS = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  purple: 'text-purple-600',
};

/** Khi chạy trong OptiMKT SPA, điều hướng vào dashboard thay vì /register */
function onAppLink(e, setView) {
  if (setView) {
    e.preventDefault();
    setView('HOME_DASHBOARD');
  }
}

function Hero({ setView }) {
  return (
    <section className="relative pt-36 pb-20 px-6 overflow-x-hidden">
      {/* Background: square grid + soft gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 65% at 50% 32%, #000 18%, transparent 72%)',
            maskImage:
              'radial-gradient(ellipse 85% 65% at 50% 32%, #000 18%, transparent 72%)',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[hsl(142,20%,38%)]/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto">
        <HeroFloatingShapes />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white/80 backdrop-blur text-xs font-medium text-gray-600 mb-8 cursor-pointer hover:border-gray-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[hsl(142,20%,38%)]" />
            <span>Phiên bản V3.0 — Tính năng AI hoàn toàn mới</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-6 text-gray-900"
          >
            Nền tảng Marketing
            <br />
            <HeroHeadlineTypewriter
              phrases={HERO_HEADLINE_TYPEWRITER_PHRASES}
              className="text-[hsl(142,20%,38%)] italic block min-h-[1.35em]"
              delay={0.35}
            />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Tạo nội dung, phân tích dữ liệu, lên kế hoạch chiến lược và đo lường hiệu quả
            — tất cả trong một nền tảng AI-powered duy nhất.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href={setView ? '#' : '/register'}
              onClick={(e) => onAppLink(e, setView)}
              className="inline-flex items-center gap-2 px-8 h-12 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 h-12 rounded-full text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                <Play className="w-3 h-3 ml-0.5" />
              </div>
              Xem cách hoạt động
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 text-xs text-gray-400"
          >
            Không cần thẻ tín dụng • Dùng thử 14 ngày • Huỷ bất kỳ lúc nào
          </motion.p>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-900/5 overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gray-200" />
                  ))}
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-7 rounded-md bg-white border border-gray-200 flex items-center px-3">
                    <span className="text-[11px] text-gray-400">app.optimkt.vn/dashboard</span>
                  </div>
                </div>
              </div>
              {/* Preview content */}
              <div className="p-4 sm:p-5 bg-[#FAFAFA]">
                {/* Top Grids - 3 cols x 2 rows, plus 1 col row 3 */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Row 1 */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.6 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-gray-500">Người dùng mới</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-100" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">8,421</div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.7 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-gray-500">Chuyển đổi</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">12.5%</div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.8 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-gray-500">Chiến dịch</span>
                      <div className="w-3.5 h-3.5 rounded bg-orange-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-sm" />
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">14 Active</div>
                  </motion.div>

                  {/* Row 2 */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.7 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="text-[10px] font-medium text-gray-500 mb-2">Tương tác tuần</div>
                    <div className="flex items-end gap-1 h-5">
                      {[40, 70, 50, 90, 60, 100].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.9 + i * 0.05 }} className="flex-1 bg-purple-100 rounded-sm" />
                      ))}
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.8 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="text-[10px] font-medium text-gray-500 mb-2">Mục tiêu Q2</div>
                    <div className="h-1.5 w-full bg-gray-50 rounded overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '66.6%' }} transition={{ duration: 0.7, delay: 1.0 }} className="h-full bg-blue-400" />
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-gray-50 rounded overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 0.7, delay: 1.1 }} className="h-full bg-emerald-400" />
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.9 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="text-[10px] font-medium text-gray-500 mb-1.5">Team Members</div>
                    <div className="flex gap-1 mt-1">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 1.0 }} className="w-5 h-5 rounded-full bg-gray-100 border border-white z-10 flex items-center justify-center text-[8px] font-bold text-gray-500">A</motion.div>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 1.1 }} className="w-5 h-5 rounded-full bg-blue-50 border border-white -ml-2 z-20 flex items-center justify-center text-[8px] font-bold text-blue-600">B</motion.div>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 1.2 }} className="w-5 h-5 rounded-full bg-orange-50 border border-white -ml-2 z-30 flex items-center justify-center text-[8px] font-bold text-orange-600">+3</motion.div>
                    </div>
                  </motion.div>

                  {/* Row 3 - Only 1 box */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.8 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 h-[72px]">
                    <div className="text-[10px] font-medium text-gray-500 mb-2">Nguồn traffic</div>
                    <div className="flex gap-1 h-2 mt-2">
                       <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 0.7, delay: 1.0 }} className="bg-blue-500 rounded-l-sm" />
                       <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} transition={{ duration: 0.7, delay: 1.1 }} className="bg-purple-500" />
                       <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} transition={{ duration: 0.7, delay: 1.2 }} className="bg-emerald-500 rounded-r-sm" />
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Row - 2 cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }} className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="text-xs font-bold text-gray-700 mb-4">Gợi ý nội dung từ AI</div>
                    <div className="space-y-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 0.8, delay: 1.1 }} className="h-2 bg-gray-100 rounded-full" />
                      <motion.div initial={{ width: 0 }} animate={{ width: '33%' }} transition={{ duration: 0.8, delay: 1.2 }} className="h-2 bg-gray-100 rounded-full" />
                      <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} transition={{ duration: 0.8, delay: 1.3 }} className="h-2 bg-gray-100 rounded-full" />
                    </div>
                  </motion.div>
                  
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="col-span-1 lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-end">
                    <div className="text-xs font-bold text-gray-700 mb-auto">Tăng trưởng</div>
                    <div className="flex items-end justify-between gap-1.5 h-10 mt-4">
                      {[15, 25, 20, 35, 20, 40].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}px` }} transition={{ duration: 0.5, delay: 1.2 + i * 0.1 }} className="flex-1 bg-[#fed7aa] rounded-t-md" />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-[hsl(142,20%,38%)]/10 blur-2xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}


/* ─────────────────── APP MOCKUP (Interactive) ─────────────────── */

function AppMockup() {
  const [openItems, setOpenItems] = useState({ 'Models & Content': true });
  const [activeChild, setActiveChild] = useState('Mastermind Strategy');
  const [activeTab, setActiveTab] = useState(0);

  const toggleItem = (label) => setOpenItems(prev => ({ ...prev, [label]: !prev[label] }));
  const content = TAB_CONTENTS[activeChild] || TAB_CONTENTS['Mastermind Strategy'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/40">
        <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-200" />)}</div>
        <div className="ml-3 flex gap-5 text-xs text-gray-400">
          <span>All Strategy &amp; Research</span>
          <span className="text-gray-900 font-semibold border-b-2 border-gray-900 pb-0.5">{activeChild}</span>
        </div>
      </div>

      <div className="flex" style={{ height: '420px' }}>
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-100 bg-gray-50/20 flex flex-col flex-shrink-0 overflow-y-auto py-3 px-2">
          <div className="flex items-center gap-2 px-2 mb-4">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${PRIMARY}20` }}><Sparkles className="w-3 h-3" style={{ color: PRIMARY }} /></div>
            <span className="text-xs font-semibold text-gray-900">OptiMKT</span>
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isOpen = openItems[item.label];
            const hasChildren = item.children.length > 0;
            const isParentActive = hasChildren && item.children.includes(activeChild);
            return (
              <div key={item.label}>
                <button onClick={() => hasChildren && toggleItem(item.label)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-colors ${isParentActive ? 'text-emerald-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                  style={isParentActive ? { background: `${PRIMARY}12` } : {}}>
                  <div className="flex items-center gap-2 min-w-0"><Icon className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-[11px] font-medium truncate">{item.label}</span></div>
                  {hasChildren && <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />}
                </button>
                <AnimatePresence initial={false}>
                  {hasChildren && isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      {item.children.map(child => (
                        <button key={child} onClick={() => { setActiveChild(child); setActiveTab(0); }}
                          className={`w-full flex items-center gap-2 pl-6 pr-2 py-1.5 rounded-lg text-left mb-0.5 transition-colors ${activeChild === child ? 'font-semibold text-emerald-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                          style={activeChild === child ? { background: `${PRIMARY}18` } : {}}>
                          <div className={`w-1 h-1 rounded-full flex-shrink-0 ${activeChild === child ? 'bg-emerald-700' : 'bg-gray-300'}`} />
                          <span className="text-[10px] truncate">{child}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="mb-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">Chiến lược nội dung</p>
            <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: FONT_HEADING }}>{content.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{content.subtitle}</p>
          </div>
          <div className="flex border-b border-gray-200 mb-5">
            {content.tabs.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === i ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>{tab}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Data chips row */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { label: 'Marketing', color: '#3B82F6' },
                { label: 'Content', color: '#10B981' },
                { label: 'SEO', color: '#F59E0B' },
                { label: 'Social', color: '#A855F7' },
              ].map((chip, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${chip.color}15`, color: chip.color }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chip.color }} />
                  {chip.label}
                </div>
              ))}
            </div>

            {/* Main cards grid - 2 columns */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Card 1: Thumbnail grid */}
              <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-2 w-20 bg-gray-200 rounded" />
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { h: 32, color: '#3B82F6' },
                    { h: 24, color: '#10B981' },
                    { h: 40, color: '#F59E0B' },
                    { h: 28, color: '#A855F7' },
                    { h: 36, color: '#3B82F6' },
                    { h: 20, color: '#F43F5E' },
                  ].map((thumb, i) => (
                    <div key={i} className="rounded-md border border-gray-100 overflow-hidden">
                      <div style={{ height: `${thumb.h}px`, backgroundColor: thumb.color, opacity: 0.2 }} />
                      <div className="h-3 bg-gray-50 border-t border-gray-100" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Donut chart */}
              <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-2 w-16 bg-gray-200 rounded" />
                  <div className="w-5 h-5 rounded-full bg-gray-100" />
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray="35 53" strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="25 63" strokeDashoffset="-35" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="18 70" strokeDashoffset="-60" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#A855F7" strokeWidth="3" strokeDasharray="11 77" strokeDashoffset="-78" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-[10px] font-bold text-gray-700">89%</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'MKT', value: '35%', color: '#3B82F6' },
                    { label: 'Content', value: '25%', color: '#10B981' },
                    { label: 'SEO', value: '18%', color: '#F59E0B' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px]">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-500">{item.label}</span>
                      </div>
                      <span className="font-medium text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Views', value: '12.5K', color: '#3B82F6' },
                { label: 'Engage', value: '89%', color: '#10B981' },
                { label: 'Reach', value: '45K', color: '#F59E0B' },
                { label: 'ROI', value: '3.2x', color: '#A855F7' },
              ].map((stat, i) => (
                <div key={i} className="rounded-lg bg-gray-50/80 border border-gray-100 p-2.5 text-center">
                  <div className="text-[10px] text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Progress items */}
            <div className="space-y-2">
              {[
                { title: 'Chiến dịch Q1', progress: 72, color: '#3B82F6', barColor: '#DBEAFE' },
                { title: 'Content tuần này', progress: 85, color: '#10B981', barColor: '#D1FAE5' },
                { title: 'SEO ranking', progress: 45, color: '#F59E0B', barColor: '#FEF3C7' },
                { title: 'Social reach', progress: 93, color: '#A855F7', barColor: '#F3E8FF' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-gray-100">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: item.barColor }}>
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-gray-600 truncate">{item.title}</span>
                      <span className="text-[10px] font-semibold ml-2" style={{ color: item.color }}>{item.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: item.barColor }}>
                      <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── FEATURES ─────────────────── */

function Features() {
  return (
    <section className="py-28 px-6 bg-gray-50/60">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-3">Tính năng nổi bật</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-gray-900" style={{ fontFamily: FONT_HEADING }}>Giao diện tất cả trong một</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">Mọi công cụ Marketing bạn cần đều có sẵn trong một nền tảng thống nhất, thông minh và dễ sử dụng.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14">
          <AppMockup />
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.08 * i }}
                className="group p-5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-700/30 hover:shadow-lg transition-all duration-300">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${PRIMARY}12` }}><Icon className="w-4 h-4" style={{ color: PRIMARY }} /></div>
                <h3 className="font-semibold text-sm mb-1.5 text-gray-900">{f.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── WHY US ─────────────────── */

function WhyUs() {
  return (
    <section className="py-28 px-6 bg-gray-50/40">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-center mb-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-3">Tại sao chọn</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900" style={{ fontFamily: FONT_HEADING }}>Tại sao chọn <span className="italic" style={{ color: PRIMARY }}>OptiMKT?</span></h2>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-4">
            {REASONS.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="group flex gap-5 p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-700/25 hover:shadow-md transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl ${r.iconBg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-5 h-5 ${r.iconColor}`} /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1.5 text-gray-900">{r.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-emerald-700/50 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                </motion.div>
              );
            })}
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
              <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              <span className="inline-block text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: PRIMARY }}>Đánh giá từ chuyên gia</span>
              <blockquote className="text-sm text-gray-800 leading-relaxed mb-6 italic">"OptiMKT đã thay đổi hoàn toàn cách chúng tôi làm Marketing. Từ phân tích đối thủ đến tạo content hàng loạt — tiết kiệm hơn 60% thời gian mỗi tuần."</blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>NG</div>
                <div><div className="font-semibold text-sm text-gray-900">Ngọc Hân</div><div className="text-xs text-gray-400">Head of Marketing · Startup SaaS</div></div>
              </div>
            </motion.div>
            <div className="grid grid-cols-3 gap-3">
              {STATS.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 + 0.07 * i }}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: FONT_HEADING }}>{s.value}</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── PRICING ─────────────────── */

function Pricing() {
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-3">Bảng giá linh hoạt</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-3" style={{ fontFamily: FONT_HEADING }}>Chọn gói phù hợp với bạn</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">Bắt đầu miễn phí, nâng cấp khi bạn sẵn sàng phát triển.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 * i }}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${plan.featured ? 'bg-gray-900 text-white shadow-2xl ring-1 ring-gray-900/10 scale-[1.03] z-10' : 'bg-white border border-gray-200 hover:border-emerald-700/30 hover:shadow-lg'}`}>
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full bg-orange-500 text-white shadow-sm"><Sparkles className="w-3 h-3" /> Phổ biến nhất</span>
                </div>
              )}
              <div className="mb-6"><span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${plan.featured ? 'text-white/50' : 'text-gray-400'}`}>{plan.name}</span></div>
              <div className="mb-2">
                {plan.unit ? (
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold leading-none ${plan.featured ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: FONT_HEADING }}>{plan.price}</span>
                    <span className={`text-lg font-semibold mb-0.5 ${plan.featured ? 'text-white/70' : 'text-gray-500'}`}>{plan.unit}</span>
                    {plan.period && <span className={`text-sm mb-1 ml-1 ${plan.featured ? 'text-white/40' : 'text-gray-400'}`}>{plan.period}</span>}
                  </div>
                ) : (
                  <span className={`text-4xl font-bold ${plan.featured ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: FONT_HEADING }}>{plan.price}</span>
                )}
              </div>
              <p className={`text-xs mb-7 ${plan.featured ? 'text-white/50' : 'text-gray-400'}`}>{plan.desc}</p>
              <div className={`w-full h-px mb-6 ${plan.featured ? 'bg-white/15' : 'bg-gray-100'}`} />
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.featured ? 'bg-white/15' : ''}`} style={!plan.featured ? { background: `${PRIMARY}12` } : {}}>
                      <Check className={`w-2.5 h-2.5 ${plan.featured ? 'text-white' : ''}`} style={!plan.featured ? { color: PRIMARY } : {}} />
                    </div>
                    <span className={plan.featured ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full h-11 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${plan.featured ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                {plan.cta}<ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="text-center text-xs text-gray-400 mt-10">
          Không yêu cầu thẻ tín dụng · Hủy bất cứ lúc nào · Hỗ trợ 24/7
        </motion.p>
      </div>
    </section>
  );
}

/* ─────────────────── FOOTER ─────────────────── */

function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}><Sparkles className="w-3.5 h-3.5 text-white" /></div>
            <span className="font-semibold text-sm text-gray-900" style={{ fontFamily: FONT_HEADING }}>OptiMKT</span>
          </div>
          <p className="text-xs text-gray-400">© 2024 OptiMKT. All rights reserved.</p>
          <div className="flex items-center gap-6">{['Điều khoản', 'Bảo mật', 'Liên hệ'].map(l => <a key={l} href="#" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────── MAIN EXPORT ─────────────────── */

export default function HomePage({ setView }) {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: FONT_BODY }}>
      <Navbar setView={setView} />
      <Hero setView={setView} />
      <Features />
      <WhyUs />
      <Pricing />
      <Footer />
    </div>
  );
}