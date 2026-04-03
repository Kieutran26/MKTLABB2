import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, Loader2, History, ChevronRight, BarChart3, Diamond, Lock, Pencil, Save, Plus, Check } from 'lucide-react';
import { STPInput, STPResult } from '../types';
import { generateSTPAnalysis } from '../services/geminiService';
import { STPService, SavedSTP } from '../services/stpService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import { StpOptimizerField } from './stp-optimizer-field';
import { renderMarkdownBoldSegments } from '../utils/renderMarkdownBold';
import { parseStpStrategyBodyChunks } from '../utils/stpInsightChunks';
import { VIEW_TO_SLUG } from '../lib/route-mapping';
import './MastermindStrategyEditorial.css';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400 disabled:bg-stone-50 disabled:text-stone-500';
const textareaClass =
    'h-28 min-h-[7rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400';

const STP_DEFAULTS: STPInput = {
    productBrand: '',
    industry: '',
    productDescription: '',
    priceRange: '',
    targetMarket: '',
    competitorNames: '',
    currentCustomers: '',
    purchaseReason: '',
    nonPurchaseReason: '',
    stpGoal: '',
    uspStrength: '',
};

const FORM_TABS = [
    { id: 1 as const, line: 'Nhóm 1', sub: 'Thương hiệu & sản phẩm' },
    { id: 2 as const, line: 'Nhóm 2', sub: 'Dữ liệu khách hàng (nếu có)' },
    { id: 3 as const, line: 'Nhóm 3', sub: 'Cạnh tranh & mục tiêu' },
];

/** Tách ". Nhãn: " hoặc ") Nhãn: " — phổ biến trong output NHÂN KHẨU / TÂM LÝ */
const STP_SEGMENT_LABEL_SPLIT = /(?:\.\s+|\)\s+)(?=[^\s.:]{2,45}:\s)/;

function splitStpSegmentField(text: string): string[] {
    const t = (text ?? '').trim();
    if (!t) return [];
    if (t.includes('\n')) {
        return t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
    if (/[•·]/.test(t)) {
        return t.split(/\s*[•·]\s+/).map((s) => s.trim()).filter(Boolean);
    }
    const byLabel = t.split(STP_SEGMENT_LABEL_SPLIT).map((s) => s.trim()).filter(Boolean);
    if (byLabel.length > 1) return byLabel;
    const bySentence = t.split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
    if (bySentence.length > 1) return bySentence;
    return [t];
}

/** Nhân khẩu / Tâm lý: nhiều ý → từng dòng; màn rộng chia 2 cột */
const StpSegmentFieldLines: React.FC<{ text: string }> = ({ text }) => {
    const items = splitStpSegmentField(text);
    if (items.length <= 1) {
        return <div className="stp-seg-bt">{text}</div>;
    }
    return (
        <ul
            className={`stp-seg-bt-list${items.length >= 2 ? ' stp-seg-bt-list--grid' : ''}`}
            role="list"
        >
            {items.map((line, i) => (
                <li key={i} className="stp-seg-bt-item">
                    {line}
                </li>
            ))}
        </ul>
    );
};

/** Số thứ tự 1…3999 → chữ La Mã (tránh fallback số Ả Rập khi > IV). */
function integerToRoman(n: number): string {
    if (n < 1) return String(n);
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1] as const;
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'] as const;
    let num = n;
    let out = '';
    for (let i = 0; i < vals.length; i++) {
        while (num >= vals[i]) {
            out += syms[i];
            num -= vals[i];
        }
    }
    return out;
}

/** Insight / rủi ro: **bold** + tách đoạn; (Dẫn chứng: …) → cột phụ trên màn rộng */
const StpStrategyInsightBody: React.FC<{ text: string }> = ({ text }) => {
    const chunks = parseStpStrategyBodyChunks(text);
    if (chunks.length === 0) return null;

    const paragraphs = chunks.filter((c) => c.type === 'paragraph');
    const evidence = chunks.find((c) => c.type === 'evidence');
    const splitLayout = !!evidence;

    return (
        <div className={splitLayout ? 'stp-ins-body stp-ins-body--split' : 'stp-ins-body'}>
            <div className="stp-ins-body-main">
                {paragraphs.map((c, i) => (
                    <p key={i} className="stp-ins-body-p">
                        {renderMarkdownBoldSegments(c.content)}
                    </p>
                ))}
            </div>
            {evidence && (
                <div className="stp-ins-body-evidence" role="note">
                    <span className="stp-ins-ev-label">Dẫn chứng</span>
                    <div className="stp-ins-ev-text">{renderMarkdownBoldSegments(evidence.content)}</div>
                </div>
            )}
        </div>
    );
};

const STPModelGenerator: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [formTab, setFormTab] = useState<1 | 2 | 3>(1);
    const { register, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm<STPInput>({
        defaultValues: STP_DEFAULTS,
    });
    const [stpData, setStpData] = useState<STPResult | null>(null);
    const [currentInput, setCurrentInput] = useState<STPInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLongWait, setIsLongWait] = useState(false);
    const [savedItems, setSavedItems] = useState<SavedSTP[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Editorial styles for STP output
    const editorialStyles = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Prata&display=swap');
        
        .stp-editorial-wrapper * { box-sizing: border-box; margin: 0; padding: 0; }
        
        :root {
            --ink: #0f0f0d;
            --ink-2: #3a3935;
            --ink-3: #8a887f;
            --ink-4: #b8b6ae;
            --paper: #faf9f6;
            --paper-2: #f2f0eb;
            --paper-3: #e8e5de;
            --accent: #1a5c3a;
            --accent-w: #c17f2a;
            --accent-b: #1a3a5c;
            --rule: rgba(15,15,13,0.1);
            --serif: 'Prata', Georgia, serif;
            --sans: 'DM Sans', system-ui, sans-serif;
            /* Targeting card — nền mint nhạt giống thẻ editorial xanh (CH / roadmap) */
            --stp-tg-bg: #f0f7f4;
            --stp-tg-border: #b8d4c4;
            --stp-tg-title: var(--ink);
            --stp-tg-body: #3d5248;
            --stp-tg-label: #5c7568;
            --stp-tg-rule: rgba(30, 77, 52, 0.14);
        }
        
        .stp-editorial {
            background: var(--paper);
            font-family: var(--sans);
            color: var(--ink);
            width: 100%;
            max-width: none;
            margin: 0;
            /* Thụt hai bên ~50px tối đa; màn hẹp giảm dần, tối thiểu 16px */
            padding: 1rem max(16px, min(50px, 5vw)) 3rem;
            box-sizing: border-box;
        }
        
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stp-a { animation: fadeUp 0.5s ease both; opacity: 0; animation-fill-mode: both; }
        
        /* Header */
        .stp-doc-header {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: start;
            padding-bottom: 1.75rem;
            border-bottom: 1px solid var(--rule);
            margin-bottom: 2rem;
        }
        .stp-eyebrow {
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-3);
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
        .stp-doc-title {
            font-family: var(--serif);
            font-size: 28px;
            line-height: 1.2;
            font-weight: 400;
        }
        .stp-doc-title em {
            font-style: italic;
            color: var(--accent);
        }
        .stp-doc-tags { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
        .stp-tag { font-size: 10px; padding: 3px 10px; border-radius: 2px; font-weight: 500; letter-spacing: 0.05em; }
        .stp-tag-g { background: var(--accent); color: #fff; }
        .stp-tag-w { background: var(--accent-w); color: #fff; }
        .stp-tag-b { background: var(--accent-b); color: #fff; }
        
        /* Section Head */
        .stp-sh { display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem; padding-bottom: 0.625rem; border-bottom: 1px solid var(--rule); }
        .stp-sh-dot { width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0; }
        .stp-sh-g { background: var(--accent); }
        .stp-sh-w { background: var(--accent-w); }
        .stp-sh-b { background: var(--accent-b); }
        .stp-sh-r { background: #8a1a1a; }
        .stp-sh-title {
            font-size: 10px;
            letter-spacing: 0.13em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
        }
        
        /* Segmentation */
        .stp-seg-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border: 1px solid var(--rule);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 2rem;
        }
        .stp-seg-col { padding: 1.25rem 1.1rem; border-right: 1px solid var(--rule); }
        .stp-seg-col:last-child { border-right: none; }
        .stp-seg-num { font-family: var(--serif); font-size: 32px; color: var(--paper-3); line-height: 1; margin-bottom: 0.5rem; }
        .stp-seg-name {
            font-family: var(--serif);
            font-size: 15px;
            font-weight: 700;
            color: var(--ink);
            line-height: 1.3;
            margin-bottom: 0.875rem;
            letter-spacing: -0.01em;
        }
        .stp-seg-block { margin-bottom: 0.75rem; }
        .stp-seg-bl {
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 0.25rem;
        }
        .stp-seg-bt { font-size: 11.5px; color: var(--ink-2); line-height: 1.65; }
        .stp-seg-bt-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
        }
        .stp-seg-bt-list--grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }
        @media (min-width: 900px) {
            .stp-seg-bt-list--grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        .stp-seg-bt-item {
            font-size: 11.5px;
            color: var(--ink-2);
            line-height: 1.65;
            margin: 0;
            padding-left: 0.55rem;
            border-left: 2px solid rgba(26, 92, 58, 0.35);
        }
        .stp-seg-barrier { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--rule); }
        .stp-seg-bar-label { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a1a1a; font-weight: 500; margin-bottom: 0.25rem; }
        .stp-seg-bar-item {
            font-size: 11px;
            color: var(--ink-2);
            line-height: 1.6;
            display: flex;
            gap: 8px;
            align-items: flex-start;
            margin-bottom: 4px;
        }
        .stp-seg-bar-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #c13a2a;
            flex-shrink: 0;
            margin-top: 0.48em;
        }
        
        /* Targeting — card mint / viền xanh (không còn nền đen) */
        .stp-target-block {
            background: var(--stp-tg-bg);
            border: 1px solid var(--stp-tg-border);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .stp-tg-eyebrow {
            font-size: 9px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 0.75rem;
        }
        .stp-tg-name { font-family: var(--serif); font-size: 19px; color: var(--stp-tg-title); margin-bottom: 0.75rem; font-weight: 400; }
        .stp-tg-body { font-size: 11px; color: var(--stp-tg-body); line-height: 1.75; margin-bottom: 1.1rem; }
        .stp-tg-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; border-top: 1px solid var(--stp-tg-rule); padding-top: 1.1rem; margin-bottom: 1.1rem; }
        .stp-tg-met { padding-right: 1.25rem; border-right: 1px solid var(--stp-tg-rule); }
        .stp-tg-met:last-child { border-right: none; padding-right: 0; padding-left: 1.25rem; }
        .stp-tg-met:nth-child(2) { padding: 0 1.25rem; }
        .stp-tg-met-val { font-family: var(--serif); font-size: 21px; color: var(--stp-tg-title); line-height: 1.15; }
        /* Cột 3 thường là đoạn văn dài — không dùng display số lớn */
        .stp-tg-met:last-child .stp-tg-met-val {
            font-family: var(--sans);
            font-size: 12.5px;
            font-weight: 400;
            line-height: 1.65;
        }
        .stp-tg-met-label {
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
            margin-top: 6px;
        }
        .stp-tg-secondary { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--stp-tg-rule); padding-top: 1rem; }
        .stp-tg-sec-label {
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 0.35rem;
        }
        .stp-tg-sec-text { font-size: 11px; color: var(--stp-tg-body); line-height: 1.6; }
        .stp-tg-avoid { border-top: 1px solid var(--stp-tg-rule); padding-top: 1rem; margin-top: 1rem; }
        .stp-tg-avoid-label {
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 700;
            color: #8a1a1a;
            margin-bottom: 0.35rem;
        }
        .stp-tg-avoid-text { font-size: 11px; color: #5c534d; line-height: 1.6; }
        
        /* Positioning — khối trích dẫn: nền xanh nhạt + viền xanh */
        .stp-pos-statement {
            padding: 1.75rem 2rem;
            border: 1px solid #A7C0E0;
            border-radius: 0;
            margin-bottom: 1.25rem;
            position: relative;
            background: #E8F0FE;
        }
        .stp-pos-statement::before {
            content: '"';
            font-family: var(--serif);
            font-size: 64px;
            color: #7FA3D4;
            opacity: 0.35;
            position: absolute;
            top: -6px;
            left: 14px;
            line-height: 1;
        }
        .stp-pos-text {
            font-family: var(--serif);
            font-size: 17px;
            line-height: 1.55;
            color: #0f2847;
            font-style: italic;
            padding-left: 0.5rem;
        }
        .stp-pos-text strong { font-style: normal; color: #1a3a7a; }
        .stp-pos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.25rem; }
        .stp-pos-card { border: 1px solid var(--rule); border-radius: 3px; padding: 1.1rem; background: #fff; }
        .stp-pos-card-label {
            font-size: 9px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 0.75rem;
        }
        
        /* Perceptual Map */
        .stp-map-wrap { position: relative; width: 100%; aspect-ratio: 1.6; border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; background: #fff; }
        .stp-map-axis-x { position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--rule); }
        .stp-map-axis-y { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--rule); }
        .stp-map-label { position: absolute; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); font-weight: 500; }
        .stp-map-label.lx1 { bottom: calc(50% + 8px); left: 8px; }
        .stp-map-label.lx2 { bottom: calc(50% + 8px); right: 8px; }
        .stp-map-label.ly1 { top: 8px; left: 50%; transform: translateX(-50%); }
        .stp-map-label.ly2 { bottom: 8px; left: 50%; transform: translateX(-50%); }
        .stp-map-dot { position: absolute; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .stp-map-circle { width: 12px; height: 12px; border-radius: 50%; }
        .stp-map-dot-label { font-size: 10px; font-weight: 500; white-space: nowrap; background: var(--paper); padding: 1px 5px; border-radius: 2px; border: 0.5px solid var(--rule); }
        .stp-map-us .stp-map-circle { background: var(--accent); box-shadow: 0 0 0 3px rgba(26,92,58,0.15); }
        .stp-map-us .stp-map-dot-label { color: var(--accent); }
        .stp-map-them1 .stp-map-circle { background: var(--ink-3); }
        .stp-map-them1 .stp-map-dot-label { color: var(--ink-3); }
        .stp-map-them2 .stp-map-circle { background: var(--accent-b); }
        .stp-map-them2 .stp-map-dot-label { color: var(--accent-b); }
        .stp-map-gap { position: absolute; transform: translate(-50%,-50%); width: 48px; height: 48px; border-radius: 50%; border: 1px dashed var(--accent-w); display: flex; align-items: center; justify-content: center; }
        .stp-map-gap-label { font-size: 9px; color: var(--accent-w); text-align: center; letter-spacing: 0.04em; line-height: 1.3; }
        
        /* Messages */
        .stp-msg-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; background: #fff; }
        .stp-msg-col { padding: 1.1rem; border-right: 1px solid var(--rule); }
        .stp-msg-col:last-child { border-right: none; }
        .stp-msg-ch { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3); font-weight: 500; margin-bottom: 0.375rem; }
        .stp-msg-text { font-family: var(--serif); font-size: 13px; color: var(--ink); line-height: 1.5; font-style: italic; margin-bottom: 0.5rem; }
        .stp-msg-text strong { font-style: normal; color: var(--accent); font-weight: 600; }
        .stp-msg-note { font-size: 11px; color: var(--ink-3); line-height: 1.6; }
        
        /* Insights */
        .stp-ins-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.25rem; }
        .stp-ins-card { border: 1px solid var(--rule); border-radius: 3px; padding: 1.1rem; background: #fff; }
        .stp-ins-num { font-family: var(--serif); font-size: 13px; color: var(--ink-4); margin-bottom: 0.375rem; }
        .stp-ins-title { font-size: 11px; font-weight: 500; color: var(--ink); margin-bottom: 0.375rem; letter-spacing: 0.02em; }
        .stp-ins-body { font-size: 12px; color: var(--ink-2); line-height: 1.7; }
        .stp-ins-body strong { color: var(--accent); font-weight: 600; }
        .stp-ins-body-p { margin: 0 0 0.5rem; }
        .stp-ins-body-p:last-child { margin-bottom: 0; }
        .stp-ins-body--split {
            display: grid;
            gap: 0.65rem;
        }
        @media (min-width: 640px) {
            .stp-ins-body--split {
                grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
                align-items: start;
            }
            .stp-ins-body--split .stp-ins-body-evidence {
                border-top: none;
                border-left: 1px solid var(--rule);
                padding-top: 0;
                padding-left: 0.65rem;
                margin-left: 0;
            }
        }
        .stp-ins-body-evidence {
            border-top: 1px solid var(--rule);
            padding-top: 0.55rem;
            margin-top: 0.1rem;
            font-size: 11px;
            color: var(--ink-3);
            line-height: 1.65;
        }
        .stp-ins-ev-label {
            display: block;
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 600;
            color: var(--ink-4);
            margin-bottom: 0.3rem;
        }
        .stp-ins-ev-text strong { color: var(--accent); font-weight: 600; }
        .stp-ins-risk { border-left: 2px solid #c13a2a; padding-left: 0.75rem; }
        .stp-ins-risk .stp-ins-title { color: #8a1a1a; }
        
        /* Footer — nền mint nhạt đồng bộ thẻ Targeting */
        .stp-footer-bar {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border: 1px solid var(--stp-tg-border);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 2rem;
            background: var(--stp-tg-bg);
        }
        .stp-fb-col { padding: 0.875rem 1.25rem; border-right: 1px solid var(--stp-tg-rule); text-align: center; }
        .stp-fb-col:last-child { border-right: none; }
        .stp-fb-val { font-family: var(--serif); font-size: 20px; color: var(--ink); display: block; }
        .stp-fb-label {
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--accent);
            margin-top: 3px;
        }
        
        /* Map legend */
        .stp-map-legend { display: flex; gap: 12px; margin-top: 0.625rem; flex-wrap: wrap; }
        .stp-map-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--ink-3); }
        .stp-map-legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* ── CMO ADVICE ──────────────────────────────────────────── */
        .stp-cmo-wrap { border-top: 2px solid var(--ink); padding-top: 1.75rem; margin-top: 1.75rem; }
        .stp-cmo-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5rem; }
        .stp-cmo-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-3); font-weight: 500; }
        .stp-cmo-sig { font-family: var(--serif); font-size: 14px; color: var(--ink-3); font-style: italic; }

        /* 4 advice cards */
        .stp-cmo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.25rem; }
        .stp-adv-card { border: 1px solid var(--rule); border-radius: 3px; padding: 1.1rem 1.25rem; }
        .stp-adv-card.priority { border-color: var(--accent); background: rgba(26, 92, 58, 0.03); }
        .stp-adv-card.pitfall { border-left: 3px solid #8a1a1a; border-radius: 0 3px 3px 0; }
        .stp-adv-card.opp { border-left: 3px solid var(--accent-w); border-radius: 0 3px 3px 0; }
        .stp-adv-card.one { background: var(--paper-2); }
        .stp-adv-num { font-family: var(--serif); font-size: 13px; color: var(--ink-4); margin-bottom: 0.375rem; }
        .stp-adv-title { font-size: 12px; font-weight: 500; color: var(--ink); margin-bottom: 0.5rem; letter-spacing: 0.02em; line-height: 1.4; }
        .stp-adv-title.green { color: var(--accent); }
        .stp-adv-title.red { color: #8a1a1a; }
        .stp-adv-title.warm { color: var(--accent-w); }
        .stp-adv-body { font-size: 12px; color: var(--ink-2); line-height: 1.75; }
        .stp-adv-tag { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 2px; margin-top: 0.625rem; font-weight: 500; }
        .stp-tag-do { background: rgba(26, 92, 58, 0.1); color: var(--accent); }
        .stp-tag-dont { background: rgba(138, 26, 26, 0.1); color: #8a1a1a; }
        .stp-tag-now { background: rgba(193, 127, 42, 0.12); color: var(--accent-w); }

        /* Action 30-60-90 strip */
        .stp-cmo-action { border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; margin-bottom: 1.25rem; }
        .stp-cmo-act-head { display: grid; grid-template-columns: repeat(3, 1fr); background: var(--paper-2); border-bottom: 1px solid var(--rule); }
        .stp-cmo-act-col-hd { padding: 0.625rem 1rem; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); font-weight: 500; border-right: 1px solid var(--rule); }
        .stp-cmo-act-col-hd:last-child { border-right: none; }
        .stp-cmo-act-rows { display: grid; grid-template-columns: repeat(3, 1fr); }
        .stp-cmo-act-col { padding: 1rem; border-right: 1px solid var(--rule); }
        .stp-cmo-act-col:last-child { border-right: none; }
        .stp-cmo-act-item { display: flex; gap: 8px; margin-bottom: 8px; font-size: 12px; color: var(--ink-2); line-height: 1.5; align-items: baseline; }
        .stp-cmo-act-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; position: relative; top: 4px; }
        .stp-dot-now { background: #8a1a1a; }
        .stp-dot-soon { background: var(--accent-w); }
        .stp-dot-later { background: var(--accent); }
        .stp-cmo-act-note { font-size: 11px; color: var(--ink-3); margin-top: 0.375rem; font-style: italic; }

        /* One thing highlight */
        .stp-cmo-one { padding: 1.5rem 1.75rem; border: 1px solid var(--rule); border-radius: 3px; margin-bottom: 1.25rem; background: var(--paper-2); display: flex; gap: 1.5rem; align-items: flex-start; }
        .stp-cmo-one-star { font-family: var(--serif); font-size: 48px; color: var(--paper-3); line-height: 1; flex-shrink: 0; }
        .stp-cmo-one-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-3); font-weight: 500; margin-bottom: 0.5rem; }
        .stp-cmo-one-text { font-family: var(--serif); font-size: 16px; line-height: 1.5; color: var(--ink); font-style: italic; }
        .stp-cmo-one-sub { font-size: 12px; color: var(--ink-3); margin-top: 0.625rem; line-height: 1.65; }

        /* Unknown block */
        .stp-cmo-unknown { border-top: 1px dashed var(--rule); padding-top: 1.25rem; margin-top: 1.25rem; }
        .stp-cmo-unknown-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4); font-weight: 500; margin-bottom: 0.75rem; }
        .stp-cmo-unknown-item { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; color: var(--ink-3); line-height: 1.6; align-items: baseline; }
        .stp-cmo-unknown-dash { flex-shrink: 0; color: var(--ink-4); }

        /* Final quote */
        .stp-cmo-quote { font-family: var(--serif); font-size: 15px; color: var(--ink); line-height: 1.55; font-style: italic; padding: 1.1rem 1.5rem; background: var(--paper); border-radius: 3px; border-left: 2px solid var(--ink); }
    `;

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        loadHistory();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setValue('productBrand', currentBrand.identity.name || '');
            const { mission, vision, toneOfVoice, targetObjectives } = currentBrand.strategy;
            const descParts = [
                mission && `Sứ mệnh: ${mission}`,
                vision && `Tầm nhìn: ${vision}`,
                toneOfVoice && `Giọng điệu: ${toneOfVoice}`,
                targetObjectives?.length ? `Mục tiêu: ${targetObjectives.join(' · ')}` : '',
            ].filter(Boolean);
            setValue('productDescription', descParts.join('\n\n'));
            setValue('industry', '');
        }
    }, [activeTab, currentBrand, setValue]);

    const loadHistory = async () => {
        const items = await STPService.getSTPHistory();
        setSavedItems(items);
    };

    const mergeInput = (data: STPInput): STPInput => ({
        ...STP_DEFAULTS,
        ...data,
    });

    const onSubmit = async (data: STPInput) => {
        const merged = mergeInput(data);
        setIsGenerating(true);
        setStpData(null);
        setCurrentInput(merged);
        setIsLongWait(false);

        // Sau 15s mà vẫn đang generating → báo user đợi thêm
        const waitTimer = setTimeout(() => {
            setIsLongWait(true);
        }, 15000);

        try {
            const context =
                activeTab === 'vault' && currentBrand
                    ? `BRAND: ${currentBrand.identity.name}, VISION: ${currentBrand.strategy.vision}. `
                    : '';
            const result = await generateSTPAnalysis({
                ...merged,
                productBrand: context + merged.productBrand,
            });
            if (!result) {
                toast.error('Không nhận được kết quả. Kiểm tra GEMINI_API_KEY và kết nối mạng, rồi thử lại.');
                return;
            }
            if (result.validationStatus === 'FAIL') {
                toast.error(
                    result.clarificationMessage ||
                        'Dữ liệu đầu vào chưa đủ chi tiết. Hãy bổ sung mô tả cụ thể (sản phẩm, khách hàng, ngành) rồi phân tích lại.'
                );
                setStpData(null);
                return;
            }
            setStpData(result);
            setActiveHistoryId(null);
            if (result.validationStatus === 'WARNING' && result.clarificationMessage) {
                toast.success(`Phân tích hoàn tất. Lưu ý: ${result.clarificationMessage}`);
            } else {
                toast.success('Phân tích STP hoàn tất!');
            }
        } catch {
            toast.error('Phân tích thất bại');
        } finally {
            clearTimeout(waitTimer);
            setIsGenerating(false);
            setIsLongWait(false);
        }
    };

    const openHistoryItem = (m: SavedSTP) => {
        setStpData(m.data);
        setCurrentInput(m.input);
        setActiveHistoryId(m.id);
        reset(mergeInput(m.input));
        setShowHistory(false);
        setFormTab(1);
    };

    const handleSaveStp = async () => {
        if (!stpData) return;
        setIsSaving(true);
        try {
            const id = activeHistoryId ?? crypto.randomUUID();
            const inputPayload = mergeInput(getValues());
            await STPService.saveSTP({
                id,
                input: inputPayload,
                data: stpData,
                timestamp: Date.now(),
            });
            setCurrentInput(inputPayload);
            setActiveHistoryId(id);
            await loadHistory();
            toast.success('Đã lưu vào lịch sử');
        } catch {
            toast.error('Lưu thất bại');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="bottom-right" />
            <FeatureHeader
                icon={Layers}
                eyebrow="PRECISION MARKET SEGMENTATION"
                title="STP Optimizer"
                subline="Phân lớp thị trường, xác định mục tiêu và tọa độ định vị."
                className="px-3 sm:px-4 lg:px-5"
            >
                <div className="mr-2 flex shrink-0 items-center justify-end gap-2">
                    <div className="inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setActiveTab('manual')}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Pencil size={14} className="inline" /> Thủ công
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('vault')}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Diamond
                                size={14}
                                className={profile?.subscription_tier === 'promax' ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}
                            />
                            Brand Vault
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                        aria-pressed={showHistory}
                        aria-label="Lịch sử"
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                    {stpData && (
                        <button
                            type="button"
                            onClick={handleSaveStp}
                            disabled={isSaving}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                            aria-label="Lưu vào lịch sử"
                            title="Lưu vào lịch sử"
                        >
                            {isSaving ? (
                                <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                            ) : (
                                <Save size={18} strokeWidth={2} />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate(VIEW_TO_SLUG.STP_MODEL)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.98]"
                    >
                        <Plus size={18} strokeWidth={2} />
                        Tạo kế hoạch
                    </button>
                </div>
            </FeatureHeader>

            <div
                className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${
                    stpData
                        ? showHistory
                            ? 'max-xl:grid-rows-[auto_minmax(0,1fr)] xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]'
                            : 'grid-cols-1 grid-rows-[minmax(0,1fr)]'
                        : showHistory
                          ? 'xl:grid-cols-[minmax(0,260px)_1fr]'
                          : 'grid-cols-1 items-start'
                }`}
            >
                {showHistory && (
                    <aside
                        className={`${cardClass} order-1 max-h-[36vh] min-h-0 space-y-3 overflow-y-auto bg-stone-50/30 p-3 sm:p-4 xl:max-h-none xl:pl-3 xl:pr-2 ${stpData ? 'xl:min-h-0 xl:h-full' : ''}`}
                    >
                        <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Lịch sử</h3>
                        {savedItems.length === 0 && (
                            <p className="px-2 text-xs text-stone-500">Chưa có bản phân tích đã lưu.</p>
                        )}
                        {savedItems.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => openHistoryItem(m)}
                                className="w-full cursor-pointer rounded-xl border border-stone-100 bg-white p-4 text-left transition-all hover:border-stone-300"
                            >
                                <div className="truncate text-sm font-medium text-stone-900">{m.input.productBrand}</div>
                                <div className="mt-2 text-[10px] text-stone-400">
                                    {m.input.industry} · {new Date(m.timestamp).toLocaleDateString('vi-VN')}
                                </div>
                            </button>
                        ))}
                    </aside>
                )}

                {!stpData && (
                <div className="order-2 mx-auto h-fit w-full max-w-[1182px]">
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="ms-editorial-wrapper" style={{ padding: 0 }}>
                            <div className="ms-vault-card">
                                <div className="ms-vault-content">
                                    <div className="ms-vault-upper">
                                        <div className="ms-vault-label">
                                            <Diamond size={11} strokeWidth={2.25} className="ms-vault-label-diamond" aria-hidden />
                                            Brand Vault Access
                                        </div>
                                        <h3 className="ms-vault-title">Tính năng Brand Vault</h3>
                                        <p className="ms-vault-desc">
                                            Phân tích STP trở nên chính xác và nhất quán hơn khi AI học DNA thương hiệu từ Vault của bạn.
                                        </p>
                                    </div>

                                    <div className="ms-vault-benefits">
                                        {[
                                            'Phân khúc – targeting – định vị bám sát sứ mệnh, tầm nhìn và giá trị cốt lõi trong Vault',
                                            'Giảm suy đoán: AI đọc Brand Voice và bối cảnh chiến lược đã lưu thay vì chỉ từ khóa chung',
                                            'Tự điền mô tả thương hiệu từ Vault — nhập liệu nhanh, kết quả STP đồng bộ DNA',
                                            'Kết quả sẵn sàng làm nền cho quyết định phân khúc và thông điệp theo đúng bản sắc bạn',
                                        ].map((benefit, bIdx) => (
                                            <div key={bIdx} className="ms-vault-benefit-item">
                                                <div className="ms-vault-benefit-icon">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                                <span>{benefit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button type="button" className="ms-vault-cta">
                                        Nâng cấp Pro Max <ChevronRight size={18} />
                                    </button>
                                </div>
                                <div className="ms-vault-visual">
                                    <div className="ms-vault-dna">
                                        {[40, 70, 45, 90, 60, 80, 50, 75, 40, 65].map((h, i) => (
                                            <div
                                                key={i}
                                                className="ms-vault-dna-bar"
                                                style={{ height: `${h}px`, opacity: 0.1 + (i % 3) * 0.1 }}
                                            />
                                        ))}
                                    </div>
                                    <div className="ms-vault-lock-circle">
                                        <div className="ms-vault-lock-icon">
                                            <Lock size={32} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div className="ms-vault-corner ms-vault-corner-tl" />
                                    <div className="ms-vault-corner ms-vault-corner-br" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className={`${cardClass} flex min-h-[360px] flex-col overflow-hidden`}
                        >
                            {activeTab === 'vault' && profile?.subscription_tier === 'promax' && (
                                <div className="border-b border-stone-200 bg-stone-50/50 px-5 py-4">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Nguồn Brand Vault</p>
                                    <BrandSelector />
                                </div>
                            )}

                            <div className="flex shrink-0 border-b border-stone-200 bg-stone-50/50">
                                {FORM_TABS.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setFormTab(t.id)}
                                        className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center transition-colors ${formTab === t.id ? 'border-b-2 border-stone-900 text-stone-900' : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t.line}</span>
                                        <span className="hidden text-[9px] font-medium leading-tight text-stone-500 sm:block">{t.sub}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
                                {formTab === 1 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-300">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900">
                                                    1
                                                </div>
                                                <h2 className="text-base font-medium tracking-tight text-stone-900">Thương hiệu &amp; sản phẩm</h2>
                                            </div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:pt-1">Bắt buộc · 5 trường</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                        <StpOptimizerField
                                            title="Tên thương hiệu / Sản phẩm"
                                            badge="required"
                                            subtitle="Tên cụ thể sẽ được phân tích STP"
                                            example="VD: VinFast VF8 · Highlands Coffee · App Momo"
                                            hintExtra="Nhập đúng tên thương hiệu hoặc sản phẩm để AI map ngữ cảnh."
                                        >
                                            <input
                                                {...register('productBrand', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Tên thương hiệu hoặc sản phẩm"
                                            />
                                            {errors.productBrand && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.productBrand.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Ngành hàng"
                                            badge="required"
                                            subtitle="Lĩnh vực kinh doanh cụ thể — ảnh hưởng đến cách AI phân khúc thị trường"
                                            example="VD: Xe điện · F&B · Fintech · FMCG · Làm đẹp"
                                        >
                                            <input
                                                {...register('industry', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Ngành / vertical"
                                            />
                                            {errors.industry && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.industry.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Mô tả sản phẩm / dịch vụ"
                                            badge="required"
                                            fullWidth
                                            subtitle="AI cần hiểu sản phẩm làm gì, giải quyết vấn đề gì để phân khúc đúng"
                                            guideline="Tính năng chính, lợi ích cốt lõi, điểm khác biệt so với sản phẩm thông thường"
                                            example='VD: "Xe điện 7 chỗ, phạm vi 400km/sạc, màn hình 15 inch, giá 1.2 tỷ, sản xuất tại Việt Nam"'
                                        >
                                            <textarea
                                                {...register('productDescription', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Mô tả chi tiết…"
                                            />
                                            {errors.productDescription && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.productDescription.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Khoảng giá bán"
                                            badge="required"
                                            subtitle="Giá quyết định phân khúc thu nhập — không có giá thì không thể xác định target"
                                            guideline="Giá cụ thể hoặc khoảng giá. Nếu có nhiều tier thì liệt kê hết"
                                            example="VD: 500M-700M · 45,000đ/ly · 99,000đ/tháng"
                                        >
                                            <input
                                                {...register('priceRange', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Khoảng giá hoặc bảng giá ngắn"
                                            />
                                            {errors.priceRange && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.priceRange.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Thị trường địa lý"
                                            badge="required"
                                            subtitle="Hành vi tiêu dùng khác nhau hoàn toàn giữa Hà Nội, TP.HCM, tỉnh thành"
                                            guideline="Khu vực đang hoặc sẽ kinh doanh"
                                            example="VD: TP.HCM · Toàn quốc · Hà Nội + TP.HCM · Đông Nam Á"
                                        >
                                            <input
                                                {...register('targetMarket', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Địa bàn / quốc gia / vùng"
                                            />
                                            {errors.targetMarket && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.targetMarket.message}</p>
                                            )}
                                        </StpOptimizerField>
                                        </div>
                                    </div>
                                )}

                                {formTab === 2 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-300">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900">
                                                    2
                                                </div>
                                                <h2 className="text-base font-medium tracking-tight text-stone-900">Dữ liệu khách hàng</h2>
                                            </div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:pt-1">Quan trọng · 3 trường</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                        <StpOptimizerField
                                            title="Mô tả khách hàng đang mua"
                                            badge="important"
                                            fullWidth
                                            subtitle="Đây là dữ liệu thực nhất — AI sẽ ưu tiên phân tích từ đây thay vì giả định"
                                            guideline="Ai đang thực sự bỏ tiền mua? Độ tuổi, giới tính, nghề nghiệp, thu nhập, hành vi"
                                            example='VD: "Chủ yếu nam 30–45 tuổi, kỹ sư IT hoặc kinh doanh, thu nhập 30–60tr, sống TP.HCM, quan tâm công nghệ và môi trường"'
                                        >
                                            <textarea
                                                {...register('currentCustomers')}
                                                className={textareaClass}
                                                placeholder="Nếu chưa có dữ liệu, có thể để trống"
                                            />
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Lý do khách mua"
                                            badge="important"
                                            subtitle="Lý do mua = insight phân khúc — AI không được tự suy diễn nếu không có dữ liệu này"
                                            guideline="Khách hàng nói lý do gì khi mua? Feedback, review, survey nếu có"
                                            example='VD: "Tiết kiệm xăng · Thích công nghệ · Muốn thể hiện đẳng cấp · Vì môi trường"'
                                        >
                                            <textarea
                                                {...register('purchaseReason')}
                                                className={textareaClass}
                                                placeholder="Ghi nhận từ khách / đội sales / khảo sát"
                                            />
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Lý do khách KHÔNG mua"
                                            badge="important"
                                            subtitle="Rào cản = ranh giới phân khúc — biết ai không mua thì mới biết ai sẽ mua"
                                            guideline="Phản hồi tiêu cực, lý do từ chối, lo ngại phổ biến"
                                            example='VD: "Sợ hết pin · Không tin thương hiệu Việt · Giá quá cao · Thiếu trạm sạc"'
                                        >
                                            <textarea
                                                {...register('nonPurchaseReason')}
                                                className={textareaClass}
                                                placeholder="Objection / concern thường gặp"
                                            />
                                        </StpOptimizerField>
                                        </div>
                                    </div>
                                )}

                                {formTab === 3 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-300">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900">
                                                    3
                                                </div>
                                                <h2 className="text-base font-medium tracking-tight text-stone-900">Cạnh tranh &amp; mục tiêu</h2>
                                            </div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:pt-1">Bắt buộc · 3 trường</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                        <StpOptimizerField
                                            title="Đối thủ trực tiếp"
                                            badge="required"
                                            subtitle="Không biết đối thủ đang chiếm phân khúc nào thì không thể định vị được"
                                            guideline="Top 2–3 đối thủ và phân khúc họ đang nhắm"
                                            example='VD: "Toyota Corolla Cross (gia đình trung lưu) · Tesla Model Y (công nghệ cao cấp)"'
                                        >
                                            <textarea
                                                {...register('competitorNames', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Liệt kê đối thủ + gợi ý phân khúc họ"
                                            />
                                            {errors.competitorNames && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.competitorNames.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Mục tiêu STP của bạn"
                                            badge="required"
                                            subtitle="AI cần biết bạn muốn dùng STP để làm gì — chiến lược khác nhau tùy mục tiêu"
                                            guideline="Mở rộng phân khúc mới · Tập trung phân khúc hiện tại · Ra mắt sản phẩm mới · Repositioning"
                                            example='VD: "Muốn tìm phân khúc mới chưa khai thác" · "Muốn đánh sâu hơn vào phân khúc hiện tại"'
                                        >
                                            <textarea
                                                {...register('stpGoal', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Mục tiêu ngắn gọn"
                                            />
                                            {errors.stpGoal && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.stpGoal.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="USP / Điểm mạnh thực sự"
                                            badge="required"
                                            fullWidth
                                            subtitle="Positioning phải dựa trên điểm mạnh CÓ THẬT — không phải điều bạn muốn mà là điều bạn thực sự có"
                                            guideline="Điều bạn làm tốt hơn đối thủ một cách khách quan — có thể chứng minh được"
                                            example='VD: "Pin 400km thật sự (không phải quảng cáo) · Dịch vụ sau bán hàng 24/7 · Giá thấp hơn Tesla 40% với tính năng tương đương"'
                                        >
                                            <textarea
                                                {...register('uspStrength', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Chỉ nêu điểm có bằng chứng / có thể verify"
                                            />
                                            {errors.uspStrength && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.uspStrength.message}</p>
                                            )}
                                        </StpOptimizerField>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4 md:px-6">
                                <div className="flex min-w-0 flex-1 items-center gap-4 text-[11px] text-stone-500">
                                    {formTab > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormTab((t) => (t > 1 ? ((t - 1) as 1 | 2 | 3) : t))}
                                            className="rounded-full border border-stone-200 bg-white px-8 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50"
                                        >
                                            Quay lại
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {formTab < 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormTab((t) => (t < 3 ? ((t + 1) as 1 | 2 | 3) : t))}
                                            className="rounded-full bg-stone-950 px-8 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-[0.98]"
                                        >
                                            Kế tiếp
                                        </button>
                                    )}
                                    {formTab === 3 && (
                                        <button
                                            type="submit"
                                            disabled={isGenerating}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-8 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isGenerating && <Loader2 size={18} className="animate-spin" />}
                                            {isGenerating
                                                ? isLongWait
                                                    ? 'Đang phân tích, xin vui lòng đợi xíu...'
                                                    : 'Đang phân tích...'
                                                : 'Phân tích STP'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
                )}

                {stpData && (
                    <div
                        className="order-2 h-full min-h-0 min-w-0 w-full overflow-y-auto border-0 bg-transparent p-0 shadow-none"
                    >
                        <style>{editorialStyles}</style>
                        <div className="stp-editorial">
                            {/* HEADER */}
                            <div className="stp-doc-header stp-a" style={{ animationDelay: '0.05s' }}>
                                <div>
                                    <div className="stp-eyebrow">STP Optimizer · Precision Market Segmentation</div>
                                    <div className="stp-doc-title">
                                        {stpData.positioning.brand_essence.split('–').map((part, i, arr) => (
                                            i === arr.length - 1 ? <em key={i}>{part.trim()}</em> : part.trim() + ' – '
                                        ))}
                                    </div>
                                </div>
                                <div className="stp-doc-tags">
                                    <span className="stp-tag stp-tag-g">{currentInput?.productBrand || 'Brand'}</span>
                                    <span className="stp-tag stp-tag-w">{currentInput?.industry || 'Industry'}</span>
                                    <span className="stp-tag stp-tag-b">{stpData.targeting.primary_segment.split(' ').slice(0, 3).join(' ')}</span>
                                </div>
                            </div>

                            {/* SEGMENTATION */}
                            <div className="stp-a" style={{ animationDelay: '0.1s', marginBottom: '0.75rem' }}>
                                <div className="stp-sh">
                                    <div className="stp-sh-dot stp-sh-g"></div>
                                    <span className="stp-sh-title">S — Segmentation: Phân khúc thị trường</span>
                                </div>
                            </div>
                            <div className="stp-seg-grid stp-a" style={{ animationDelay: '0.12s', marginBottom: '2rem' }}>
                                {stpData.segmentation.segments.map((segment, idx) => (
                                    <div key={idx} className="stp-seg-col">
                                        <div className="stp-seg-num">0{idx + 1}</div>
                                        <div className="stp-seg-name">{segment.name}</div>
                                        <div className="stp-seg-block">
                                            <div className="stp-seg-bl">Nhân khẩu học</div>
                                            <StpSegmentFieldLines text={segment.demographics} />
                                        </div>
                                        <div className="stp-seg-block">
                                            <div className="stp-seg-bl">Tâm lý học</div>
                                            <StpSegmentFieldLines text={segment.psychographics} />
                                        </div>
                                        <div className="stp-seg-block">
                                            <div className="stp-seg-bl">Lý do mua</div>
                                            <div className="stp-seg-bt">{(segment as any).purchase_triggers?.join(' · ') || segment.description.slice(0, 100)}</div>
                                        </div>
                                        {(segment as any).barriers && (segment as any).barriers.length > 0 && (
                                            <div className="stp-seg-barrier">
                                                <div className="stp-seg-bar-label">Rào cản mua</div>
                                                {(segment as any).barriers.map((barrier: string, bIdx: number) => (
                                                    <div key={bIdx} className="stp-seg-bar-item">
                                                        <div className="stp-seg-bar-dot"></div>
                                                        {barrier}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* TARGETING */}
                            <div className="stp-a" style={{ animationDelay: '0.18s', marginBottom: '0.75rem' }}>
                                <div className="stp-sh">
                                    <div className="stp-sh-dot stp-sh-w"></div>
                                    <span className="stp-sh-title">T — Targeting: Phân khúc ưu tiên</span>
                                </div>
                            </div>
                            <div className="stp-target-block stp-a" style={{ animationDelay: '0.2s', marginBottom: '2rem' }}>
                                <div className="stp-tg-eyebrow">Phân khúc được chọn · Market Fit cao nhất</div>
                                <div className="stp-tg-name">{stpData.targeting.primary_segment}</div>
                                <div className="stp-tg-body">{stpData.targeting.selection_rationale}</div>
                                <div className="stp-tg-metrics">
                                    <div className="stp-tg-met">
                                        <div className="stp-tg-met-val">{stpData.targeting.market_fit_score}%</div>
                                        <div className="stp-tg-met-label">Market Fit với USP</div>
                                    </div>
                                    <div className="stp-tg-met">
                                        <div className="stp-tg-met-val">Cao</div>
                                        <div className="stp-tg-met-label">Mức độ cạnh tranh</div>
                                    </div>
                                    <div className="stp-tg-met">
                                        <div className="stp-tg-met-val">{stpData.targeting.growth_potential}</div>
                                        <div className="stp-tg-met-label">Tăng trưởng/năm</div>
                                    </div>
                                </div>
                                <div className="stp-tg-secondary">
                                    <div>
                                        <div className="stp-tg-sec-label">Phân khúc thứ cấp</div>
                                        <div className="stp-tg-sec-text">
                                            {stpData.segmentation.segments.length > 1 
                                                ? `${stpData.segmentation.segments[1]?.name} — tiếp cận sau khi đã xây dựng được trust.`
                                                : 'Xây dựng trust trước khi mở rộng.'
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div className="stp-tg-sec-label">Growth Potential</div>
                                        <div className="stp-tg-sec-text">{stpData.targeting.growth_potential}</div>
                                    </div>
                                </div>
                                <div className="stp-tg-avoid">
                                    <div className="stp-tg-avoid-label">Phân khúc nên tránh trong giai đoạn này</div>
                                    <div className="stp-tg-avoid-text">
                                        {stpData.targeting.segments_to_avoid?.join(' · ') || 'Khách hàng không phù hợp với USP hiện tại.'}
                                    </div>
                                </div>
                            </div>

                            {/* POSITIONING */}
                            <div className="stp-a" style={{ animationDelay: '0.25s', marginBottom: '0.75rem' }}>
                                <div className="stp-sh">
                                    <div className="stp-sh-dot stp-sh-b"></div>
                                    <span className="stp-sh-title">P — Positioning: Tọa độ định vị</span>
                                </div>
                            </div>

                            <div className="stp-pos-statement stp-a" style={{ animationDelay: '0.27s' }}>
                                <div className="stp-pos-text">
                                    &ldquo;{renderMarkdownBoldSegments(stpData.positioning.positioning_statement)}
                                    &rdquo;
                                </div>
                            </div>

                            <div className="stp-pos-grid stp-a" style={{ animationDelay: '0.29s' }}>
                                <div className="stp-pos-card">
                                    <div className="stp-pos-card-label">Perceptual Map — Vị trí trên thị trường</div>
                                    <div className="stp-map-wrap">
                                        <div className="stp-map-axis-x"></div>
                                        <div className="stp-map-axis-y"></div>
                                        <div className="stp-map-label lx1">Đại trà</div>
                                        <div className="stp-map-label lx2">Cao cấp</div>
                                        <div className="stp-map-label ly1">Chất lượng cao</div>
                                        <div className="stp-map-label ly2">Chất lượng thấp</div>
                                        {/* Brand dot */}
                                        <div className="stp-map-dot stp-map-us" style={{ left: '75%', top: '20%' }}>
                                            <div className="stp-map-circle"></div>
                                            <div className="stp-map-dot-label">{currentInput?.productBrand || 'Brand'}</div>
                                        </div>
                                        {/* Competitor 1 */}
                                        <div className="stp-map-dot stp-map-them1" style={{ left: '50%', top: '65%' }}>
                                            <div className="stp-map-circle"></div>
                                            <div className="stp-map-dot-label">Đối thủ 1</div>
                                        </div>
                                        {/* Competitor 2 */}
                                        <div className="stp-map-dot stp-map-them2" style={{ left: '80%', top: '55%' }}>
                                            <div className="stp-map-circle"></div>
                                            <div className="stp-map-dot-label">Đối thủ 2</div>
                                        </div>
                                        {/* Gap opportunity */}
                                        <div className="stp-map-gap" style={{ left: '30%', top: '25%' }}>
                                            <div className="stp-map-gap-label">Khoảng<br/>trắng</div>
                                        </div>
                                    </div>
                                    <div className="stp-map-legend">
                                        <div className="stp-map-legend-item">
                                            <div className="stp-map-legend-dot" style={{ background: 'var(--accent)' }}></div>
                                            {currentInput?.productBrand || 'Brand'}
                                        </div>
                                        <div className="stp-map-legend-item">
                                            <div className="stp-map-legend-dot" style={{ background: 'var(--ink-3)' }}></div>
                                            Đối thủ cạnh tranh
                                        </div>
                                        <div className="stp-map-legend-item">
                                            <div className="stp-map-legend-dot" style={{ border: '1px dashed var(--accent-w)' }}></div>
                                            Khoảng trắng
                                        </div>
                                    </div>
                                </div>
                                <div className="stp-pos-card">
                                    <div className="stp-pos-card-label">Thông điệp định vị theo kênh</div>
                                    <div className="stp-msg-grid" style={{ border: 'none', marginTop: '0.5rem' }}>
                                        <div style={{ padding: '0.75rem 0.5rem 0.75rem 0', borderRight: '1px solid var(--rule)' }}>
                                            <div className="stp-msg-ch">Facebook / Zalo</div>
                                            <div className="stp-msg-text">{renderMarkdownBoldSegments(stpData.positioning.unique_value_proposition)}</div>
                                            <div className="stp-msg-note">Cảm xúc · Hình ảnh thiên nhiên · Story khách hàng thật</div>
                                        </div>
                                        <div style={{ padding: '0.75rem 0.5rem', borderRight: '1px solid var(--rule)' }}>
                                            <div className="stp-msg-ch">Website / SEO</div>
                                            <div className="stp-msg-text">{renderMarkdownBoldSegments(stpData.positioning.unique_value_proposition)}</div>
                                            <div className="stp-msg-note">Lý trí · Chứng nhận · So sánh dịch vụ chi tiết</div>
                                        </div>
                                        <div style={{ padding: '0.75rem 0 0.75rem 0.5rem' }}>
                                            <div className="stp-msg-ch">Email / Tư vấn</div>
                                            <div className="stp-msg-text">
                                                &ldquo;{renderMarkdownBoldSegments(stpData.positioning.reasons_to_believe[0] || 'Chất lượng vượt kỳ vọng')}
                                                &rdquo;
                                            </div>
                                            <div className="stp-msg-note">Cá nhân hóa · Cam kết cụ thể · Testimonial thật</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STRATEGY & INSIGHTS */}
                            {stpData.strategy && (
                                <>
                                    <div className="stp-a" style={{ animationDelay: '0.32s', marginTop: '2rem', marginBottom: '0.75rem' }}>
                                        <div className="stp-sh">
                                            <div className="stp-sh-dot stp-sh-r"></div>
                                            <span className="stp-sh-title">Chiến lược & Cảnh báo</span>
                                        </div>
                                    </div>
                                    <div className="stp-ins-grid stp-a" style={{ animationDelay: '0.34s' }}>
                                        {stpData.strategy.top_insights.map((insight, i) => (
                                            <div key={i} className="stp-ins-card">
                                                <div className="stp-ins-num">{integerToRoman(i + 1)}</div>
                                                <div className="stp-ins-title">Insight — {['Giá trị cốt lõi', 'Cơ hội thị trường', 'Điểm khác biệt', 'Hành động ưu tiên'][i] || 'Strategic Insight'}</div>
                                                <StpStrategyInsightBody text={insight} />
                                            </div>
                                        ))}
                                        {stpData.strategy.strategic_risks?.map((risk, i) => (
                                            <div key={`risk-${i}`} className="stp-ins-card stp-ins-risk">
                                                <div className="stp-ins-num">
                                                    {integerToRoman(stpData.strategy.top_insights.length + i + 1)}
                                                </div>
                                                <div className="stp-ins-title">Rủi ro — {risk.issue.split(' ').slice(0, 4).join(' ')}</div>
                                                <StpStrategyInsightBody text={risk.mitigation} />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* ── CMO ADVICE ─────────────────────────────────────── */}
                            {stpData.cmo_advice && (
                                <div className="stp-cmo-wrap">
                                    <div className="stp-cmo-header stp-a" style={{ animationDelay: '0.44s' }}>
                                        <span className="stp-cmo-label">Lời khuyên</span>
                                        <span className="stp-cmo-sig">Strategic Advisory</span>
                                    </div>

                                    {/* 4 Advice Cards */}
                                    <div className="stp-cmo-grid">
                                        <div className="stp-adv-card priority stp-a" style={{ animationDelay: '0.46s' }}>
                                            <div className="stp-adv-num">I.</div>
                                            <div className="stp-adv-title green">Điều quan trọng nhất phải làm đúng</div>
                                            <div className="stp-adv-body">
                                                <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>{stpData.cmo_advice.most_important.factor}</strong>
                                                <br /><br />
                                                {stpData.cmo_advice.most_important.why_matters}
                                                <br /><br />
                                                <em style={{ color: 'var(--ink-3)', fontSize: '11px' }}>{stpData.cmo_advice.most_important.evidence}</em>
                                            </div>
                                            <span className="stp-adv-tag stp-tag-do">Làm ngay</span>
                                        </div>

                                        <div className="stp-adv-card pitfall stp-a" style={{ animationDelay: '0.47s' }}>
                                            <div className="stp-adv-num">II.</div>
                                            <div className="stp-adv-title red">Cạm bẫy lớn nhất cần tránh</div>
                                            <div className="stp-adv-body">
                                                <strong style={{ color: '#8a1a1a', fontWeight: 600 }}>{stpData.cmo_advice.biggest_pitfall.mistake}</strong>
                                                <br /><br />
                                                {stpData.cmo_advice.biggest_pitfall.consequence}
                                                <br /><br />
                                                <em style={{ color: 'var(--ink-3)', fontSize: '11px' }}>{stpData.cmo_advice.biggest_pitfall.instead_do}</em>
                                            </div>
                                            <span className="stp-adv-tag stp-tag-dont">Tuyệt đối tránh</span>
                                        </div>

                                        <div className="stp-adv-card opp stp-a" style={{ animationDelay: '0.48s' }}>
                                            <div className="stp-adv-num">III.</div>
                                            <div className="stp-adv-title warm">Cơ hội đang bị bỏ ngỡ</div>
                                            <div className="stp-adv-body">
                                                <strong style={{ color: 'var(--accent-w)', fontWeight: 600 }}>{stpData.cmo_advice.missed_opportunity.gap}</strong>
                                                <br /><br />
                                                <em style={{ color: 'var(--ink-3)', fontSize: '11px' }}>{stpData.cmo_advice.missed_opportunity.evidence}</em>
                                                <br /><br />
                                                {stpData.cmo_advice.missed_opportunity.how_to_exploit_90days}
                                            </div>
                                            <span className="stp-adv-tag stp-tag-now">Cơ hội chiến lược</span>
                                        </div>

                                        <div className="stp-adv-card one stp-a" style={{ animationDelay: '0.49s' }}>
                                            <div className="stp-adv-num">IV.</div>
                                            <div className="stp-adv-title">Nếu chỉ được làm 1 điều trong 30 ngày đầu</div>
                                            <div className="stp-adv-body">
                                                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{stpData.cmo_advice.one_thing.action}</strong>
                                                <br /><br />
                                                {stpData.cmo_advice.one_thing.why_leverage}
                                                <br /><br />
                                                <em style={{ color: 'var(--accent)', fontSize: '11px' }}>KPI năm 1: {stpData.cmo_advice.one_thing.kpi_year1}</em>
                                            </div>
                                            <span className="stp-adv-tag stp-tag-now">Research trước</span>
                                        </div>
                                    </div>

                                    {/* Action 30-60-90 */}
                                    <div className="stp-a" style={{ animationDelay: '0.50s', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                                        <div className="stp-sh">
                                            <div className="stp-sh-dot stp-sh-w"></div>
                                            <span className="stp-sh-title">Action Priority — 30 · 60 · 90 ngày</span>
                                        </div>
                                    </div>
                                    <div className="stp-cmo-action stp-a" style={{ animationDelay: '0.51s' }}>
                                        <div className="stp-cmo-act-head">
                                            <div className="stp-cmo-act-col-hd">
                                                Tháng 1 — {stpData.cmo_advice.action_30_60_90.month1.phase}
                                            </div>
                                            <div className="stp-cmo-act-col-hd">
                                                Tháng 2 — {stpData.cmo_advice.action_30_60_90.month2.phase}
                                            </div>
                                            <div className="stp-cmo-act-col-hd">
                                                Tháng 3 — {stpData.cmo_advice.action_30_60_90.month3.phase}
                                            </div>
                                        </div>
                                        <div className="stp-cmo-act-rows">
                                            <div className="stp-cmo-act-col">
                                                {stpData.cmo_advice.action_30_60_90.month1.items.map((item, i) => (
                                                    <div key={i} className="stp-cmo-act-item">
                                                        <div className="stp-cmo-act-dot stp-dot-now"></div>
                                                        {item}
                                                    </div>
                                                ))}
                                                {stpData.cmo_advice.action_30_60_90.month1.reason && (
                                                    <div className="stp-cmo-act-note">{stpData.cmo_advice.action_30_60_90.month1.reason}</div>
                                                )}
                                            </div>
                                            <div className="stp-cmo-act-col">
                                                {stpData.cmo_advice.action_30_60_90.month2.items.map((item, i) => (
                                                    <div key={i} className="stp-cmo-act-item">
                                                        <div className="stp-cmo-act-dot stp-dot-soon"></div>
                                                        {item}
                                                    </div>
                                                ))}
                                                {stpData.cmo_advice.action_30_60_90.month2.kpis.length > 0 && (
                                                    <div className="stp-cmo-act-note">KPI: {stpData.cmo_advice.action_30_60_90.month2.kpis.join(' · ')}</div>
                                                )}
                                            </div>
                                            <div className="stp-cmo-act-col">
                                                {stpData.cmo_advice.action_30_60_90.month3.items.map((item, i) => (
                                                    <div key={i} className="stp-cmo-act-item">
                                                        <div className="stp-cmo-act-dot stp-dot-later"></div>
                                                        {item}
                                                    </div>
                                                ))}
                                                {stpData.cmo_advice.action_30_60_90.month3.goals.length > 0 && (
                                                    <div className="stp-cmo-act-note">Mục tiêu: {stpData.cmo_advice.action_30_60_90.month3.goals.join(' · ')}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Unknowns */}
                                    {stpData.cmo_advice.ai_unknowns.length > 0 && (
                                        <div className="stp-cmo-unknown stp-a" style={{ animationDelay: '0.52s' }}>
                                            <div className="stp-cmo-unknown-label">Những gì AI không đủ dữ liệu để kết luận</div>
                                            {stpData.cmo_advice.ai_unknowns.map((item, i) => (
                                                <div key={i} className="stp-cmo-unknown-item">
                                                    <span className="stp-cmo-unknown-dash">—</span>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Final Quote */}
                                    {stpData.cmo_advice.final_positioning_quote && (
                                        <div className="stp-cmo-quote stp-a" style={{ animationDelay: '0.53s' }}>
                                            &ldquo;{stpData.cmo_advice.final_positioning_quote}&rdquo;
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FOOTER */}
                            <div className="stp-footer-bar stp-a" style={{ animationDelay: '0.55s' }}>
                                <div className="stp-fb-col">
                                    <span className="stp-fb-val">{stpData.segmentation.segments.length}</span>
                                    <div className="stp-fb-label">Phân khúc xác định</div>
                                </div>
                                <div className="stp-fb-col">
                                    <span className="stp-fb-val">{stpData.targeting.market_fit_score}%</span>
                                    <div className="stp-fb-label">Market Fit phân khúc chính</div>
                                </div>
                                <div className="stp-fb-col">
                                    <span className="stp-fb-val">1</span>
                                    <div className="stp-fb-label">Khoảng trắng chiến lược</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default STPModelGenerator;
