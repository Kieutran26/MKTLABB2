/**
 * ============================================================
 *  OptiMKT — Trang Chủ (Homepage)
 *  Style: Modern SaaS với Editorial Minimalism
 * ============================================================
 *
 *  DEPENDENCIES:
 *    npm install framer-motion lucide-react
 *
 *  Font setup (index.css):
 *    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
 *
 *  CSS Variables (tailwind.config.js extend):
 *    colors: { brand: { DEFAULT: 'hsl(142,20%,38%)', light: 'hsl(142,30%,45%)' } }
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
} from 'lucide-react';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Cách hoạt động', href: '#how-it-works' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'Blog', href: '#' },
];

const FEATURES = [
  {
    icon: Target,
    label: 'Chiến lược & Nghiên cứu',
    desc: 'Phân tích thị trường, đối thủ cạnh tranh và lập chiến lược Marketing toàn diện với AI.',
    color: 'green',
  },
  {
    icon: Lightbulb,
    label: 'Tạo Nội dung AI',
    desc: 'Tạo ý tưởng, viết content, caption, blog post với sự hỗ trợ của trí tuệ nhân tạo.',
    color: 'amber',
  },
  {
    icon: Palette,
    label: 'Thiết kế & Visual',
    desc: 'Mockup, visual brief, hình ảnh thương hiệu và design system chuyên nghiệp.',
    color: 'purple',
  },
  {
    icon: Megaphone,
    label: 'Quảng cáo & Performance',
    desc: 'Tối ưu ngân sách, A/B testing và đo lường hiệu quả chiến dịch quảng cáo.',
    color: 'blue',
  },
  {
    icon: BarChart3,
    label: 'Analytics & Báo cáo',
    desc: 'Dashboard trực quan, theo dõi KPI và báo cáo tự động hàng tuần/tháng.',
    color: 'cyan',
  },
  {
    icon: Layers,
    label: 'Quản lý Workflow',
    desc: 'Sắp xếp project, lịch content và phân công công việc hiệu quả.',
    color: 'orange',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Kết nối dữ liệu',
    desc: 'Import dữ liệu thị trường, đối thủ và khách hàng mục tiêu của bạn.',
    icon: Globe,
  },
  {
    number: '02',
    title: 'AI phân tích & đề xuất',
    desc: 'Hệ thống AI phân tích và đưa ra chiến lược phù hợp nhất.',
    icon: Code2,
  },
  {
    number: '03',
    title: 'Tạo & xuất bản',
    desc: 'Tạo nội dung, thiết kế và lên lịch đăng chỉ với vài click.',
    icon: Sparkles,
  },
  {
    number: '04',
    title: 'Đo lường & tối ưu',
    desc: 'Theo dõi kết quả và AI tự động đề xuất cải tiến.',
    icon: BarChart3,
  },
];

const REASONS = [
  {
    icon: Zap,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    title: 'Tiết kiệm 70% thời gian',
    desc: 'Tự động hoá quy trình từ nghiên cứu đến tạo content, giúp bạn tập trung vào chiến lược.',
  },
  {
    icon: Shield,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
    title: 'An toàn & Bảo mật',
    desc: 'Dữ liệu được mã hoá, tuân thủ GDPR và backup tự động hàng ngày.',
  },
  {
    icon: Users,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    title: 'Team Collaboration',
    desc: 'Làm việc nhóm hiệu quả với workspace riêng và phân quyền rõ ràng.',
  },
  {
    icon: Clock,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ hỗ trợ chuyên nghiệp luôn sẵn sàng giải đáp mọi thắc mắc.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'OptiMKT đã giúp team của chúng tôi tiết kiệm hơn 15 giờ mỗi tuần. Việc lên ý tưởng và tạo content giờ chỉ cần vài phút.',
    author: 'Minh Anh',
    role: 'Marketing Director',
    company: 'TechViet Corp',
    avatar: 'MA',
    rating: 5,
  },
  {
    quote: 'Tính năng phân tích đối thủ cạnh tranh rất mạnh mẽ. Giờ tôi luôn nắm bắt được thị trường trước khi ra quyết định.',
    author: 'Hoàng Nam',
    role: 'CEO & Founder',
    company: 'StartupX',
    avatar: 'HN',
    rating: 5,
  },
  {
    quote: 'Dashboard analytics trực quan, dễ hiểu. Không cần kỹ năng kỹ thuật vẫn có thể đọc được báo cáo chi tiết.',
    author: 'Thu Hà',
    role: 'Content Lead',
    company: 'MediaHouse',
    avatar: 'TH',
    rating: 5,
  },
];

const PLANS = [
  {
    name: 'Miễn phí',
    price: '0đ',
    period: 'vĩnh viễn',
    desc: 'Dành cho cá nhân bắt đầu',
    features: [
      '5 credits AI mỗi tháng',
      '1 Project',
      'Template cơ bản',
      'Phân tích đối thủ cơ bản',
      'Community support',
    ],
    cta: 'Bắt đầu miễn phí',
    featured: false,
  },
  {
    name: 'Professional',
    price: '499.000đ',
    period: '/ tháng',
    desc: 'Dành cho Marketer chuyên nghiệp',
    features: [
      '100 credits AI mỗi tháng',
      'Không giới hạn Projects',
      'Toàn bộ template & AI tools',
      'Phân tích đối thủ nâng cao',
      'Analytics Dashboard',
      'Priority support',
      'Export & Sharing',
    ],
    cta: 'Dùng thử 14 ngày',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Liên hệ',
    period: '',
    desc: 'Dành cho doanh nghiệp lớn',
    features: [
      'Không giới hạn credits',
      'Custom workspace',
      'API Access',
      'SSO & White-label',
      'Dedicated Account Manager',
      'SLA 99.9%',
      'Onboarding & Training',
    ],
    cta: 'Liên hệ sales',
    featured: false,
  },
];

const FAQS = [
  {
    q: 'OptiMKT có miễn phí không?',
    a: 'Có, chúng tôi có gói Free vĩnh viễn với 5 credits AI mỗi tháng. Bạn có thể trải nghiệm các tính năng cơ bản trước khi quyết định nâng cấp.',
  },
  {
    q: 'Tôi cần có kỹ năng kỹ thuật để sử dụng không?',
    a: 'Không cần! OptiMKT được thiết kế cho người không có nền tảng kỹ thuật. Giao diện trực quan, các công cụ AI giúp bạn dễ dàng tạo content chuyên nghiệp.',
  },
  {
    q: 'Credits AI là gì và hoạt động như thế nào?',
    a: 'Credits là đơn vị sử dụng cho các tính năng AI như tạo content, phân tích dữ liệu. Mỗi lần sử dụng sẽ tiêu tốn 1-5 credits tuỳ độ phức tạp.',
  },
  {
    q: 'Tôi có thể hủy gói subscription không?',
    a: 'Có, bạn có thể hủy bất kỳ lúc nào mà không mất phí. Dữ liệu của bạn sẽ được lưu trữ trong 30 ngày sau khi hủy.',
  },
  {
    q: 'OptiMKT có hỗ trợ tiếng Việt không?',
    a: 'Có! Giao diện và đội ngũ hỗ trợ của chúng tôi hoàn toàn bằng tiếng Việt. Ngoài ra, AI còn hỗ trợ tạo content đa ngôn ngữ.',
  },
  {
    q: 'Dữ liệu của tôi có an toàn không?',
    a: 'Chúng tôi cam kết bảo mật dữ liệu với mã hoá AES-256, tuân thủ GDPR, backup tự động và không chia sẻ dữ liệu cho bên thứ ba.',
  },
];

const FOOTER_LINKS = {
  product: [
    { label: 'Tính năng', href: '#features' },
    { label: 'Bảng giá', href: '#pricing' },
    { label: 'Changelog', href: '#' },
    { label: 'Roadmap', href: '#' },
  ],
  company: [
    { label: 'Về chúng tôi', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Tuyển dụng', href: '#' },
    { label: 'Liên hệ', href: '#' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Templates', href: '#' },
    { label: 'Community', href: '#' },
  ],
  legal: [
    { label: 'Điều khoản sử dụng', href: '#' },
    { label: 'Chính sách bảo mật', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const STATS = [
  { value: '2,000+', label: 'Marketer tin dùng' },
  { value: '50,000+', label: 'Content được tạo' },
  { value: '70%', label: 'Tiết kiệm thời gian' },
  { value: '4.9/5', label: 'Đánh giá trung bình' },
];

/** Khi chạy trong OptiMKT SPA, điều hướng vào dashboard thay vì /register */
function onAppLink(e, setView) {
  if (setView) {
    e.preventDefault();
    setView('HOME_DASHBOARD');
  }
}

const STAT_VALUE_CLASS = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  purple: 'text-purple-600',
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

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
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href={setView ? '#' : '/'}
          onClick={(e) => onAppLink(e, setView)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[hsl(142,20%,38%)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-['Playfair_Display'] font-bold text-lg tracking-tight text-gray-900">
            OptiMKT
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={setView ? '#' : '/login'}
            onClick={(e) => onAppLink(e, setView)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Đăng nhập
          </a>
          <a
            href={setView ? '#' : '/register'}
            onClick={(e) => onAppLink(e, setView)}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Bắt đầu miễn phí
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-2.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="px-6 pb-4 flex flex-col gap-2">
              <a
                href={setView ? '#' : '/login'}
                onClick={(e) => onAppLink(e, setView)}
                className="w-full py-2.5 text-center border border-gray-200 rounded-full text-sm text-gray-700 cursor-pointer"
              >
                Đăng nhập
              </a>
              <a
                href={setView ? '#' : '/register'}
                onClick={(e) => onAppLink(e, setView)}
                className="w-full py-2.5 text-center rounded-full bg-gray-900 text-white text-sm font-medium cursor-pointer"
              >
                Bắt đầu miễn phí
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
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
              <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Content tạo', value: '1,234', color: 'green' },
                    { label: 'Views', value: '45.2K', color: 'blue' },
                    { label: 'Engagement', value: '8.5%', color: 'amber' },
                    { label: 'Leads', value: '523', color: 'purple' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                      <div className={`text-lg font-bold ${STAT_VALUE_CLASS[stat.color] || 'text-gray-900'}`}>
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-28 bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-700">Performance tuần này</span>
                      <span className="text-[10px] text-green-600 font-medium">+23%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-12">
                      {[40, 55, 45, 65, 58, 72, 80].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-[hsl(142,20%,38%)]/30 hover:bg-[hsl(142,20%,38%)]/50 transition-colors"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-28 bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-700">AI Content Suggestions</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="space-y-2">
                      {['Content hook mới', 'Caption viral', 'Blog outline'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,20%,38%)]" />
                          <div className="h-2 rounded bg-gray-100 flex-1" style={{ width: `${70 + i * 10}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
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

function Stats() {
  return (
    <section className="py-16 px-6 bg-gray-50/50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="text-center"
            >
              <div className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[hsl(142,20%,38%)]">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(142,20%,38%)] mb-3">
            Tính năng
          </p>
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-gray-900">
            Mọi thứ bạn cần để Marketing thành công
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Tích hợp tất cả công cụ Marketing vào một nền tảng duy nhất, giúp bạn làm việc nhanh hơn và hiệu quả hơn.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-[hsl(142,20%,38%)]/30 hover:shadow-lg hover:shadow-[hsl(142,20%,38%)]/5 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    feature.color === 'green'
                      ? 'bg-green-50 group-hover:bg-green-100'
                      : feature.color === 'amber'
                      ? 'bg-amber-50 group-hover:bg-amber-100'
                      : feature.color === 'purple'
                      ? 'bg-purple-50 group-hover:bg-purple-100'
                      : feature.color === 'blue'
                      ? 'bg-blue-50 group-hover:bg-blue-100'
                      : feature.color === 'cyan'
                      ? 'bg-cyan-50 group-hover:bg-cyan-100'
                      : 'bg-orange-50 group-hover:bg-orange-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      feature.color === 'green'
                        ? 'text-green-600'
                        : feature.color === 'amber'
                        ? 'text-amber-600'
                        : feature.color === 'purple'
                        ? 'text-purple-600'
                        : feature.color === 'blue'
                        ? 'text-blue-600'
                        : feature.color === 'cyan'
                        ? 'text-cyan-600'
                        : 'text-orange-600'
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-base mb-2 text-gray-900">{feature.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-gray-50/60">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(142,20%,38%)] mb-3">
            Quy trình
          </p>
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-gray-900">
            Cách OptiMKT hoạt động
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Chỉ 4 bước đơn giản để bắt đầu Marketing hiệu quả với AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="relative"
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-[hsl(142,20%,38%)]/30 to-transparent z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Icon className="w-8 h-8 text-[hsl(142,20%,38%)]" />
                  </div>
                  <div className="text-xs font-semibold text-[hsl(142,20%,38%)] mb-2 tracking-wider">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(142,20%,38%)] mb-3">
                Tại sao chọn
              </p>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight mb-6 text-gray-900">
                OptiMKT — Đối tác Marketing thông minh của bạn
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Chúng tôi hiểu rằng Marketing hiệu quả đòi hỏi sự kết hợp giữa chiến lược sáng tạo
                và công cụ tối ưu. OptiMKT ra đời để giúp bạn đạt được cả hai.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {REASONS.map((reason, i) => {
                const Icon = reason.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 * i }}
                    className="flex gap-4"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${reason.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${reason.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1 text-gray-900">{reason.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{reason.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right — Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <Quote className="w-8 h-8 text-[hsl(142,20%,38%)]/30 mb-4" />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 leading-relaxed mb-6">
                "OptiMKT đã thay đổi hoàn toàn cách chúng tôi làm Marketing. Từ việc phân tích đối
                thủ đến tạo content hàng loạt — tất cả chỉ trong một nền tảng, tiết kiệm hơn 60%
                thời gian mỗi tuần."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[hsl(142,20%,38%)]/10 flex items-center justify-center font-semibold text-sm text-[hsl(142,20%,38%)]">
                  NG
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">Ngọc Hân</div>
                  <div className="text-xs text-gray-500">Head of Marketing · TechViet</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-28 px-6 bg-gray-50/60">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(142,20%,38%)] mb-3">
            Đánh giá
          </p>
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Marketer nói gì về OptiMKT
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(TESTIMONIALS[active].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 leading-relaxed mb-6 text-lg">
                "{TESTIMONIALS[active].quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[hsl(142,20%,38%)]/10 flex items-center justify-center font-semibold text-sm text-[hsl(142,20%,38%)]">
                  {TESTIMONIALS[active].avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{TESTIMONIALS[active].author}</div>
                  <div className="text-sm text-gray-500">
                    {TESTIMONIALS[active].role} · {TESTIMONIALS[active].company}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  i === active ? 'bg-[hsl(142,20%,38%)] w-6' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing({ setView }) {
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  return (
    <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-white via-gray-50/30 to-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(142,20%,38%) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          {/* Label */}
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-[hsl(142,20%,38%)] mb-6">
            Investment
          </span>

          {/* Headline */}
          <h2 className="font-['Playfair_Display'] text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
            Simple, Transparent
            <br />
            <span className="italic text-[hsl(142,20%,38%)]">Pricing</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Chọn gói phù hợp với quy mô của bạn. Không có phí ẩn, không có bất ngờ.
          </p>

          {/* Toggle placeholder */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <span className="px-4 py-1.5 text-sm font-medium text-gray-900 bg-white rounded-full shadow-sm">Monthly</span>
            <span className="px-4 py-1.5 text-sm font-medium text-gray-500">Yearly <span className="text-[hsl(142,20%,38%)] font-semibold">-20%</span></span>
          </div>
        </motion.div>

        {/* Pricing Cards - Using flexbox for better alignment */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center items-stretch">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            onMouseEnter={() => setHoveredPlan(0)}
            onMouseLeave={() => setHoveredPlan(null)}
            className={`relative flex flex-col rounded-3xl p-8 bg-white border transition-all duration-500 hover:border-[hsl(142,20%,38%)]/30 hover:shadow-xl hover:shadow-gray-900/5 lg:w-72 ${hoveredPlan === 0 ? 'lg:scale-[1.02]' : ''}`}
          >
            {/* Plan header */}
            <div className="mb-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 text-gray-400">
                {PLANS[0].name}
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-['Playfair_Display'] text-5xl font-bold tracking-tight text-gray-900">
                  {PLANS[0].price}
                </span>
                <span className="text-sm text-gray-500">
                  {PLANS[0].period}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                {PLANS[0].desc}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px mb-8 bg-gray-100" />

            {/* Features */}
            <ul className="space-y-4 flex-1 mb-8">
              {PLANS[0].features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[hsl(142,20%,38%)]/10">
                    <Check size={12} className="text-[hsl(142,20%,38%)]" />
                  </div>
                  <span className="text-sm leading-relaxed text-gray-600">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={setView ? '#' : '/register'}
              onClick={(e) => onAppLink(e, setView)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl h-14 text-sm font-semibold transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20"
            >
              {PLANS[0].cta}
              <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* Featured Plan (Professional) */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex flex-col rounded-3xl p-8 lg:p-10 bg-[hsl(142,20%,38%)] text-white lg:-mt-4 lg:mb-4 shadow-2xl shadow-[hsl(142,20%,38%)]/20 lg:w-80"
          >
            {/* Featured badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-white text-[hsl(142,20%,38%)] shadow-lg">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
            </div>

            {/* Plan header */}
            <div className="mb-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 text-white/70">
                {PLANS[1].name}
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-['Playfair_Display'] text-5xl font-bold tracking-tight text-white">
                  {PLANS[1].price}
                </span>
                <span className="text-sm text-white/60">
                  {PLANS[1].period}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/80">
                {PLANS[1].desc}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px mb-8 bg-white/20" />

            {/* Features */}
            <ul className="space-y-4 flex-1 mb-8">
              {PLANS[1].features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/20">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm leading-relaxed text-white/90">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={setView ? '#' : '/register'}
              onClick={(e) => onAppLink(e, setView)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl h-14 text-sm font-semibold transition-all duration-300 bg-white text-[hsl(142,20%,38%)] hover:bg-white/90 hover:scale-[1.02]"
            >
              {PLANS[1].cta}
              <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onMouseEnter={() => setHoveredPlan(2)}
            onMouseLeave={() => setHoveredPlan(null)}
            className={`relative flex flex-col rounded-3xl p-8 bg-white border transition-all duration-500 hover:border-[hsl(142,20%,38%)]/30 hover:shadow-xl hover:shadow-gray-900/5 lg:w-72 ${hoveredPlan === 2 ? 'lg:scale-[1.02]' : ''}`}
          >
            {/* Plan header */}
            <div className="mb-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 text-gray-400">
                {PLANS[2].name}
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-['Playfair_Display'] text-5xl font-bold tracking-tight text-gray-900">
                  {PLANS[2].price}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                {PLANS[2].desc}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px mb-8 bg-gray-100" />

            {/* Features */}
            <ul className="space-y-4 flex-1 mb-8">
              {PLANS[2].features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[hsl(142,20%,38%)]/10">
                    <Check size={12} className="text-[hsl(142,20%,38%)]" />
                  </div>
                  <span className="text-sm leading-relaxed text-gray-600">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={setView ? '#' : '/register'}
              onClick={(e) => onAppLink(e, setView)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl h-14 text-sm font-semibold transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20"
            >
              {PLANS[2].cta}
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-400"
        >
          {[
            { icon: Shield, text: 'SSL Encrypted' },
            { icon: Clock, text: '14-day free trial' },
            { icon: Check, text: 'No credit card required' },
            { icon: Users, text: '2,000+ teams' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-medium">
              <item.icon size={14} className="text-[hsl(142,20%,38%)]" />
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* FAQ Link */}
        <p className="text-center mt-8 text-sm text-gray-500">
          Questions?{' '}
          <a href="#faq" className="text-[hsl(142,20%,38%)] font-medium hover:underline">
            Check our FAQ
          </a>
          {' '}or{' '}
          <a href="#" className="text-[hsl(142,20%,38%)] font-medium hover:underline">
            talk to sales
          </a>
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(142,20%,38%)] mb-3">
            FAQ
          </p>
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Câu hỏi thường gặp
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="border border-gray-100 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed bg-gray-50">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ setView }) {
  return (
    <section className="py-28 px-6 bg-gradient-to-br from-[hsl(142,20%,38%)] to-[hsl(142,30%,32%)]">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Sẵn sàng Transform Marketing của bạn?
          </h2>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Tham gia cùng 2,000+ marketer đang sử dụng OptiMKT để tiết kiệm thời gian và tạo
            content chất lượng cao.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={setView ? '#' : '/register'}
              onClick={(e) => onAppLink(e, setView)}
              className="inline-flex items-center gap-2 px-8 h-12 rounded-full text-sm font-medium bg-white text-[hsl(142,20%,38%)] hover:bg-white/90 transition-colors cursor-pointer"
            >
              Bắt đầu miễn phí ngay <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 h-12 rounded-full text-sm font-medium border border-white/30 text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Xem bảng giá
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-16 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Main footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-[hsl(142,20%,38%)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-['Playfair_Display'] font-bold text-lg text-gray-900">
                OptiMKT
              </span>
            </a>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-xs">
              Nền tảng Marketing AI-powered giúp marketer làm việc nhanh hơn và hiệu quả hơn.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[hsl(142,20%,38%)]/10 hover:text-[hsl(142,20%,38%)] transition-colors cursor-pointer"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[hsl(142,20%,38%)]/10 hover:text-[hsl(142,20%,38%)] transition-colors cursor-pointer"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[hsl(142,20%,38%)]/10 hover:text-[hsl(142,20%,38%)] transition-colors cursor-pointer"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[hsl(142,20%,38%)]/10 hover:text-[hsl(142,20%,38%)] transition-colors cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-4">Sản phẩm</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-4">Công ty</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-4">Hỗ trợ</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2024 OptiMKT. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.legal.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export default function HomePage({ setView }) {
  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] overflow-x-hidden">
      <Navbar setView={setView} />
      <Hero setView={setView} />
      <Stats />
      <Features />
      <HowItWorks />
      <WhyUs />
      <Testimonials />
      <Pricing setView={setView} />
      <FAQ />
      <CTA setView={setView} />
      <Footer />
    </div>
  );
}
