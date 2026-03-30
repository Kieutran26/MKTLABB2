import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragStartEvent, DragEndEvent, useDraggable, useDroppable,
    defaultDropAnimationSideEffects, DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Send, Monitor, Smartphone, LayoutGrid, Type, Image as ImageIcon, CheckSquare, Maximize2, X, Plus, Trash2, Eye, Download, Upload, Save, History, Code, FileJson, Copy, Briefcase, Gift, ShoppingBag, MapPin, Heart, Sparkles, User, Users, Network, Maximize, BarChart2,
    Mail, MousePointerClick, Link2, Minus, Rows, Columns, PlayCircle, PanelTop, CreditCard, PanelBottom, UserMinus, Grid, Ticket, ShoppingCart, Receipt, Home, List, FileText, ExternalLink, Palette, Circle, Tablet, Check, GripVertical, ChevronUp, ChevronDown, Settings, AlignLeft, AlignCenter, AlignRight, Layers, Square, Bold, Italic, Share2, LayoutTemplate, Calendar
} from 'lucide-react';


const SOCIAL_ICONS: Record<string, string> = {
    Facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>',
    Twitter: '<path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>',
    Instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>',
    LinkedIn: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>',
    YouTube: '<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>',
    TikTok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v4a9 9 0 0 1-9-9v17"></path>',
    Website: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
};
import { EmailService } from '../services/emailService';
import { StorageService } from '../services/storageService';
import {
    EmailTemplate, EmailHistoryRecord, EmailBlock, EmailDocument,
    HeadingBlock, TextBlock, ImageBlock, ButtonBlock, SpacerBlock,
    DividerBlock, SocialBlock, EmailBlockType, SavedEmailDesign,
} from '../types';
import { Toast, ToastType } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { emailDesignService } from '../services/emailDesignService';
import EmailReport from './EmailReport';
import CampaignManager from './EmailMarketing/CampaignManager';
import { ScheduledCampaignsModal } from './EmailMarketing/ScheduledCampaignsModal';
import { campaignService, EmailCampaign } from '../services/campaignService';
import { generateEmailHTML } from '../utils/emailRenderer';

// =============================================
// CONSTANTS
// =============================================
const MERGE_TAGS = [
    { label: 'Tên', value: '{{name}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Công ty', value: '{{company}}' },
    { label: 'Điện thoại', value: '{{phone}}' },
];

const ELEMENT_TYPES: { type: EmailBlockType; label: string; icon?: React.ReactNode; iconText?: string; level?: 'h1' | 'h2' | 'h3' }[] = [
    { type: 'heading', label: 'Heading 1', iconText: 'H1', level: 'h1' },
    { type: 'heading', label: 'Heading 2', iconText: 'H2', level: 'h2' },
    { type: 'heading', label: 'Heading 3', iconText: 'H3', level: 'h3' },
    { type: 'text', label: 'Text', icon: <AlignLeft size={20} /> },
    { type: 'button', label: 'Button', icon: <MousePointerClick size={20} /> },
    { type: 'link', label: 'Link', icon: <Link2 size={20} /> },
    { type: 'image', label: 'Image', icon: <ImageIcon size={20} /> },
    { type: 'divider', label: 'Divider', icon: <Minus size={20} /> },
];

const LAYOUT_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'row2', label: '2 Rows', icon: <Rows size={20} /> },
    { type: 'row3', label: '3 Rows', icon: <Rows size={20} /> },
    { type: 'column2', label: '2 Columns', icon: <Columns size={20} /> },
    { type: 'column3', label: '3 Columns', icon: <Columns size={20} /> },
    { type: 'html', label: 'HTML', icon: <Code size={20} /> },
];

const MEDIA_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'image', label: 'Image', icon: <ImageIcon size={20} /> },
    { type: 'video', label: 'Video', icon: <PlayCircle size={20} /> },
];

const CUSTOM_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'header', label: 'Header', icon: <PanelTop size={20} /> },
    { type: 'product', label: 'Product Card', icon: <CreditCard size={20} /> },
    { type: 'footer', label: 'Footer', icon: <PanelBottom size={20} /> },
    { type: 'unsubscribe', label: 'Unsubscribe', icon: <UserMinus size={20} /> },
];

const ECOMMERCE_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'product-grid', label: 'Product Grid', icon: <Grid size={20} /> },
    { type: 'coupon', label: 'Coupon Code', icon: <Ticket size={20} /> },
    { type: 'order-summary', label: 'Order Summary', icon: <Receipt size={20} /> },
];





const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Recursive helper to find block by ID
const findBlockById = (blocks: EmailBlock[], id: string): EmailBlock | null => {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (['row2', 'row3', 'column2', 'column3'].includes(block.type) && (block as any).children) {
            for (const cell of (block as any).children) {
                const found = findBlockById(cell, id);
                if (found) return found;
            }
        }
    }
    return null;
};

// Recursive helper to update block in list
const updateBlockInList = (blocks: EmailBlock[], updatedBlock: EmailBlock): EmailBlock[] => {
    return blocks.map(b => {
        if (b.id === updatedBlock.id) return updatedBlock;
        if (['row2', 'row3', 'column2', 'column3'].includes(b.type) && (b as any).children) {
            const newChildren = (b as any).children.map((cell: EmailBlock[]) => updateBlockInList(cell, updatedBlock));
            return { ...b, children: newChildren };
        }
        return b;
    });
};

// Recursive help to insert a block into a specific parent cell
const insertBlockIntoParent = (blocks: EmailBlock[], parentId: string, cellIndex: number, newBlock: EmailBlock): EmailBlock[] => {
    return blocks.map(b => {
        if (b.id === parentId) {
            const newChildren = [...(b as any).children];
            if (newChildren[cellIndex]) {
                newChildren[cellIndex] = [...newChildren[cellIndex], newBlock];
            }
            return { ...b, children: newChildren };
        }
        if (['row2', 'row3', 'column2', 'column3'].includes(b.type) && (b as any).children) {
            const newChildren = (b as any).children.map((cell: EmailBlock[]) => insertBlockIntoParent(cell, parentId, cellIndex, newBlock));
            return { ...b, children: newChildren };
        }
        return b;
    });
};




const createDefaultBlock = (type: EmailBlockType, level?: 'h1' | 'h2' | 'h3'): EmailBlock => {
    const id = crypto.randomUUID();
    switch (type) {
        case 'heading': return { id, type: 'heading', content: level ? `Heading ${level.replace('h', '')}` : 'Heading 1', level: level || 'h1', alignment: 'left', color: '#1f2937' };
        case 'text': return { id, type: 'text', content: 'This is a text block. Click to edit.', alignment: 'left' };
        case 'image': return { id, type: 'image', src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Image', alt: 'Image', width: 'full', alignment: 'center' };
        case 'button': return { id, type: 'button', label: 'Click Me', url: '#', alignment: 'center', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 8 };
        case 'spacer': return { id, type: 'spacer', height: 32 };
        case 'divider': return { id, type: 'divider', style: 'solid', color: '#e5e7eb' };

        case 'social': return { id, type: 'social', platforms: [{ name: 'Facebook', url: '#' }], alignment: 'center' };
        case 'link': return { id, type: 'link', text: 'Click here', url: '#', alignment: 'left', color: '#3b82f6' };
        case 'row2': return { id, type: 'row2', children: [[], []] };
        case 'row3': return { id, type: 'row3', children: [[], [], []] };
        case 'column2': return { id, type: 'column2', children: [[], []] };
        case 'column3': return { id, type: 'column3', children: [[], [], []] };
        case 'html': return { id, type: 'html', content: '<p style="color:#3b82f6;font-weight:bold;">Custom HTML Content</p>' };
        case 'video': return { id, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', alt: 'Video thumbnail', alignment: 'center' };
        case 'header': return { id, type: 'header', logoSrc: '', companyName: 'Company Name', tagline: 'Your best solutions', showMenu: true, layout: 'inline', colors: { background: '#111111', companyName: '#ffffff', tagline: '#9ca3af', menu: '#ffffff' }, navLinks: [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Products', url: '#' }, { text: 'Contact', url: '#' }], alignment: 'center' };
        case 'footer': return { id, type: 'footer', content: '', logoUrl: 'https://placehold.co/120x40/3b82f6/ffffff?text=LOGO', companyName: 'Your Company', companyEmail: 'contact@company.com', phone: '(555) 123-4567', address: '123 Business St, City, State 12345', socialLinks: [{ name: 'Facebook', url: '#' }, { name: 'Twitter', url: '#' }, { name: 'Instagram', url: '#' }], socialIconStyle: 'circle', socialIconSize: 'medium', copyrightText: '© 2025 Your Company. All rights reserved.', privacyUrl: '/privacy', termsUrl: '/terms', unsubscribeText: 'Hủy đăng ký', unsubscribeUrl: '/unsubscribe', backgroundColor: '#f3f4f6', alignment: 'center' };
        case 'product': return { id, type: 'product', productImage: 'https://placehold.co/400x300/e2e8f0/64748b?text=Product+Image', title: 'Premium Product', price: '$99.99', originalPrice: '$149.99', description: 'This is a premium product with amazing features that you will love.', url: '#', buttonText: 'Mua ngay', buttonColor: '#2563eb', backgroundColor: '#ffffff', rating: 5, reviewCount: 128, badge: 'Best Seller', discount: '20', inStock: true, titleFontSize: 22, colors: { text: '#1f2937', price: '#1f2937', buttonText: '#ffffff', badge: '#ef4444' } };
        case 'unsubscribe': return { id, type: 'unsubscribe', text: 'Nếu bạn không muốn nhận email từ chúng tôi, bạn có thể hủy đăng ký bất cứ lúc nào.', linkText: 'Hủy đăng ký', url: '{{UNSUBSCRIBE_URL}}', alignment: 'center', fontSize: 12, colors: { text: '#6b7280', link: '#3b82f6' } };

        // E-commerce
        case 'product-grid': return {
            id,
            type: 'product-grid',
            products: [
                { id: '1', image: 'https://placehold.co/300x200?text=Product+1', title: 'Sản phẩm 1', price: '199.000đ', originalPrice: '299.000đ', url: '#' },
                { id: '2', image: 'https://placehold.co/300x200?text=Product+2', title: 'Sản phẩm 2', price: '250.000đ', originalPrice: '', url: '#' },
                { id: '3', image: 'https://placehold.co/300x200?text=Product+3', title: 'Sản phẩm 3', price: '320.000đ', originalPrice: '400.000đ', url: '#' }
            ],
            backgroundColor: '#ffffff',
            title: 'Sản phẩm nổi bật',
            columns: 3,
            titleAlignment: 'center',
            titleFontSize: 20,
            titleFontWeight: 'bold',
            titleFontStyle: 'normal',
            fontFamily: 'Arial',
            titleColors: { text: '#0F172A', background: '#DBEAFE' },
            titleIcon: '',
            cardBackgroundColor: '#FFFFFF',
            cardBorderColor: '#E5E7EB',
            cardBorderWidth: 1,
            cardBorderRadius: 12,
            cardPadding: 8,
            productNameColor: '#1F2937',
            priceColor: '#2563EB',
            oldPriceColor: '#9CA3AF',
            imageShape: 'rectangle',
            imageHeight: 140,
            imageBorderRadius: 0
        };
        case 'coupon': return {
            id,
            type: 'coupon',
            code: 'SAVE20',
            discount: '20% OFF',
            description: 'Use this code at checkout',
            expirationDate: 'Dec 31, 2025',
            backgroundColor: '#FFFBEB',
            borderColor: '#F59E0B',
            alignment: 'center',
            badgeColor: '#F59E0B',
            codeColor: '#D97706',
            iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/discount-ticket.png'
        };
        case 'order-summary': return {
            id,
            type: 'order-summary',
            title: 'Tổng đơn hàng',
            orderId: 'Đơn hàng #12345',
            items: [{ name: 'Product A', qty: 1, price: '$50' }, { name: 'Product B', qty: 1, price: '$75' }],
            subtotal: '597.000đ',
            shippingFee: '30.000đ',
            total: '627.000đ',

            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            fontFamily: 'Arial',
            titleAlignment: 'left',
            titleFontSize: 18,
            titleFontWeight: 'bold',
            titleFontStyle: 'normal',
            titleColor: '#1F2937',
            totalColor: '#1F2937',
            iconUrl: 'https://img.icons8.com/ios-filled/50/ffffff/list.png',
            iconColor: '#FFFFFF',
            iconBackgroundColor: '#10B981',
            shippingLabel: 'Ship to',
            shippingAddress: '123 Main St, City, Country'
        };

        default: return { id, type: 'text', content: '', alignment: 'left' };
    }
};

const DEFAULT_DOC: EmailDocument = {
    blocks: [
        { id: 'd1', type: 'heading', content: 'Chào mừng!', level: 'h1', alignment: 'center', color: '#1f2937' } as HeadingBlock,
        { id: 'd2', type: 'text', content: 'Kéo thả để xây dựng email.', alignment: 'center' } as TextBlock,
        { id: 'd3', type: 'button', label: 'Bắt đầu', url: '#', backgroundColor: '#3b82f6', textColor: '#fff', borderRadius: 8, alignment: 'center' } as ButtonBlock,
    ],
    settings: { backgroundColor: '#f3f4f6', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#3b82f6' },
};

// =============================================
// LEFT SIDEBAR
// =============================================
type LeftTabType = 'elements' | 'templates' | 'fields';

const DraggableElement: React.FC<{ type: EmailBlockType; label: string; icon?: React.ReactNode; iconText?: string; level?: 'h1' | 'h2' | 'h3' }> = ({ type, label, icon, iconText, level }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `element-${type}-${label}`, data: { type, isNew: true, level } });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }} {...listeners} {...attributes}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl cursor-grab hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                {iconText ? <span className="text-sm font-bold">{iconText}</span> : icon}
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
    );
};

const DraggableMergeTag: React.FC<{ tag: { label: string; value: string } }> = ({ tag }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `tag-${tag.value}`, data: { tag: tag.value, isTag: true } });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }} {...listeners} {...attributes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium cursor-grab hover:bg-blue-100 border border-blue-100">
            <span className="font-mono text-blue-500">{tag.value}</span>
        </div>
    );
};

const LeftSidebar: React.FC<{ activeTab: LeftTabType; onTabChange: (t: LeftTabType) => void; onTemplateSelect: (id: string) => void; hasCustomerList: boolean; savedDesigns: SavedEmailDesign[]; onLoadDesign: (design: SavedEmailDesign) => void; onDeleteDesign: (id: string) => void }> = ({ activeTab, onTabChange, onTemplateSelect, hasCustomerList, savedDesigns, onLoadDesign, onDeleteDesign }) => {
    const tabs = [
        { id: 'elements' as const, label: 'Blocks', icon: <LayoutGrid size={15} /> },
        { id: 'templates' as const, label: 'Templates', icon: <FileText size={15} /> },
        { id: 'fields' as const, label: 'Fields', icon: <Users size={15} /> },
    ];
    return (
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex p-2 gap-1 border-b border-gray-100">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex-1 py-2 px-1 text-[11px] font-medium rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.id ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        {React.cloneElement(tab.icon as React.ReactElement, { size: 18 })}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                {activeTab === 'elements' && (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Cơ Bản</h3>
                            <div className="grid grid-cols-2 gap-2">{ELEMENT_TYPES.filter(e => e.type !== 'image').map((el, i) => <DraggableElement key={`${el.type}-${i}`} {...el} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Bố Cục</h3>
                            <div className="grid grid-cols-2 gap-2">{LAYOUT_ELEMENTS.map((el, i) => <DraggableElement key={`layout-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Đa Phương Tiện</h3>
                            <div className="grid grid-cols-2 gap-2">{MEDIA_ELEMENTS.map((el, i) => <DraggableElement key={`media-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Tuỳ Biến</h3>
                            <div className="grid grid-cols-2 gap-2">{CUSTOM_ELEMENTS.map((el, i) => <DraggableElement key={`custom-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">E-commerce</h3>
                            <div className="grid grid-cols-2 gap-2">{ECOMMERCE_ELEMENTS.map((el, i) => <DraggableElement key={`ecom-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>

                    </div>
                )}
                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        {/* Saved Designs Section */}
                        {savedDesigns.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Đã Lưu ({savedDesigns.length})</h3>
                                <div className="space-y-2">
                                    {savedDesigns.map((design) => (
                                        <div key={design.id} className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 hover:border-green-400 hover:shadow-sm transition-all group">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                                <Save size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-800 text-sm truncate">{design.name}</div>
                                                <div className="text-[10px] text-gray-400">{new Date(design.updatedAt).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onLoadDesign(design)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg" title="Tải lại">
                                                    <Upload size={14} />
                                                </button>
                                                <button onClick={() => onDeleteDesign(design.id)} className="p-1.5 text-red-400 hover:bg-red-100 rounded-lg" title="Xóa">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {savedDesigns.length === 0 && (
                            <div className="text-center py-6 text-gray-400">
                                <Save size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">Chưa có template nào được lưu</p>
                            </div>
                        )}

                    </div>
                )}
                {activeTab === 'fields' && (
                    <div className="space-y-4">
                        {!hasCustomerList ? <div className="text-center py-8"><Users size={32} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500 mb-4">Chọn danh sách</p><button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Select List</button></div>
                            : <div className="space-y-3"><p className="text-xs text-gray-500 font-medium">Merge Tags:</p><div className="flex flex-wrap gap-2">{MERGE_TAGS.map((tag) => <DraggableMergeTag key={tag.value} tag={tag} />)}</div></div>}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================
// BORDER & SHADOW SETTINGS
// =============================================
interface StyleState { borderWidth: number; borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'; borderColor: string; borderRadius: number; boxShadow: string; hideDesktop: boolean; hideMobile: boolean; hideTablet: boolean; }

const BorderShadowSettings: React.FC<{ style: StyleState; onChange: (s: StyleState) => void }> = ({ style, onChange }) => {
    const borderWidths = [{ label: 'None', value: 0 }, { label: '1px', value: 1 }, { label: '2px', value: 2 }, { label: '3px', value: 3 }, { label: '4px', value: 4 }];
    const borderStyles = [
        { id: 'solid', label: 'Liền', icon: <div className="w-full h-0.5 bg-gray-800" /> },
        { id: 'dashed', label: 'Đứt', icon: <div className="w-full h-0.5 border-t-2 border-dashed border-gray-800" /> },
        { id: 'dotted', label: 'Chấm', icon: <div className="w-full h-0.5 border-t-2 border-dotted border-gray-800" /> },
        { id: 'double', label: 'Đôi', icon: <div className="flex flex-col gap-0.5"><div className="w-full h-0.5 bg-gray-800" /><div className="w-full h-0.5 bg-gray-800" /></div> },
    ];
    const radiusPresets = [0, 4, 8, 12, 16, 24];
    const shadows = [
        { id: 'none', label: 'None', class: '' },
        { id: 'sm', label: 'Soft', class: 'shadow-sm' },
        { id: 'md', label: 'Medium', class: 'shadow-md' },
        { id: 'lg', label: 'Large', class: 'shadow-lg' },
        { id: 'xl', label: 'X-Large', class: 'shadow-xl' },
        { id: '2xl', label: '2XL', class: 'shadow-2xl' },
    ];

    return (
        <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Palette size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-800 text-sm">Viền & Đổ bóng</span>
            </div>

            {/* Border Width */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Width</label>
                <div className="flex gap-1">
                    {borderWidths.map((bw) => (
                        <button key={bw.value} onClick={() => onChange({ ...style, borderWidth: bw.value })} className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${style.borderWidth === bw.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{bw.label}</button>
                    ))}
                </div>
            </div>

            {/* Border Style */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Style</label>
                <div className="grid grid-cols-4 gap-2">
                    {borderStyles.map((bs) => (
                        <button key={bs.id} onClick={() => onChange({ ...style, borderStyle: bs.id as any })} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${style.borderStyle === bs.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="w-8">{bs.icon}</div>
                            <span className="text-[10px] text-gray-600">{bs.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Border Color */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Color</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-300 relative shrink-0">
                        <input type="color" value={style.borderColor} onChange={(e) => onChange({ ...style, borderColor: e.target.value })} className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" />
                    </div>
                    <input type="text" value={style.borderColor} onChange={(e) => onChange({ ...style, borderColor: e.target.value })} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700" />
                </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Radius</label>
                <div className="flex gap-1 mb-2">
                    {radiusPresets.map((r) => (
                        <button key={r} onClick={() => onChange({ ...style, borderRadius: r })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${style.borderRadius === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r}</button>
                    ))}
                    <button onClick={() => onChange({ ...style, borderRadius: 9999 })} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${style.borderRadius === 9999 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}><Circle size={12} /></button>
                </div>
                <div className="flex items-center gap-3">
                    <input type="range" min="0" max="100" value={style.borderRadius > 100 ? 100 : style.borderRadius} onChange={(e) => onChange({ ...style, borderRadius: +e.target.value })} className="flex-1 accent-blue-600" />
                    <input type="number" value={style.borderRadius} onChange={(e) => onChange({ ...style, borderRadius: +e.target.value })} className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center" />
                </div>
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Box Shadow</label>
                <div className="grid grid-cols-3 gap-2">
                    {shadows.map((sh) => (
                        <button key={sh.id} onClick={() => onChange({ ...style, boxShadow: sh.id })} className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all ${style.boxShadow === sh.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className={`w-10 h-10 bg-white rounded-lg ${sh.class} border border-gray-100 flex items-center justify-center`}>
                                <span className="text-[9px] text-gray-500 font-medium">{sh.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =============================================
// VISIBILITY SETTINGS
// =============================================
const VisibilitySettings: React.FC<{ style: StyleState; onChange: (s: StyleState) => void }> = ({ style, onChange }) => {
    const devices = [
        { key: 'hideDesktop' as const, label: 'Hide on Desktop', desc: '>768px', icon: <Monitor size={18} /> },
        { key: 'hideMobile' as const, label: 'Hide on Mobile', desc: '≤768px', icon: <Smartphone size={18} /> },
        { key: 'hideTablet' as const, label: 'Hide on Tablet', desc: '769-1024px', icon: <Tablet size={18} /> },
    ];
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Eye size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-800 text-sm">Hiển thị</span>
            </div>
            <div className="space-y-2">
                {devices.map((d) => (
                    <label key={d.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${style[d.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                {style[d.key] && <Check size={12} className="text-white" />}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-800">{d.label}</div>
                                <div className="text-[10px] text-gray-400">{d.desc}</div>
                            </div>
                        </div>
                        <div className="text-gray-400">{d.icon}</div>
                        <input type="checkbox" checked={style[d.key]} onChange={(e) => onChange({ ...style, [d.key]: e.target.checked })} className="sr-only" />
                    </label>
                ))}
            </div>
        </div>
    );
};

// =============================================
// CANVAS COMPONENTS
// =============================================
const DropIndicator: React.FC<{ show: boolean }> = ({ show }) => show ? <div className="h-14 mx-2 my-1 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-xl flex items-center justify-center animate-pulse"><span className="text-sm font-medium text-blue-500">Thả vào đây</span></div> : null;

// Droppable Cell for Row/Column blocks
const DroppableCell: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={`${className || ''} ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''} transition-all`}>
            {children}
        </div>
    );
};

const FloatingToolbar: React.FC<{ onMoveUp: () => void; onMoveDown: () => void; onDuplicate: () => void; onDelete: () => void; dragListeners?: any; dragAttributes?: any; canMoveUp: boolean; canMoveDown: boolean }> = ({ onMoveUp, onMoveDown, onDuplicate, onDelete, dragListeners, dragAttributes, canMoveUp, canMoveDown }) => (
    <div className="absolute -top-10 left-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20">
        <button {...dragListeners} {...dragAttributes} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded cursor-grab"><GripVertical size={14} /></button>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={onMoveUp} disabled={!canMoveUp} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp size={14} /></button>
        <button onClick={onMoveDown} disabled={!canMoveDown} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown size={14} /></button>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={onDuplicate} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Copy size={14} /></button>
        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
    </div>
);

// Reusable Block Renderer
const BlockRenderer: React.FC<{ block: EmailBlock; isSelected?: boolean; onSelect?: (id?: string) => void; onUpdate: (b: EmailBlock) => void }> = ({ block, isSelected, onSelect, onUpdate }) => {
    switch (block.type) {
        case 'heading': const Tag = block.level as any; const sizes = { h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg' }; return <Tag className={`${sizes[block.level]} font-bold py-3 px-4 rounded-lg outline-none`} style={{ textAlign: block.alignment, color: block.color }} contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate({ ...block, content: e.currentTarget.textContent || '' })}>{block.content}</Tag>;
        case 'text': return <div className="py-3 px-4 rounded-lg text-gray-700 outline-none" style={{ textAlign: block.alignment }} contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate({ ...block, content: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: block.content }} />;
        case 'image': return <div className="py-3 px-4" style={{ textAlign: block.alignment }}>{block.src ? <img src={block.src} alt={block.alt} className={`inline-block rounded-lg ${block.width === 'full' ? 'w-full' : 'max-w-xs'}`} /> : <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center"><ImageIcon size={28} className="mx-auto text-gray-400 mb-2" /><span className="text-sm text-gray-500">Add image</span></div>}</div>;
        case 'button': return <div className="py-4 px-4" style={{ textAlign: block.alignment }}><a href="#" className="inline-block font-bold py-2.5 px-6" style={{ backgroundColor: block.backgroundColor, color: block.textColor, borderRadius: `${block.borderRadius}px` }} onClick={(e) => e.preventDefault()}>{block.label}</a></div>;
        case 'spacer': return <div className={isSelected ? 'bg-blue-50/50 border border-dashed border-blue-200 rounded-lg' : ''} style={{ height: `${block.height}px` }} />;
        case 'divider': return <div className="py-4 px-4"><hr style={{ borderStyle: block.style, borderColor: block.color }} /></div>;
        case 'social': return <div className="py-4 px-4" style={{ textAlign: block.alignment }}><div className="inline-flex gap-3">{block.platforms.map((p, i) => <div key={i} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">{p.name.charAt(0)}</div>)}</div></div>;
        case 'link': return <div className="py-3 px-4" style={{ textAlign: block.alignment }}><a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 underline font-medium" style={{ color: block.color }}><Link2 size={14} />{block.text}</a></div>;
        case 'row2': return <div className="py-3 px-4 space-y-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[40px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'row3': return <div className="py-3 px-4 space-y-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[40px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'column2': return <div className="py-3 px-4 grid grid-cols-2 gap-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[60px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'column3': return <div className="py-3 px-4 grid grid-cols-3 gap-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[60px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'html': return <div className="py-3 px-4"><div className="p-3 bg-white border border-gray-200 rounded-lg" dangerouslySetInnerHTML={{ __html: block.content }} /></div>;
        case 'video': return <div className="py-3 px-4" style={{ textAlign: block.alignment }}><div className="relative inline-block rounded-xl overflow-hidden bg-gray-900 group cursor-pointer">{block.thumbnail ? <img src={block.thumbnail} alt={block.alt} className="max-w-full h-auto opacity-80" /> : <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-500 mb-2 min-w-[300px]"><PlayCircle size={48} className="text-white opacity-80" /></div>}<div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"><PlayCircle size={24} className="text-white fill-white" /></div></div></div></div>;
        case 'header': return (
            <div className={`py-6 px-6 flex ${block.layout === 'stacked' ? 'flex-col justify-center text-center gap-6' : 'flex-row items-center justify-between gap-4'}`} style={{ backgroundColor: block.colors.background }}>
                <div className={`flex flex-col ${block.layout === 'stacked' ? 'items-center' : 'items-start'}`}>
                    {block.logoSrc ? <img src={block.logoSrc} alt="Logo" className="h-10 object-contain mb-2" /> : block.companyName ? <div className="font-bold text-2xl tracking-tight leading-none" style={{ color: block.colors.companyName }}>{block.companyName}</div> : <div className="h-8 px-3 bg-gray-200 rounded flex items-center text-xs font-bold text-gray-500">LOGO</div>}
                    {block.tagline && <div className="text-sm mt-1" style={{ color: block.colors.tagline }}>{block.tagline}</div>}
                </div>
                {block.showMenu && <div className="flex flex-wrap gap-6 text-sm font-medium" style={{ justifyContent: block.layout === 'stacked' ? 'center' : 'flex-end', color: block.colors.menu }}>{block.navLinks.map((l, i) => <span key={i} className="cursor-pointer hover:underline opacity-90 hover:opacity-100 transition-opacity">{l.text}</span>)}</div>}
            </div>
        );
        case 'footer': return (
            <div className="py-8 px-6 text-center space-y-6" style={{ backgroundColor: block.backgroundColor }}>
                {/* Logo */}
                {block.logoUrl && <img src={block.logoUrl} alt="Company Logo" className="h-8 mx-auto mb-4" />}

                {/* Company Info */}
                <div className="space-y-1">
                    {block.companyName && <div className="font-bold text-gray-800">{block.companyName}</div>}
                    <div className="text-sm text-gray-500 space-y-1">
                        {block.address && <div>{block.address}</div>}
                        {block.companyEmail && <div>{block.companyEmail}</div>}
                        {block.phone && <div>{block.phone}</div>}
                    </div>
                </div>

                {/* Social Links */}
                {block.socialLinks.length > 0 && (
                    <div className="flex justify-center gap-3">
                        {block.socialLinks.map((s, i) => {
                            const sizeClasses = { small: 'w-6 h-6 p-1.5', medium: 'w-8 h-8 p-2', large: 'w-10 h-10 p-2.5' };
                            const styleClasses = { circle: 'rounded-full', square: 'rounded-none', rounded: 'rounded-lg' };
                            const size = block.socialIconSize || 'medium';
                            const style = block.socialIconStyle || 'circle';
                            const iconSvg = SOCIAL_ICONS[s.name] || SOCIAL_ICONS['Website'];

                            return (
                                <a key={i} href={s.url} className={`${sizeClasses[size]} ${styleClasses[style]} bg-gray-200 text-gray-600 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors`}>
                                    <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: iconSvg }} />
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Copyright & Legal */}
                <div className="pt-6 border-t border-gray-200/50">
                    <div className="text-xs text-gray-400 mb-3">{block.copyrightText?.startsWith('©') ? block.copyrightText : `© ${block.copyrightText || ''}`}</div>
                    <div className="flex justify-center flex-wrap gap-4 text-xs text-gray-400">
                        {block.privacyUrl && <a href={block.privacyUrl} className="underline hover:text-gray-600">Privacy Policy</a>}
                        {block.termsUrl && <a href={block.termsUrl} className="underline hover:text-gray-600">Terms of Service</a>}
                        {block.unsubscribeUrl && <a href={block.unsubscribeUrl} className="underline hover:text-gray-600">{block.unsubscribeText || 'Unsubscribe'}</a>}
                    </div>
                </div>
            </div>
        );
        case 'product': return (
            <div className="py-4 px-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col items-center text-center hover:shadow-lg transition-shadow relative" style={{ backgroundColor: block.backgroundColor }}>
                    {/* Badge */}
                    {block.badge && (
                        <div className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm" style={{ backgroundColor: block.colors?.badge || '#ef4444' }}>
                            {block.badge}
                        </div>
                    )}

                    {/* Image */}
                    {block.productImage ? (
                        <div className="w-full relative bg-gray-100 group">
                            <img src={block.productImage} alt={block.title} className="w-full h-56 object-cover" />
                            {!block.inStock && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-gray-500 uppercase tracking-widest text-sm">Out of Stock</div>}
                        </div>
                    ) : (
                        <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-400">
                            <ShoppingBag size={32} />
                        </div>
                    )}

                    <div className="p-6 w-full flex flex-col items-center">
                        {/* Title */}
                        <h3 className="font-bold mb-2 leading-tight" style={{ fontSize: `${block.titleFontSize || 20}px`, color: block.colors?.text || '#1f2937' }}>
                            {block.title}
                        </h3>

                        {/* Rating */}
                        {(block.rating !== undefined) && !(block.rating === 5 && (!block.reviewCount || block.reviewCount === 0)) && (
                            <div className="flex items-center gap-1.5 mb-3">
                                <div className="flex text-yellow-400 text-sm">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <span key={s}>{s <= (block.rating || 5) ? '★' : '☆'}</span>
                                    ))}
                                </div>
                                {block.reviewCount ? <span className="text-xs text-gray-400">({block.reviewCount} reviews)</span> : null}
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-bold text-lg" style={{ color: block.colors?.price || '#1f2937' }}>{block.price}</span>
                            {block.originalPrice && <span className="text-sm text-gray-400 line-through decoration-gray-400">{block.originalPrice}</span>}
                            {block.discount && <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded ml-1">-{block.discount}%</span>}
                        </div>

                        {/* Button */}
                        <a
                            href={block.url}
                            className="w-full py-3 rounded-lg font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ backgroundColor: block.buttonColor, color: block.colors?.buttonText || '#ffffff' }}
                            onClick={(e) => e.preventDefault()}
                        >
                            <ShoppingCart size={16} />
                            {block.buttonText}
                        </a>
                    </div>
                </div>
            </div>
        );
        case 'unsubscribe': return (
            <div className="py-4 px-4" style={{ backgroundColor: block.colors?.background, textAlign: block.alignment }}>
                <div className="text-gray-500 mb-2" style={{ fontSize: `${block.fontSize || 12}px`, color: block.colors?.text }} dangerouslySetInnerHTML={{ __html: block.text }} />
                <a href={block.url} className="inline-block font-medium hover:underline" style={{ fontSize: `${block.fontSize || 12}px`, color: block.colors?.link || '#3b82f6' }} onClick={(e) => e.preventDefault()}>
                    {block.linkText}
                </a>
            </div>
        );

        // E-commerce
        case 'product-grid': return (
            <div className="py-4 px-4" style={{ backgroundColor: block.backgroundColor }}>
                {block.title && (
                    <div className="flex items-center gap-2 mb-4 px-2" style={{ justifyContent: block.titleAlignment === 'center' ? 'center' : block.titleAlignment === 'right' ? 'flex-end' : 'flex-start' }}>
                        {block.titleIcon && <img src={block.titleIcon} className="w-6 h-6 object-contain" />}
                        <div style={{
                            fontSize: `${block.titleFontSize || 20}px`,
                            fontWeight: block.titleFontWeight === 'bold' ? '700' : '400',
                            fontStyle: block.titleFontStyle || 'normal',
                            fontFamily: block.fontFamily || 'Arial',
                            color: block.titleColors?.text || '#1f2937',
                            backgroundColor: block.titleColors?.background,
                            padding: block.titleColors?.background ? '4px 12px' : '0',
                            borderRadius: block.titleColors?.background ? '8px' : '0'
                        }}>
                            {block.title}
                        </div>
                    </div>
                )}
                <div className="grid" style={{ gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)`, gap: '16px' }}>
                    {block.products.map((p, i) => (
                        <div key={i} style={{
                            backgroundColor: block.cardBackgroundColor || '#ffffff',
                            border: `${block.cardBorderWidth || 1}px solid ${block.cardBorderColor || '#e5e7eb'}`,
                            borderRadius: `${block.cardBorderRadius || 8}px`,
                            padding: `${block.cardPadding || 0}px`,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '100%',
                                height: `${block.imageHeight || 140}px`,
                                overflow: 'hidden',
                                borderRadius: `${block.imageBorderRadius || 0}px`,
                                marginBottom: '8px'
                            }}>
                                {p.image ? (
                                    <img src={p.image} className="w-full h-full object-cover" style={{ borderRadius: `${block.imageShape === 'circle' ? '50%' : block.imageBorderRadius + 'px'}` }} />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                                )}
                            </div>
                            <div className="px-2 pb-2 text-center">
                                <div className="font-semibold mb-1 line-clamp-2" style={{ color: block.productNameColor || '#1f2937', fontSize: '14px' }}>{p.title}</div>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    <div style={{ color: block.priceColor || '#2563eb', fontWeight: 'bold' }}>{p.price}</div>
                                    {p.originalPrice && <div style={{ color: block.oldPriceColor || '#9ca3af', textDecoration: 'line-through', fontSize: '12px' }}>{p.originalPrice}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
        case 'coupon': return (
            <div className="py-4 px-8" style={{ textAlign: 'center' }}>
                <div style={{ backgroundColor: block.backgroundColor, borderColor: block.borderColor, borderStyle: 'dashed', borderWidth: '2px', borderRadius: '12px' }} className="p-8 relative overflow-visible">
                    {/* Badge */}
                    <div style={{ backgroundColor: block.badgeColor || '#F59E0B' }} className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-sm flex items-center gap-2 whitespace-nowrap">
                        {block.iconUrl && <img src={block.iconUrl} className="w-4 h-4 object-contain brightness-0 invert" />}
                        {block.discount}
                    </div>

                    {/* Code Box */}
                    <div className="border-2 rounded-xl py-4 px-8 mb-4 bg-white" style={{ borderColor: block.borderColor }}>
                        <div className="text-3xl font-bold font-mono tracking-[0.2em]" style={{ color: block.codeColor }}>{block.code}</div>
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-600 mb-1">{block.description}</div>
                    {block.expirationDate && <div className="text-xs text-gray-400">Hạn sử dụng: {block.expirationDate}</div>}
                </div>
            </div>
        );

        case 'order-summary': return (
            <div className="py-4 px-4">
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: block.backgroundColor, borderColor: block.borderColor, borderWidth: '1px', borderStyle: 'solid' }}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        {block.iconUrl && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: block.iconBackgroundColor || '#10B981' }}>
                                <img src={block.iconUrl} className="w-4 h-4 object-contain brightness-0 invert" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div style={{
                                textAlign: block.titleAlignment,
                                fontFamily: block.fontFamily,
                                fontSize: `${block.titleFontSize || 18}px`,
                                fontWeight: block.titleFontWeight === 'bold' ? 'bold' : 'normal',
                                fontStyle: block.titleFontStyle || 'normal',
                                color: block.titleColor
                            }}>
                                {block.title}
                            </div>
                        </div>
                    </div>

                    {/* Order ID */}
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                        {block.orderId}
                    </div>

                    {/* Items List (Simplified for summary view as per mockup focus) */}
                    <div className="p-5 space-y-3">
                        {block.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2 transition-colors">
                                <span className="text-gray-600"><span className="text-gray-400 mr-2">{item.qty}x</span>{item.name}</span>
                                <span className="font-medium text-gray-800">{item.price}</span>
                            </div>
                        ))}

                        {/* Cost Breakdown */}
                        <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tạm tính</span>
                                <span>{block.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Phí vận chuyển</span>
                                <span>{block.shippingFee}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 mt-2 border-t border-gray-100" style={{ color: block.totalColor || '#1f2937' }}>
                                <span>Tổng cộng</span>
                                <span>{block.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Address (Optional keep) */}
                    {block.shippingAddress && (
                        <div className="p-4 bg-gray-50/50 text-xs text-gray-500 border-t border-gray-100 flex items-start gap-2">
                            <MapPin size={14} className="mt-0.5 text-gray-400" />
                            <span>{block.shippingLabel || 'Ship to'}: {block.shippingAddress}</span>
                        </div>
                    )}
                </div>
            </div>
        );





        default: return <div className="p-4 bg-red-50 text-red-500">Unknown</div>;
    }
};

const SortableBlock: React.FC<{ block: EmailBlock; index: number; total: number; isSelected: boolean; onSelect: () => void; onSelectId?: (id: string) => void; onDelete: () => void; onUpdate: (b: EmailBlock) => void; onMoveUp: () => void; onMoveDown: () => void; onDuplicate: () => void; isDragOver: boolean }> = ({ block, index, total, isSelected, onSelect, onSelectId, onDelete, onUpdate, onMoveUp, onMoveDown, onDuplicate, isDragOver }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });



    const handleSelect = (id?: string) => {
        if (id && onSelectId) {
            onSelectId(id);
        } else {
            onSelect();
        }
    };

    return (
        <>
            <DropIndicator show={isDragOver && index === 0} />
            <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.2 : 1 }} className={`relative group ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                {isSelected && <FloatingToolbar onMoveUp={onMoveUp} onMoveDown={onMoveDown} onDuplicate={onDuplicate} onDelete={onDelete} dragListeners={listeners} dragAttributes={attributes} canMoveUp={index > 0} canMoveDown={index < total - 1} />}
                <div className={`rounded-lg transition-colors ${isSelected ? 'bg-gray-50' : 'bg-white'}`}>
                    <BlockRenderer block={block} isSelected={isSelected} onSelect={handleSelect} onUpdate={onUpdate} />
                </div>
            </div>
            <DropIndicator show={isDragOver && index > 0} />
        </>
    );
};

// =============================================
// GENERAL SETTINGS PANEL
// =============================================
const GeneralSettingsPanel: React.FC<{ settings: EmailDocument['settings']; onUpdate: (s: EmailDocument['settings']) => void }> = ({ settings, onUpdate }) => {
    const [padding, setPadding] = useState({ top: 40, right: 20, bottom: 40, left: 20 });
    const [margin, setMargin] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const [spacing, setSpacing] = useState(16);
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Settings size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-800 text-sm">Cài đặt chung</span>
            </div>
            {/* Email Width */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Email Width</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input type="number" value={settings.contentWidth} onChange={(e) => onUpdate({ ...settings, contentWidth: +e.target.value })} className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[600, 700].map((w) => <button key={w} onClick={() => onUpdate({ ...settings, contentWidth: w })} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${settings.contentWidth === w ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{w}</button>)}
                </div>
            </div>
            {/* Alignment */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Alignment</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['left', 'center', 'right'] as const).map((a) => <button key={a} onClick={() => setAlignment(a)} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${alignment === a ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{a === 'left' && <AlignLeft size={16} />}{a === 'center' && <AlignCenter size={16} />}{a === 'right' && <AlignRight size={16} />}</button>)}
                </div>
            </div>
            {/* Spacing */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Spacing</label>
                <div className="flex gap-2">
                    {[0, 8, 16, 24].map((s) => <button key={s} onClick={() => setSpacing(s)} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${spacing === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>)}
                </div>
            </div>
            {/* Background Color */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Background</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-300 relative shrink-0"><input type="color" value={settings.backgroundColor} onChange={(e) => onUpdate({ ...settings, backgroundColor: e.target.value })} className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" /></div>
                    <input type="text" value={settings.backgroundColor} onChange={(e) => onUpdate({ ...settings, backgroundColor: e.target.value })} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700" />
                </div>
            </div>
            {/* Padding */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Padding</label>
                <div className="relative bg-green-50 rounded-xl p-4">
                    <div className="flex justify-center mb-1"><input type="number" value={padding.top} onChange={(e) => setPadding({ ...padding, top: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex items-center justify-between"><input type="number" value={padding.left} onChange={(e) => setPadding({ ...padding, left: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /><div className="w-16 h-10 bg-white/80 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"><span className="text-[10px] text-gray-400">Content</span></div><input type="number" value={padding.right} onChange={(e) => setPadding({ ...padding, right: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex justify-center mt-1"><input type="number" value={padding.bottom} onChange={(e) => setPadding({ ...padding, bottom: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                </div>
            </div>
            {/* Margin */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Margin</label>
                <div className="relative bg-orange-50 rounded-xl p-4">
                    <div className="flex justify-center mb-1"><input type="number" value={margin.top} onChange={(e) => setMargin({ ...margin, top: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex items-center justify-between"><input type="number" value={margin.left} onChange={(e) => setMargin({ ...margin, left: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /><div className="w-16 h-10 bg-white/80 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"><span className="text-[10px] text-gray-400">Content</span></div><input type="number" value={margin.right} onChange={(e) => setMargin({ ...margin, right: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex justify-center mt-1"><input type="number" value={margin.bottom} onChange={(e) => setMargin({ ...margin, bottom: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// RIGHT SIDEBAR
// =============================================
type RightTabType = 'settings' | 'element';

const PropertiesPanel: React.FC<{ block: EmailBlock | null; onUpdate: (b: EmailBlock) => void; onInsertTag: (t: string) => void; docSettings: EmailDocument['settings']; onUpdateSettings: (s: EmailDocument['settings']) => void }> = ({ block, onUpdate, onInsertTag, docSettings, onUpdateSettings }) => {
    const [tab, setTab] = useState<RightTabType>('element');
    const [blockStyle, setBlockStyle] = useState<StyleState>({ borderWidth: 0, borderStyle: 'solid', borderColor: '#e5e7eb', borderRadius: 8, boxShadow: 'none', hideDesktop: false, hideMobile: false, hideTablet: false });

    const AlignBtns = ({ val, onChange }: { val: string; onChange: (v: 'left' | 'center' | 'right') => void }) => (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">{(['left', 'center', 'right'] as const).map((a) => <button key={a} onClick={() => onChange(a)} className={`p-2 rounded-md ${val === a ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{a === 'left' ? <AlignLeft size={16} /> : a === 'center' ? <AlignCenter size={16} /> : <AlignRight size={16} />}</button>)}</div>
    );

    const renderElementContent = () => {
        if (!block) return <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><MousePointerClick size={32} className="mx-auto mb-3 opacity-50" /><p className="text-sm">Chọn một block</p></div></div>;
        switch (block.type) {
            case 'heading': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nội dung</label><input type="text" value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Cấp độ</label><div className="flex gap-2">{(['h1', 'h2', 'h3'] as const).map((l) => <button key={l} onClick={() => onUpdate({ ...block, level: l })} className={`flex-1 p-2 rounded-lg border text-sm ${block.level === l ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>{l.toUpperCase()}</button>)}</div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Màu</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.color} onChange={(e) => onUpdate({ ...block, color: e.target.value })} /></div><span className="text-xs font-mono">{block.color}</span></div></div></div>);
            case 'text': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nội dung</label><textarea value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-28 resize-none" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Merge Tags</label><div className="flex flex-wrap gap-1.5">{MERGE_TAGS.map((t) => <button key={t.value} onClick={() => onInsertTag(t.value)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">{t.label}</button>)}</div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div></div>);
            case 'button': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Label</label><input type="text" value={block.label} onChange={(e) => onUpdate({ ...block, label: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">URL</label><input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-medium text-gray-500 mb-1 block">Nền</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-6 h-6 rounded-md overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div></div></div><div><label className="text-xs font-medium text-gray-500 mb-1 block">Chữ</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-6 h-6 rounded-md overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.textColor} onChange={(e) => onUpdate({ ...block, textColor: e.target.value })} /></div></div></div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Bo góc: {block.borderRadius}px</label><input type="range" min="0" max="24" value={block.borderRadius} onChange={(e) => onUpdate({ ...block, borderRadius: +e.target.value })} className="w-full accent-blue-600" /></div></div>);
            case 'spacer': return <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Chiều cao: {block.height}px</label><input type="range" min="8" max="120" value={block.height} onChange={(e) => onUpdate({ ...block, height: +e.target.value })} className="w-full accent-blue-600" /></div>;
            case 'divider': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Kiểu</label><div className="flex gap-2">{(['solid', 'dashed', 'dotted'] as const).map((s) => <button key={s} onClick={() => onUpdate({ ...block, style: s })} className={`flex-1 p-2 rounded-lg border text-xs ${block.style === s ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>{s}</button>)}</div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Màu</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.color} onChange={(e) => onUpdate({ ...block, color: e.target.value })} /></div></div></div></div>);
            case 'image': const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onUpdate({ ...block, src: ev.target?.result as string }); r.readAsDataURL(f); }; return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Hình ảnh</label><div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 relative"><input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><Upload size={20} className="mx-auto text-gray-400 mb-2" /><span className="text-xs text-gray-500">Upload</span></div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Alt</label><input type="text" value={block.alt} onChange={(e) => onUpdate({ ...block, alt: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Kích thước</label><div className="flex gap-2">{(['small', 'medium', 'full'] as const).map((w) => <button key={w} onClick={() => onUpdate({ ...block, width: w })} className={`flex-1 p-2 rounded-lg border text-xs ${block.width === w ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>{w}</button>)}</div></div></div>);
            case 'link': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Text</label><input type="text" value={block.text} onChange={(e) => onUpdate({ ...block, text: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">URL</label><input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Màu</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.color} onChange={(e) => onUpdate({ ...block, color: e.target.value })} /></div><span className="text-xs font-mono">{block.color}</span></div></div></div>);
            case 'row2': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Rows size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">2 Rows</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Row 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Row 2: {block.children[1].length} elements</div></div>);
            case 'row3': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Rows size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">3 Rows</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Row 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Row 2: {block.children[1].length} elements</div><div className="text-xs text-gray-400">Row 3: {block.children[2].length} elements</div></div>);
            case 'column2': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Columns size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">2 Columns</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Column 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Column 2: {block.children[1].length} elements</div></div>);
            case 'column3': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Columns size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">3 Columns</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Column 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Column 2: {block.children[1].length} elements</div><div className="text-xs text-gray-400">Column 3: {block.children[2].length} elements</div></div>);
            case 'html': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Code size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">Custom HTML</span></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">HTML Code</label><textarea value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-900 text-green-400 border border-gray-700 rounded-xl text-sm font-mono h-40 resize-none" placeholder="<div>Your HTML here...</div>" /></div><p className="text-xs text-gray-400">⚠️ Chú ý: HTML tùy chỉnh có thể ảnh hưởng đến hiển thị email.</p></div>);
            case 'video': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Video URL</label><input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="https://youtube.com/..." /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Thumbnail URL</label><input type="text" value={block.thumbnail || ''} onChange={(e) => onUpdate({ ...block, thumbnail: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="https://..." /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div></div>);
            case 'header': return (
                <div className="space-y-4">
                    {/* Layout */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Layout</label>
                        <div className="flex gap-2">
                            {(['inline', 'stacked'] as const).map((l) => (
                                <button key={l} onClick={() => onUpdate({ ...block, layout: l })} className={`flex-1 p-2 rounded-lg border text-xs capitalize ${block.layout === l ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                            ))}
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between"><div className="text-xs font-semibold text-gray-800">Branding</div><div className="w-full h-px bg-gray-100 ml-3"></div></div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Logo & Brand Name</label>
                            <input type="text" value={block.logoSrc} onChange={(e) => onUpdate({ ...block, logoSrc: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-2" placeholder="Logo URL (optional)" />
                            <input type="text" value={block.companyName} onChange={(e) => onUpdate({ ...block, companyName: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-2" placeholder="Company Name" />
                            <input type="text" value={block.tagline} onChange={(e) => onUpdate({ ...block, tagline: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Tagline" />
                        </div>
                        {/* Colors for Branding */}
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] text-gray-400 mb-1 block">Brand Color</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-4 h-4 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors.companyName} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, companyName: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors.companyName}</span></div></div>
                            <div><label className="text-[10px] text-gray-400 mb-1 block">Tagline Color</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-4 h-4 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors.tagline} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, tagline: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors.tagline}</span></div></div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => onUpdate({ ...block, showMenu: !block.showMenu })}><div className="text-xs font-semibold text-gray-800 flex items-center gap-2">{block.showMenu ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />} Navigation Menu</div><div className="w-16 h-px bg-gray-100 ml-3"></div></div>

                        {block.showMenu && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    {block.navLinks.map((l, i) => (
                                        <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg relative group transition-all hover:shadow-sm">
                                            <button
                                                onClick={() => { const n = [...block.navLinks]; n.splice(i, 1); onUpdate({ ...block, navLinks: n }); }}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                                                title="Remove Link"
                                            >
                                                <X size={14} />
                                            </button>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Navigation Label</label>
                                                    <input
                                                        type="text"
                                                        value={l.text}
                                                        onChange={(e) => { const n = [...block.navLinks]; n[i].text = e.target.value; onUpdate({ ...block, navLinks: n }); }}
                                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
                                                        placeholder="Ex: Home"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Destination URL</label>
                                                    <input
                                                        type="text"
                                                        value={l.url}
                                                        onChange={(e) => { const n = [...block.navLinks]; n[i].url = e.target.value; onUpdate({ ...block, navLinks: n }); }}
                                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => onUpdate({ ...block, navLinks: [...block.navLinks, { text: 'New Link', url: '#' }] })} className="w-full py-2.5 bg-white text-blue-600 rounded-lg text-xs font-bold border border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <Plus size={14} /> Add Menu Link
                                    </button>
                                </div>
                                {/* Menu Color */}
                                <div><label className="text-[10px] text-gray-400 mb-1 block">Menu Text Color</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-4 h-4 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors.menu} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, menu: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors.menu}</span></div></div>
                            </div>
                        )}
                    </div>

                    {/* Background */}
                    <div className="pt-3 border-t border-gray-100">
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nền Header</label>
                        <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl">
                            <div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.colors.background} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, background: e.target.value } })} /></div>
                            <span className="text-xs font-mono text-gray-600">{block.colors.background}</span>
                        </div>
                    </div>
                </div>
            );
            case 'footer': return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider">Footer Settings</h4><div className="p-1.5 bg-gray-100 rounded-md"><Settings size={14} className="text-gray-500" /></div></div>

                    {/* Logo */}

                    {/* Logo */}
                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Logo Công Ty</label>
                        <div className="gap-2 space-y-2">
                            <input type="text" value={block.logoUrl || ''} onChange={(e) => onUpdate({ ...block, logoUrl: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="https://..." />
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                onUpdate({ ...block, logoUrl: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <button className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                    <Upload size={14} /> Upload Logo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Tên Công Ty</label>
                            <input type="text" value={block.companyName || ''} onChange={(e) => onUpdate({ ...block, companyName: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Your Brand" />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Email</label>
                            <input type="text" value={block.companyEmail || ''} onChange={(e) => onUpdate({ ...block, companyEmail: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="contact@..." />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Địa chỉ</label>
                        <textarea value={block.address} onChange={(e) => onUpdate({ ...block, address: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-16 resize-none" placeholder="123 Street..." />
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Điện Thoại</label>
                        <input type="text" value={block.phone || ''} onChange={(e) => onUpdate({ ...block, phone: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="(555) 000-0000" />
                    </div>

                    {/* Social Media Section */}
                    <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] text-gray-400 block uppercase font-bold">Mạng xã hội</label>
                            <button onClick={() => onUpdate({ ...block, socialLinks: [...block.socialLinks, { name: 'Social', url: '#' }] })} className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1 hover:bg-blue-700"><Plus size={10} /> Thêm</button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Kiểu Icon</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={block.socialIconStyle || 'circle'} onChange={(e) => onUpdate({ ...block, socialIconStyle: e.target.value as any })}>
                                    <option value="circle">Tròn</option>
                                    <option value="items-center">Vuông</option>
                                    <option value="rounded">Bo góc</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Kích thước</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={block.socialIconSize || 'medium'} onChange={(e) => onUpdate({ ...block, socialIconSize: e.target.value as any })}>
                                    <option value="small">Nhỏ</option>
                                    <option value="medium">Vừa</option>
                                    <option value="large">Lớn</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {block.socialLinks.map((s, i) => (
                                <div key={i} className="p-2 bg-gray-50 border border-gray-200 rounded-lg group">
                                    <div className="flex items-center justify-between mb-2">
                                        <select className="bg-transparent text-xs font-semibold text-gray-700 outline-none" value={s.name} onChange={(e) => { const n = [...block.socialLinks]; n[i].name = e.target.value; onUpdate({ ...block, socialLinks: n }); }}>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Twitter">Twitter</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="YouTube">YouTube</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="Website">Website</option>
                                        </select>
                                        <button onClick={() => { const n = [...block.socialLinks]; n.splice(i, 1); onUpdate({ ...block, socialLinks: n }); }} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                    </div>
                                    <input type="text" value={s.url} onChange={(e) => { const n = [...block.socialLinks]; n[i].url = e.target.value; onUpdate({ ...block, socialLinks: n }); }} className="w-full p-1.5 bg-white border border-gray-200 rounded text-[10px] mb-1.5" placeholder="Profile URL" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                        <div>
                            <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Copyright</label>
                            <input type="text" value={block.copyrightText || ''} onChange={(e) => onUpdate({ ...block, copyrightText: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Privacy URL</label><input type="text" value={block.privacyUrl || ''} onChange={(e) => onUpdate({ ...block, privacyUrl: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="/privacy" /></div>
                            <div><label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Terms URL</label><input type="text" value={block.termsUrl || ''} onChange={(e) => onUpdate({ ...block, termsUrl: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="/terms" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Unsubscribe Text</label><input type="text" value={block.unsubscribeText || ''} onChange={(e) => onUpdate({ ...block, unsubscribeText: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Unsubscribe" /></div>
                            <div><label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Unsubscribe URL</label><input type="text" value={block.unsubscribeUrl || ''} onChange={(e) => onUpdate({ ...block, unsubscribeUrl: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="/unsubscribe" /></div>
                        </div>
                    </div>
                </div>
            );
            case 'product': return (
                <div className="space-y-4">
                    {/* Basic Info */}
                    <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Tên sản phẩm</label><textarea value={block.title} onChange={(e) => onUpdate({ ...block, title: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-16" /></div>
                    <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Mô tả</label><textarea value={block.description} onChange={(e) => onUpdate({ ...block, description: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20" /></div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-gray-400 mb-1 block">Giá</label><input type="text" value={block.price} onChange={(e) => onUpdate({ ...block, price: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
                        <div><label className="text-[10px] text-gray-400 mb-1 block">Giá gốc</label><input type="text" value={block.originalPrice || ''} onChange={(e) => onUpdate({ ...block, originalPrice: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500" placeholder="$129" /></div>
                    </div>

                    {/* Image */}
                    <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Hình ảnh</label><input type="text" value={block.productImage} onChange={(e) => onUpdate({ ...block, productImage: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="https://..." /></div>

                    {/* Ratings & Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">Đánh giá (Stars)</label>
                            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={block.rating || 5} onChange={(e) => onUpdate({ ...block, rating: Number(e.target.value) })}>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                            </select>
                        </div>
                        <div><label className="text-[10px] text-gray-400 mb-1 block">Số đánh giá</label><input type="number" value={block.reviewCount || 0} onChange={(e) => onUpdate({ ...block, reviewCount: Number(e.target.value) })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
                    </div>

                    {/* Badge & Discount */}
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-gray-400 mb-1 block">Badge</label><input type="text" value={block.badge || ''} onChange={(e) => onUpdate({ ...block, badge: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Best Seller" /></div>
                        <div><label className="text-[10px] text-gray-400 mb-1 block">Giảm giá %</label><input type="text" value={block.discount || ''} onChange={(e) => onUpdate({ ...block, discount: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="20" /></div>
                    </div>

                    {/* Stock Status */}
                    <div onClick={() => onUpdate({ ...block, inStock: !block.inStock })} className="flex items-center gap-2 cursor-pointer p-2 border border-blue-100 bg-blue-50 rounded-lg">
                        {block.inStock ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-gray-400" />}
                        <span className="text-sm font-medium text-blue-800">Còn hàng</span>
                    </div>

                    {/* Button Details */}
                    <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2"><div className="text-xs font-semibold text-gray-800">Văn bản nút</div><div className="w-full h-px bg-gray-100 ml-3"></div></div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input type="text" value={block.buttonText} onChange={(e) => onUpdate({ ...block, buttonText: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Label" />
                            <input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="URL" />
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2"><div className="text-xs font-semibold text-gray-800">Cỡ chữ tên SP</div><div className="w-full h-px bg-gray-100 ml-3"></div></div>
                        <div className="flex gap-2">
                            {[18, 20, 22, 24, 28].map(s => (
                                <button key={s} onClick={() => onUpdate({ ...block, titleFontSize: s })} className={`flex-1 p-1.5 rounded-lg border text-xs font-medium ${block.titleFontSize === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between"><div className="text-xs font-semibold text-gray-800">Colors</div><div className="w-full h-px bg-gray-100 ml-3"></div></div>

                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] text-gray-400 mb-1 block">Nền</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div><span className="text-[10px] mono">{block.backgroundColor}</span></div></div>
                            <div><label className="text-[10px] text-gray-400 mb-1 block">Chữ</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors?.text || '#1f2937'} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, text: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors?.text || '#1f2937'}</span></div></div>
                            <div><label className="text-[10px] text-gray-400 mb-1 block">Giá</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors?.price || '#1f2937'} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, price: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors?.price || '#1f2937'}</span></div></div>
                            <div><label className="text-[10px] text-gray-400 mb-1 block">Nút</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.buttonColor} onChange={(e) => onUpdate({ ...block, buttonColor: e.target.value })} /></div><span className="text-[10px] mono">{block.buttonColor}</span></div></div>

                            <div><label className="text-[10px] text-gray-400 mb-1 block">Badge</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors?.badge || '#ef4444'} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, badge: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors?.badge || '#ef4444'}</span></div></div>
                        </div>
                    </div>
                </div>
            );
            case 'unsubscribe': return (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Văn bản Link</label>
                        <input type="text" value={block.linkText} onChange={(e) => onUpdate({ ...block, linkText: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Link</label>
                        <input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-600" />
                        <div className="mt-1 text-[10px] text-blue-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-100 flex items-center justify-center font-bold">i</span> Sử dụng <code>{'{{UNSUBSCRIBE_URL}}'}</code> để tự động inject token</div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Mô tả</label>
                        <textarea value={block.text} onChange={(e) => onUpdate({ ...block, text: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20 text-gray-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Căn chỉnh</label>
                            <AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Cỡ chữ</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {[10, 11, 12, 13, 14].map(s => (
                                    <button key={s} onClick={() => onUpdate({ ...block, fontSize: s })} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${block.fontSize === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div><label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Chữ</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors?.text || '#6b7280'} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, text: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors?.text || '#6b7280'}</span></div></div>
                        <div><label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Link</label><div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded overflow-hidden relative border"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors?.link || '#3b82f6'} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, link: e.target.value } })} /></div><span className="text-[10px] mono">{block.colors?.link || '#3b82f6'}</span></div></div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Nền</label>
                        <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg">
                            <div className="w-6 h-6 rounded overflow-hidden relative border">
                                <input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.colors?.background || '#ffffff'} onChange={(e) => onUpdate({ ...block, colors: { ...block.colors, background: e.target.value } })} />
                            </div>
                            <span className="text-[10px] mono">{block.colors?.background || 'Transparent'}</span>
                            {block.colors?.background && <button onClick={() => onUpdate({ ...block, colors: { ...block.colors, background: undefined } })} className="ml-auto text-xs text-red-500 underline">Xóa</button>}
                        </div>
                    </div>
                </div>
            );

            case 'product-grid': return (
                <div className="space-y-6">
                    {/* --- Title Section --- */}
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><Layers size={14} /> Tiêu đề</div>
                        <input type="text" value={block.title} onChange={(e) => onUpdate({ ...block, title: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Sản phẩm nổi bật" />

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Số cột</label>
                            <select value={block.columns || 2} onChange={(e) => onUpdate({ ...block, columns: Number(e.target.value) as 2 | 3 })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                                <option value={2}>2 cột</option>
                                <option value={3}>3 cột</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-medium text-gray-500 block uppercase">Căn chỉnh tiêu đề</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {['left', 'center', 'right'].map((a) => (
                                    <button key={a} onClick={() => onUpdate({ ...block, titleAlignment: a as any })} className={`flex-1 py-1.5 rounded text-gray-500 hover:text-gray-900 ${block.titleAlignment === a ? 'bg-white shadow-sm text-blue-600' : ''}`}>
                                        {a === 'left' ? <AlignLeft size={16} /> : a === 'center' ? <AlignCenter size={16} /> : <AlignRight size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Font Family</label>
                                <select value={block.fontFamily || 'Arial'} onChange={(e) => onUpdate({ ...block, fontFamily: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                                    <option value="Arial">Arial</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Font Size</label>
                                <select value={block.titleFontSize || 20} onChange={(e) => onUpdate({ ...block, titleFontSize: Number(e.target.value) })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                                    {[16, 18, 20, 24, 28, 32].map(s => <option key={s} value={s}>{s}px</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Style</label>
                                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                    <button onClick={() => onUpdate({ ...block, titleFontWeight: block.titleFontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 py-1 rounded ${block.titleFontWeight === 'bold' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><Bold size={14} /></button>
                                    <button onClick={() => onUpdate({ ...block, titleFontStyle: block.titleFontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 py-1 rounded ${block.titleFontStyle === 'italic' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><Italic size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Màu chữ</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.titleColors?.text} onChange={(e) => onUpdate({ ...block, titleColors: { ...block.titleColors!, text: e.target.value } })} /></div><span className="text-[10px] mono">{block.titleColors?.text}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Nền Icon/Tiêu đề</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.titleColors?.background || '#ffffff'} onChange={(e) => onUpdate({ ...block, titleColors: { ...block.titleColors!, background: e.target.value } })} /></div><span className="text-[10px] mono">{block.titleColors?.background}</span></div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Icon URL</label>
                            <input type="text" value={block.titleIcon || ''} onChange={(e) => onUpdate({ ...block, titleIcon: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="https://..." />
                        </div>
                    </div>

                    {/* --- Card Settings --- */}
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><LayoutGrid size={14} /> Cài đặt Card</div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Nền Card</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.cardBackgroundColor} onChange={(e) => onUpdate({ ...block, cardBackgroundColor: e.target.value })} /></div><span className="text-[10px] mono">{block.cardBackgroundColor}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Viền Card</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.cardBorderColor} onChange={(e) => onUpdate({ ...block, cardBorderColor: e.target.value })} /></div><span className="text-[10px] mono">{block.cardBorderColor}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Tên SP</label>
                                <div className="w-full h-8 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.productNameColor} onChange={(e) => onUpdate({ ...block, productNameColor: e.target.value })} /></div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Giá</label>
                                <div className="w-full h-8 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.priceColor} onChange={(e) => onUpdate({ ...block, priceColor: e.target.value })} /></div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 mb-1 block uppercase font-bold">Giá Cũ</label>
                                <div className="w-full h-8 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.oldPriceColor} onChange={(e) => onUpdate({ ...block, oldPriceColor: e.target.value })} /></div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Độ Dày Viền</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {[0, 1, 2, 3].map(w => (
                                    <button key={w} onClick={() => onUpdate({ ...block, cardBorderWidth: w })} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${block.cardBorderWidth === w ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500'}`}>{w}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Bo góc Card</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {[0, 8, 12, 16, 24].map(r => (
                                    <button key={r} onClick={() => onUpdate({ ...block, cardBorderRadius: r })} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${block.cardBorderRadius === r ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500'}`}>{r}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Padding Card</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {[0, 4, 8, 12, 16].map(r => (
                                    <button key={r} onClick={() => onUpdate({ ...block, cardPadding: r })} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${block.cardPadding === r ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500'}`}>{r}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- Image Settings --- */}
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><ImageIcon size={14} /> Cài đặt Hình ảnh</div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Kiểu hình</label>
                                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                    <button onClick={() => onUpdate({ ...block, imageShape: 'rectangle' })} className={`flex-1 py-1 rounded text-xs font-medium ${block.imageShape === 'rectangle' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Chữ nhật</button>
                                    <button onClick={() => onUpdate({ ...block, imageShape: 'circle' })} className={`flex-1 py-1 rounded text-xs font-medium ${block.imageShape === 'circle' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Tròn</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Chiều cao ảnh</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {[100, 120, 140, 160, 180].map(h => (
                                    <button key={h} onClick={() => onUpdate({ ...block, imageHeight: h })} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${block.imageHeight === h ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500'}`}>{h}</button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Bo góc hình ảnh</label>
                            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {[0, 8, 12, 16].map(r => (
                                    <button key={r} onClick={() => onUpdate({ ...block, imageBorderRadius: r })} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${block.imageBorderRadius === r ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500'}`}>{r}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- Product List --- */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-gray-600 uppercase">Sản phẩm ({block.products.length})</div>
                            <button onClick={() => onUpdate({ ...block, products: [...block.products, { id: Date.now().toString(), image: '', title: 'Sản phẩm mới', price: '0đ', originalPrice: '', url: '#' }] })} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1">+ Thêm</button>
                        </div>
                        {block.products.map((p, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative group">
                                <button onClick={() => { const np = [...block.products]; np.splice(i, 1); onUpdate({ ...block, products: np }); }} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                <div className="text-xs font-bold text-gray-700 mb-2">Sản phẩm {i + 1}</div>
                                <div className="space-y-2">
                                    <input type="text" value={p.title} onChange={(e) => { const np = [...block.products]; np[i].title = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Tên sản phẩm" />
                                    <div className="flex gap-2">
                                        <input type="text" value={p.price} onChange={(e) => { const np = [...block.products]; np[i].price = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Giá" />
                                        <input type="text" value={p.originalPrice || ''} onChange={(e) => { const np = [...block.products]; np[i].originalPrice = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Giá cũ" />
                                    </div>
                                    <input type="text" value={p.image} onChange={(e) => { const np = [...block.products]; np[i].image = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Image URL (https://...)" />
                                    <input type="text" value={p.url} onChange={(e) => { const np = [...block.products]; np[i].url = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Link (#)" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'coupon': return (
                <div className="space-y-4">
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><Ticket size={14} /> Mã giảm giá</div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">MÃ COUPON</label>
                            <input type="text" value={block.code} onChange={(e) => onUpdate({ ...block, code: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="SAVE20" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Badge</label>
                                <input type="text" value={block.discount} onChange={(e) => onUpdate({ ...block, discount: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="20% OFF" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Hạn sử dụng</label>
                                <input type="text" value={block.expirationDate || ''} onChange={(e) => onUpdate({ ...block, expirationDate: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Dec 31, 2025" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">Điều kiện</label>
                            <input type="text" value={block.description} onChange={(e) => onUpdate({ ...block, description: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Use this code at checkout" />
                        </div>
                    </div>

                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><Palette size={14} /> Cài đặt Card Phẩm</div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Nền</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div><span className="text-[10px] mono">{block.backgroundColor}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Viền</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.borderColor} onChange={(e) => onUpdate({ ...block, borderColor: e.target.value })} /></div><span className="text-[10px] mono">{block.borderColor}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Màu Mã</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.codeColor || '#D97706'} onChange={(e) => onUpdate({ ...block, codeColor: e.target.value })} /></div><span className="text-[10px] mono">{block.codeColor}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Nền Icon</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.badgeColor || '#F59E0B'} onChange={(e) => onUpdate({ ...block, badgeColor: e.target.value })} /></div><span className="text-[10px] mono">{block.badgeColor}</span></div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">URL Icon</label>
                        <input type="text" value={block.iconUrl || ''} onChange={(e) => onUpdate({ ...block, iconUrl: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="https://img.icons8.com/..." />
                        <div className="mt-1 text-[10px] text-gray-400">ĐIcon hiển thị trên badge</div>
                    </div>
                </div>
            );

            case 'order-summary': return (
                <div className="space-y-4">
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><Receipt size={14} /> Tổng đơn hàng</div>

                        {/* Title & Order ID */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">TIÊU ĐỀ</label>
                            <input type="text" value={block.title} onChange={(e) => onUpdate({ ...block, title: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-2" placeholder="Tổng đơn hàng" />
                            <input type="text" value={block.orderId} onChange={(e) => onUpdate({ ...block, orderId: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Đơn hàng #12345" />
                        </div>

                        {/* Items Management */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-xs font-medium text-gray-500 uppercase">SẢN PHẨM</label>
                                <button onClick={() => onUpdate({ ...block, items: [...block.items, { name: 'New Item', qty: 1, price: '$0' }] })} className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"><Plus size={12} /> Thêm</button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {block.items.map((item, i) => (
                                    <div key={i} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1 group">
                                        <div className="flex gap-2">
                                            <input type="text" value={item.name} onChange={(e) => { const newItems = [...block.items]; newItems[i].name = e.target.value; onUpdate({ ...block, items: newItems }); }} className="flex-1 p-1 bg-white border border-gray-200 rounded" placeholder="Name" />
                                            <input type="number" value={item.qty} onChange={(e) => { const newItems = [...block.items]; newItems[i].qty = +e.target.value; onUpdate({ ...block, items: newItems }); }} className="w-10 p-1 bg-white border border-gray-200 rounded text-center" />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" value={item.price} onChange={(e) => { const newItems = [...block.items]; newItems[i].price = e.target.value; onUpdate({ ...block, items: newItems }); }} className="flex-1 p-1 bg-white border border-gray-200 rounded text-right" placeholder="Price" />
                                            <button onClick={() => { const newItems = block.items.filter((_, idx) => idx !== i); onUpdate({ ...block, items: newItems }); }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Costs */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="w-20 text-xs text-gray-500">Tạm tính</label>
                                <input type="text" value={block.subtotal} onChange={(e) => onUpdate({ ...block, subtotal: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-20 text-xs text-gray-500">Phí ship</label>
                                <input type="text" value={block.shippingFee} onChange={(e) => onUpdate({ ...block, shippingFee: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-20 text-xs font-bold text-gray-700">Tổng cộng</label>
                                <input type="text" value={block.total} onChange={(e) => onUpdate({ ...block, total: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right font-bold" />
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-2 pt-2 mt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <label className="w-20 text-xs text-gray-500">Label Ship</label>
                                <input type="text" value={block.shippingLabel || 'Ship to'} onChange={(e) => onUpdate({ ...block, shippingLabel: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Ship to" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-20 text-xs text-gray-500">Địa chỉ</label>
                                <input type="text" value={block.shippingAddress} onChange={(e) => onUpdate({ ...block, shippingAddress: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="123 Main St..." />
                            </div>
                        </div>
                    </div>

                    {/* Styling */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-600 uppercase"><Palette size={14} /> Căn chỉnh Tiêu đề</div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['left', 'center', 'right'].map((align) => (
                                <button key={align} onClick={() => onUpdate({ ...block, titleAlignment: align as any })} className={`flex-1 p-1.5 rounded-md flex justify-center ${block.titleAlignment === align ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                                    {align === 'left' && <AlignLeft size={16} />}
                                    {align === 'center' && <AlignCenter size={16} />}
                                    {align === 'right' && <AlignRight size={16} />}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Cỡ chữ tiêu đề</label>
                                <div className="flex gap-1">
                                    {[16, 18, 20, 24].map((size) => (
                                        <button key={size} onClick={() => onUpdate({ ...block, titleFontSize: size })} className={`flex-1 py-1 rounded text-xs font-medium border ${block.titleFontSize === size ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{size}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Kiểu chữ</label>
                                <div className="flex gap-1">
                                    <button onClick={() => onUpdate({ ...block, titleFontWeight: block.titleFontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 py-1 rounded border flex items-center justify-center ${block.titleFontWeight === 'bold' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}><Bold size={14} /></button>
                                    <button onClick={() => onUpdate({ ...block, titleFontStyle: block.titleFontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 py-1 rounded border flex items-center justify-center ${block.titleFontStyle === 'italic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}><Italic size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Font Chữ</label>
                            <select value={block.fontFamily} onChange={(e) => onUpdate({ ...block, fontFamily: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                <option value="Arial">Arial</option>
                                <option value="Helvetica">Helvetica</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Courier New">Courier New</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Nền</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div><span className="text-[10px] mono">{block.backgroundColor}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Tiêu đề</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.titleColor || '#1F2937'} onChange={(e) => onUpdate({ ...block, titleColor: e.target.value })} /></div><span className="text-[10px] mono">{block.titleColor}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Tổng tiền</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.totalColor || '#2563EB'} onChange={(e) => onUpdate({ ...block, totalColor: e.target.value })} /></div><span className="text-[10px] mono">{block.totalColor}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Viền</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.borderColor || '#E5E7EB'} onChange={(e) => onUpdate({ ...block, borderColor: e.target.value })} /></div><span className="text-[10px] mono">{block.borderColor}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase">Nền Icon</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg"><div className="w-6 h-6 rounded border relative overflow-hidden"><input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer" value={block.iconBackgroundColor || '#10B981'} onChange={(e) => onUpdate({ ...block, iconBackgroundColor: e.target.value })} /></div><span className="text-[10px] mono">{block.iconBackgroundColor}</span></div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase">URL Icon</label>
                            <input type="text" value={block.iconUrl || ''} onChange={(e) => onUpdate({ ...block, iconUrl: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="https://img.icons8.com/..." />
                        </div>
                    </div>
                </div>
            );




            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-gray-200 mb-4">
                <button onClick={() => setTab('element')} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${tab === 'element' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}><Layers size={14} />Element</button>
                <button onClick={() => setTab('settings')} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${tab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}><Settings size={14} />Cài đặt</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tab === 'settings' && <GeneralSettingsPanel settings={docSettings} onUpdate={onUpdateSettings} />}
                {tab === 'element' && (
                    <div className="space-y-6">
                        {/* Element Properties */}
                        {renderElementContent()}
                        {/* Divider */}
                        {block && <hr className="border-gray-200 my-4" />}
                        {/* Border & Shadow */}
                        {block && <BorderShadowSettings style={blockStyle} onChange={setBlockStyle} />}
                        {/* Divider */}
                        {block && <hr className="border-gray-200 my-4" />}
                        {/* Visibility */}
                        {block && <VisibilitySettings style={blockStyle} onChange={setBlockStyle} />}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================
// TOP CONTROL BAR
// =============================================
const TopControlBar: React.FC<{
    device: 'desktop' | 'mobile';
    onDeviceChange: (d: 'desktop' | 'mobile') => void;
    onSave: () => void;
    onImport: () => void;
    onPreview: () => void;
    onToggleStructureMap: () => void;
}> = ({ device, onDeviceChange, onSave, onImport, onPreview, onToggleStructureMap }) => {
    return (
        <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 mb-0">
            {/* Device Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => onDeviceChange('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${device === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Monitor size={14} /> Desktop
                </button>
                <button
                    onClick={() => onDeviceChange('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${device === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Smartphone size={14} /> Mobile
                </button>
            </div>

            {/* Structure Map Toggle */}
            <button
                onClick={onToggleStructureMap}
                className="flex items-center gap-1.5 px-3 py-1.5 ml-2 mr-auto text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all"
                title="Bản Đồ Cấu Trúc"
            >
                <Network size={16} />
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                >
                    <Save size={14} /> Lưu
                </button>
                <div className="h-5 w-px bg-gray-200" />
                <button
                    onClick={onImport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
                >
                    <Upload size={14} /> Nhập
                </button>
                <button
                    onClick={onPreview}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                >
                    <Eye size={14} /> Xem trước
                </button>
            </div>
        </div>
    );
};

// =============================================
// IMPORT MODAL
// =============================================
const ImportJsonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (json: string) => void;
}> = ({ isOpen, onClose, onImport }) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setJsonText('');
            setError(null);
        }
    }, [isOpen]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setJsonText(ev.target?.result as string);
            setError(null);
        };
        reader.readAsText(file);
    };

    const handleConfirm = () => {
        if (!jsonText.trim()) {
            setError('Vui lòng nhập nội dung JSON');
            return;
        }
        onImport(jsonText);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Nhập Thiết Kế (JSON)</h3>
                            <p className="text-xs text-gray-500">Dán mã JSON hoặc tải file lên bên dưới</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nội dung JSON</label>
                        <div className="relative">
                            <textarea
                                value={jsonText}
                                onChange={(e) => { setJsonText(e.target.value); setError(null); }}
                                className="w-full h-64 p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
                                placeholder={`Paste your JSON here, e.g.:\n{\n  "version": "1.0",\n  "elements": [...],\n  "globalSettings": {...}\n}`}
                            />
                            {error && (
                                <div className="absolute bottom-4 right-4 bg-red-50 text-red-600 text-xs py-1 px-3 rounded-full font-medium border border-red-100 animate-pulse">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                    <div>
                        <input
                            type="file"
                            accept=".json"
                            id="import-json-file"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <label
                            htmlFor="import-json-file"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
                        >
                            <Upload size={16} /> Tải file lên
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                        >
                            <Check size={16} /> Import Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// SUBCOMPONENTS: MODALS
// =============================================
const SendTestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSend: (email: string, subject: string) => Promise<void>;
    defaultSubject: string;
}> = ({ isOpen, onClose, onSend, defaultSubject }) => {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState(defaultSubject);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) setSubject(defaultSubject);
    }, [isOpen, defaultSubject]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!email) return;
        setIsSending(true);
        await onSend(email, subject);
        setIsSending(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-900/5 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                            <Send size={24} className="text-purple-600 -ml-1 mt-1" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Gửi Email Test</h3>
                            <p className="text-sm text-gray-500">Kiểm tra template trên email thật</p>
                        </div>
                        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 p-1">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email nhận *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-blue-50/50 border border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-medium"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tiêu đề Email</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 bg-blue-50/50 border border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-medium"
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!email || isSending}
                            className={`w-full mt-4 py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all ${!email || isSending ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/30'}`}
                        >
                            {isSending ? (
                                <>Đang gửi...</>
                            ) : (
                                <><Send size={18} /> Gửi Test Ngay</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// PREVIEW MODAL
// =============================================
const PreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    htmlContent: string;
    jsonContent: string;
    emailTitle: string;
    onSendTest: (email: string, subject: string) => Promise<void>;
}> = ({ isOpen, onClose, htmlContent, jsonContent, emailTitle, onSendTest }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'json'>('preview');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [showSendModal, setShowSendModal] = useState(false);

    const formatHtml = (html: string) => {
        let formatted = '';
        let pad = 0;
        html.split(/>\s*</).forEach(node => {
            if (node.match(/^\/\w/)) pad -= 1;
            formatted += new Array(pad * 4 + 1).join(' ') + '<' + node + '>\r\n';
            if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("input") && !node.startsWith("img") && !node.startsWith("br") && !node.startsWith("hr")) pad += 1;
        });
        return formatted.substring(1, formatted.length - 3);
    };

    const handleDownload = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[90vw] h-[85vh] shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-900/5">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setDevice('desktop')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${device === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Monitor size={16} /> Desktop
                            </button>
                            <button
                                onClick={() => setDevice('mobile')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${device === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Smartphone size={16} /> Mobile
                            </button>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSendModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                            <Send size={16} /> Gửi Test
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <SendTestModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                    defaultSubject={emailTitle}
                    onSend={onSendTest}
                />

                {/* Tabs */}
                <div className="h-12 border-b border-gray-200 flex items-center bg-white px-6 gap-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`h-full flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Eye size={16} /> Preview
                    </button>
                    <button
                        onClick={() => setActiveTab('html')}
                        className={`h-full flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'html' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Code size={16} /> HTML Code
                    </button>
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`h-full flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'json' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileJson size={16} /> JSON Data
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col relative">
                    {activeTab === 'preview' && (
                        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                            <div className={`transition-all duration-300 flex flex-col shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 ${device === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'}`}>
                                {/* Browser Bar */}
                                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        {device === 'mobile' ? <Smartphone size={16} className="text-gray-400" /> : <Monitor size={16} className="text-gray-400" />}
                                        <span className="text-xs font-medium text-gray-300">
                                            {device === 'mobile' ? 'Mobile Preview' : 'Desktop Preview'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    </div>
                                </div>

                                {/* Iframe */}
                                <div className="flex-1 bg-white min-h-[500px]">
                                    <iframe srcDoc={htmlContent} className="w-full h-full border-none block" title="Preview" />
                                </div>

                                {/* Footer Info */}
                                <div className="bg-gray-800 px-4 py-2 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1.5"><Monitor size={10} /> {device === 'mobile' ? '375px' : '900px'} viewport</span>
                                    <span className="flex items-center gap-1.5"><Mail size={10} /> Email Preview</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'html' && (
                        <div className="flex-1 overflow-hidden flex">
                            <div className="flex-1 relative group">
                                <textarea
                                    readOnly
                                    value={formatHtml(htmlContent)}
                                    className="w-full h-full p-6 font-mono text-sm bg-white text-gray-800 border border-gray-200 resize-none outline-none"
                                />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(formatHtml(htmlContent)); }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 border border-gray-200"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                    <button
                                        onClick={() => handleDownload(formatHtml(htmlContent), 'email-template.html', 'text/html')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Download size={14} /> Tải về
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'json' && (
                        <div className="flex-1 overflow-hidden flex">
                            <div className="flex-1 relative group">
                                <textarea
                                    readOnly
                                    value={jsonContent}
                                    className="w-full h-full p-6 font-mono text-sm bg-white text-gray-800 border border-gray-200 resize-none outline-none"
                                />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(jsonContent); }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 border border-gray-200"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                    <button
                                        onClick={() => handleDownload(jsonContent, 'email-data.json', 'application/json')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Download size={14} /> Tải về
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================
// STRUCTURE MAP MODAL
// =============================================
const StructureMapModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    blocks: EmailBlock[];
    onSelectBlock: (id: string) => void;
    selectedId: string | null;
}> = ({ isOpen, onClose, blocks, onSelectBlock, selectedId }) => {
    if (!isOpen) return null;

    // Helper to count blocks recursively
    const countBlocks = (list: EmailBlock[]): number => {
        let count = list.length;
        list.forEach(b => {
            if ((b as any).children) count += countBlocks((b as any).children);
        });
        return count;
    };

    // Helper to render tree
    const renderTree = (list: EmailBlock[], depth: number = 0) => {
        return list.map(b => (
            <div key={b.id}>
                <div
                    onClick={(e) => { e.stopPropagation(); onSelectBlock(b.id); }}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-1 transition-colors ${selectedId === b.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    <div className="text-gray-400">
                        {b.type === 'heading' && <Type size={14} />}
                        {b.type === 'text' && <Type size={14} />}
                        {b.type === 'image' && <ImageIcon size={14} />}
                        {b.type === 'button' && <MousePointerClick size={14} />}
                        {b.type === 'divider' && <Minus size={14} />}
                        {b.type === 'spacer' && <Maximize2 size={14} />}
                        {b.type === 'social' && <Share2 size={14} />}
                        {b.type === 'footer' && <LayoutTemplate size={14} />}
                        {b.type === 'product' && <ShoppingBag size={14} />}
                        {b.type === 'coupon' && <Ticket size={14} />}
                        {b.type === 'order-summary' && <Receipt size={14} />}
                        {(b.type === 'row2' || b.type === 'row3') && <Columns size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">
                            {b.type === 'heading' ? 'Tiêu đề' :
                                b.type === 'text' ? 'Văn bản' :
                                    b.type === 'button' ? 'Nút bấm' :
                                        b.type === 'image' ? 'Hình ảnh' :
                                            b.type === 'divider' ? 'Đường kẻ' :
                                                b.type === 'product' ? 'Sản phẩm' :
                                                    b.type === 'coupon' ? 'Coupon' :
                                                        b.type === 'order-summary' ? 'Order Summary' :
                                                            b.type.charAt(0).toUpperCase() + b.type.slice(1)}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                            {b.type === 'heading' && b.content}
                            {b.type === 'text' && b.content.substring(0, 30)}
                            {b.type === 'button' && b.label}
                            {b.type === 'image' && b.alt}
                            {b.type === 'product' && b.title}
                        </div>
                    </div>
                </div>
                {/* Recursive Children for Rows/Columns */}
                {(b as any).children && (
                    <div className="border-l border-gray-100 ml-4 pl-1">
                        {/* Flatten children arrays for row/col structure if needed, but row2 has multiple columns. children is actually array of arrays for columns? 
                            Let's check usages. 
                            Actually createDefaultBlock for row2 has `children: [[], []]`.
                            So it's an array of arrays of blocks.
                        */}
                        {Array.isArray((b as any).children) && (b as any).children.map((col: EmailBlock[], colIdx: number) => (
                            <div key={`${b.id}-col-${colIdx}`} className="ml-2 mb-2">
                                <div className="text-[9px] font-bold text-gray-300 uppercase mb-1">Cột {colIdx + 1}</div>
                                {renderTree(col, depth + 1)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="absolute right-0 top-14 bottom-0 w-80 bg-white shadow-xl border-l border-gray-200 z-30 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 bg-gray-50/50">
                <h3 className="font-bold text-gray-800">Bản Đồ Cấu Trúc</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-blue-600 px-2">
                    <Network size={14} /> Cấu Trúc
                </div>

                <div className="space-y-1">
                    {blocks.length === 0 ? <div className="text-center text-gray-400 text-xs py-4">Trống</div> : renderTree(blocks)}
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 flex justify-between">
                <span>Tổng cộng:</span>
                <span>{countBlocks(blocks)} elements</span>
            </div>
        </div>
    );
};

// =============================================
// MAIN COMPONENT
// =============================================
const VisualEmailBuilder: React.FC = () => {
    const [doc, setDoc] = useState<EmailDocument>(DEFAULT_DOC);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [emailTitle, setEmailTitle] = useState('Email mới');
    const [leftTab, setLeftTab] = useState<LeftTabType>('elements');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [hasCustomerList] = useState(true);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showStructureMap, setShowStructureMap] = useState(false);
    const [emailHistory, setEmailHistory] = useState<EmailHistoryRecord[]>([]);
    const [previewHistoryItem, setPreviewHistoryItem] = useState<EmailHistoryRecord | null>(null);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [savedDesigns, setSavedDesigns] = useState<SavedEmailDesign[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [showReportModal, setShowReportModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [scheduledData, setScheduledData] = useState<EmailCampaign[]>([]);
    const [showScheduledModal, setShowScheduledModal] = useState(false);

    const handleOpenScheduledModal = async () => {
        const campaigns = await campaignService.getAllCampaigns();
        setScheduledData(campaigns);
        setShowScheduledModal(true);
    };

    React.useEffect(() => {
        setEmailHistory(StorageService.getEmailHistory());
        // Fetch saved designs from Supabase
        emailDesignService.getAll().then(designs => setSavedDesigns(designs));
    }, []);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const showToast = (msg: string, type: ToastType = 'info') => setToast({ message: msg, type });
    const closeConfirm = () => setConfirmDialog((p) => ({ ...p, isOpen: false }));
    const selectedBlock = useMemo(() => {
        if (!selectedId) return null;
        return findBlockById(doc.blocks, selectedId);
    }, [doc.blocks, selectedId]);

    const updateBlock = useCallback((upd: EmailBlock) => {
        setDoc((p) => ({ ...p, blocks: updateBlockInList(p.blocks, upd) }));
    }, []);
    const deleteBlock = useCallback((id: string) => { setDoc((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) })); if (selectedId === id) setSelectedId(null); }, [selectedId]);
    const updateSettings = useCallback((s: EmailDocument['settings']) => setDoc((p) => ({ ...p, settings: s })), []);
    const moveBlock = useCallback((id: string, dir: 'up' | 'down') => { setDoc((p) => { const i = p.blocks.findIndex((b) => b.id === id); if (i < 0) return p; const ni = dir === 'up' ? i - 1 : i + 1; if (ni < 0 || ni >= p.blocks.length) return p; return { ...p, blocks: arrayMove(p.blocks, i, ni) }; }); }, []);
    const duplicateBlock = useCallback((id: string) => { setDoc((p) => { const i = p.blocks.findIndex((b) => b.id === id); if (i < 0) return p; const c = { ...p.blocks[i], id: generateId() }; const nb = [...p.blocks]; nb.splice(i + 1, 0, c); return { ...p, blocks: nb }; }); showToast('Đã nhân đôi', 'success'); }, []);
    const handleInsertTag = (tag: string) => { if (selectedBlock && selectedBlock.type === 'text') updateBlock({ ...selectedBlock, content: selectedBlock.content + tag }); };
    const handleTemplateSelect = () => { setConfirmDialog({ isOpen: true, title: 'Áp dụng template?', message: 'Nội dung hiện tại sẽ bị thay thế.', onConfirm: () => { setDoc(DEFAULT_DOC); closeConfirm(); showToast('Đã áp dụng', 'success'); } }); };

    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
    const handleDragOver = (e: any) => setDragOverId(e.over?.id || null);
    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null); setDragOverId(null);
        const { active, over } = e; if (!over) return;
        const data = active.data.current;
        const overId = over.id as string;

        // Check if dropping into a layout cell (format: blockId-cell-index)
        if (overId.includes('-cell-')) {
            const [parentBlockId, cellIndexStr] = overId.split('-cell-');
            const cellIndex = parseInt(cellIndexStr);
            // Use recursive findBlockById instead of flat Doc.blocks.find
            const parentBlock = findBlockById(doc.blocks, parentBlockId);

            if (parentBlock && (parentBlock.type === 'row2' || parentBlock.type === 'row3' || parentBlock.type === 'column2' || parentBlock.type === 'column3')) {
                // Case 1: Drop NEW element from sidebar
                if (data?.isNew) {
                    const newChild = createDefaultBlock(data.type as EmailBlockType, data.level);
                    setDoc(p => ({
                        ...p,
                        blocks: insertBlockIntoParent(p.blocks, parentBlockId, cellIndex, newChild)
                    }));
                    showToast('Đã thêm element vào ô', 'success');
                    return;
                }

                // Case 2: Drop EXISTING element from main canvas
                const existingBlockIndex = doc.blocks.findIndex(b => b.id === active.id);
                if (existingBlockIndex >= 0) {
                    const blockToMove = doc.blocks[existingBlockIndex];
                    if (['row2', 'row3', 'column2', 'column3'].includes(blockToMove.type)) {
                        showToast('Không thể lồng ghép các block bố cục', 'error');
                        return;
                    }

                    setDoc(p => {
                        const newBlocks = [...p.blocks];
                        newBlocks.splice(existingBlockIndex, 1);
                        return {
                            ...p,
                            blocks: newBlocks.map(b => {
                                if (b.id === parentBlockId) {
                                    const newChildren = [...(b as any).children];
                                    newChildren[cellIndex] = [...newChildren[cellIndex], blockToMove];
                                    return { ...b, children: newChildren };
                                }
                                return b;
                            })
                        };
                    });
                    showToast('Đã di chuyển element vào ô', 'success');
                    return;
                }
            }
        }

        if (data?.isNew) { const nb = createDefaultBlock(data.type as EmailBlockType, data.level); const oi = doc.blocks.findIndex((b) => b.id === over.id); setDoc((p) => { const nb2 = [...p.blocks]; if (oi >= 0) nb2.splice(oi, 0, nb); else nb2.push(nb); return { ...p, blocks: nb2 }; }); setSelectedId(nb.id); return; }
        if (data?.isTag && selectedBlock?.type === 'text') { updateBlock({ ...selectedBlock, content: selectedBlock.content + data.tag }); showToast('Đã thêm tag', 'success'); return; }

        if (active.id !== over.id) {
            setDoc((p) => {
                const oi = p.blocks.findIndex((b) => b.id === active.id);
                const ni = p.blocks.findIndex((b) => b.id === over.id);
                if (oi >= 0 && ni >= 0) return { ...p, blocks: arrayMove(p.blocks, oi, ni) };
                return p;
            });
        }
    };

    const generateHTML = () => generateEmailHTML(doc);
    /*
                                    ${ p.originalPrice ? `<div style="color:${b.oldPriceColor || '#9ca3af'};font-size:12px;text-decoration:line-through;">${p.originalPrice}</div>` : '' }
                                </div >
                            </div >
    `).join('')}
                        </div>
                    </div>`;
                case 'coupon': return `
                    <div style="padding:16px 32px;text-align:center;">
                        <div style="background:${b.backgroundColor};border:2px dashed ${b.borderColor};border-radius:12px;padding:32px;position:relative;margin:16px 0;">
                             <!-- Badge -->
                             <div style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:${b.badgeColor || '#F59E0B'};color:#ffffff;padding:6px 16px;border-radius:999px;font-size:14px;font-weight:bold;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;">
                                ${b.iconUrl ? `<img src="${b.iconUrl}" style="width:16px;height:16px;display:block;filter:brightness(0) invert(1);" />` : ''}
                                ${b.discount}
                             </div>

                             <!-- Code Box -->
                             <div style="background:#ffffff;border:2px solid ${b.borderColor};border-radius:12px;padding:16px 32px;margin-bottom:16px;">
                                <div style="font-family:monospace;font-size:32px;font-weight:bold;color:${b.codeColor || '#D97706'};letter-spacing:4px;">${b.code}</div>
                             </div>

                             <div style="font-size:14px;color:#4b5563;margin-bottom:4px;">${b.description}</div>
                             ${b.expirationDate ? `<div style="font-size:12px;color:#9ca3af;">Hạn sử dụng: ${b.expirationDate}</div>` : ''}
                        </div>
                    </div>`;

                case 'order-summary': return `
                    <div style="padding:16px;">
                        <div style="background:${b.backgroundColor};border:1px solid ${b.borderColor};border-radius:12px;overflow:hidden;margin:16px 0;">
                             <!-- Header -->
                             <div style="padding:16px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:12px;">
                                ${b.iconUrl ? `<div style="width:32px;height:32px;border-radius:50%;background:${b.iconBackgroundColor || '#10B981'};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><img src="${b.iconUrl}" style="width:16px;height:16px;filter:brightness(0) invert(1);display:block;" /></div>` : ''}
                                <div style="flex:1;text-align:${b.titleAlignment};font-family:${b.fontFamily};font-size:${b.titleFontSize || 18}px;font-weight:${b.titleFontWeight === 'bold' ? 'bold' : 'normal'};font-style:${b.titleFontStyle || 'normal'};color:${b.titleColor || '#1f2937'};">
                                    ${b.title}
                                </div>
                             </div>

                             <!-- Order ID -->
                             <div style="padding:12px 20px;background:#f9fafb;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;font-weight:500;">
                                ${b.orderId}
                             </div>

                             <!-- Items -->
                             <div style="padding:20px;">
                                ${b.items.map(item => `
                                    <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:12px;border-bottom:1px dashed #f3f4f6;padding-bottom:12px;">
                                        <span style="color:#4b5563;"><span style="color:#9ca3af;margin-right:8px;">${item.qty}x</span>${item.name}</span>
                                        <span style="font-weight:500;">${item.price}</span>
                                    </div>
                                `).join('')}

                                <!-- Costs -->
                                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6;">
                                    <div style="display:flex;justify-content:space-between;font-size:14px;color:#4b5563;margin-bottom:8px;">
                                        <span>Tạm tính</span>
                                        <span>${b.subtotal}</span>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;font-size:14px;color:#4b5563;margin-bottom:8px;">
                                        <span>Phí vận chuyển</span>
                                        <span>${b.shippingFee}</span>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;color:${b.totalColor || '#1f2937'};margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6;">
                                        <span>Tổng cộng</span>
                                        <span>${b.total}</span>
                                    </div>
                                </div>
                             </div>

                             <!-- Address -->
                             ${b.shippingAddress ? `<div style="padding:16px;background:#eff6ff;font-size:12px;color:#6b7280;border-top:1px solid #f3f4f6;">${b.shippingLabel || 'Ship to'}: ${b.shippingAddress}</div>` : ''}
                        </div>
                    </div>`;





                default: return '';
            }
        };
return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${emailTitle}</title></head><body style="margin:0;padding:0;font-family:${settings.fontFamily};background:${settings.backgroundColor};"><div style="max-width:${settings.contentWidth}px;margin:0 auto;padding:40px 20px;"><div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">${blocks.map(b => toHtml(b)).join('\n')}</div></div></body></html>`;
    }; */

    const handleExport = () => { const html = generateHTML(); StorageService.addEmailHistory({ id: Date.now().toString(), timestamp: Date.now(), title: emailTitle, html }); setEmailHistory(StorageService.getEmailHistory()); const blob = new Blob([html], { type: 'text/html' }); const a = window.document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `email-${Date.now()}.html`; a.click(); showToast('Xuất thành công!', 'success'); };
    const handleCreateNew = () => { setConfirmDialog({ isOpen: true, title: 'Tạo mới?', message: 'Thay đổi chưa lưu sẽ mất.', onConfirm: () => { setDoc(DEFAULT_DOC); setEmailTitle('Email mới'); setSelectedId(null); setCurrentDesignId(null); closeConfirm(); showToast('Đã tạo mới', 'success'); } }); };
    const handleDeleteHistory = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, title: 'Xóa?', message: 'Chắc chắn?', isDestructive: true, onConfirm: () => { StorageService.deleteEmailHistory(id); setEmailHistory((p) => p.filter((h) => h.id !== id)); if (previewHistoryItem?.id === id) setPreviewHistoryItem(null); closeConfirm(); showToast('Đã xóa', 'success'); } }); };

    const handleSaveDesign = async () => {
        const now = Date.now();
        const designId = currentDesignId || `design_${now}`;
        const existingDesign = savedDesigns.find(d => d.id === designId);
        const design: SavedEmailDesign = {
            id: designId,
            name: emailTitle,
            createdAt: existingDesign?.createdAt || now,
            updatedAt: now,
            doc: doc
        };

        console.log('[DEBUG] Saving Design:', designId);
        console.log('[DEBUG] Doc Blocks count:', doc.blocks.length);
        console.log('[DEBUG] First Block Content:', doc.blocks[0]?.content);

        showToast('Đang lưu...', 'info');
        const success = await emailDesignService.save(design);
        if (success) {
            if (!currentDesignId) setCurrentDesignId(designId);
            const updatedDesigns = await emailDesignService.getAll();
            setSavedDesigns(updatedDesigns);
            showToast('Đã lưu template thành công!', 'success');
        } else {
            showToast('Lưu thất bại. Vui lòng thử lại.', 'error');
        }
    };

    const handleLoadDesign = (design: SavedEmailDesign) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Tải template?',
            message: 'Thay đổi chưa lưu sẽ mất.',
            onConfirm: () => {
                setDoc(design.doc);
                setEmailTitle(design.name);
                setCurrentDesignId(design.id);
                setSelectedId(null);
                closeConfirm();
                showToast(`Đã tải "${design.name}"`, 'success');
            }
        });
    };

    const handleDeleteDesign = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Xóa template?',
            message: 'Hành động này không thể hoàn tác.',
            isDestructive: true,
            onConfirm: async () => {
                showToast('Đang xóa...', 'info');
                const success = await emailDesignService.delete(id);
                if (success) {
                    const updatedDesigns = await emailDesignService.getAll();
                    setSavedDesigns(updatedDesigns);
                    if (currentDesignId === id) setCurrentDesignId(null);
                    showToast('Đã xóa template', 'success');
                } else {
                    showToast('Xóa thất bại', 'error');
                }
                closeConfirm();
            }
        });
    };

    const handleImportDesign = () => {
        setShowImportModal(true);
    };

    const executeImport = (jsonContent: string) => {
        try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.blocks && parsed.settings) {
                setDoc(parsed);
                showToast('Đã nhập thiết kế thành công', 'success');
                setShowImportModal(false);
            } else {
                showToast('Format JSON không hợp lệ (thiếu blocks hoặc settings)', 'error');
            }
        } catch (err) {
            showToast('Lỗi parse JSON', 'error');
        }
    };

    const handlePreview = () => {
        setShowPreviewModal(true);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3"><div className="bg-pink-100 p-2 rounded-lg text-pink-600"><Mail size={18} /></div><h2 className="text-lg font-bold text-gray-800">Visual Email</h2><span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-semibold">Pro</span></div>
                <div className="flex gap-2"><button onClick={handleCreateNew} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50"><Plus size={16} />Tạo mới</button><button onClick={handleOpenScheduledModal} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50"><Calendar size={16} />Lịch</button><button onClick={() => setShowReportModal(true)} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50"><BarChart2 size={16} />Report</button><button onClick={() => setShowCampaignModal(true)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"><Send size={16} />Chiến dịch</button></div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex overflow-hidden">
                    <LeftSidebar activeTab={leftTab} onTabChange={setLeftTab} onTemplateSelect={handleTemplateSelect} hasCustomerList={hasCustomerList} savedDesigns={savedDesigns} onLoadDesign={handleLoadDesign} onDeleteDesign={handleDeleteDesign} />
                    <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
                        <TopControlBar device={viewMode} onDeviceChange={setViewMode} onSave={handleSaveDesign} onImport={handleImportDesign} onPreview={handlePreview} onToggleStructureMap={() => setShowStructureMap(!showStructureMap)} />
                        <div className="flex-1 overflow-y-auto p-6 flex justify-center" onClick={() => setSelectedId(null)}>
                            <div className={`transition-all duration-300 ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[700px]'}`}>
                                <div className="mb-3 sticky top-0 z-10 bg-gray-100/95 backdrop-blur-sm pt-2 pb-2"><input type="text" value={emailTitle} onChange={(e) => setEmailTitle(e.target.value)} className="w-full text-center text-base font-bold text-gray-700 bg-transparent border-none outline-none focus:bg-white focus:rounded-lg focus:px-4 py-1" placeholder="Tiêu đề..." /></div>
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 min-h-[500px]" style={{ backgroundColor: doc.settings.backgroundColor }}>
                                    <div className="bg-white rounded-xl p-5 shadow-sm" style={{ maxWidth: viewMode === 'mobile' ? '100%' : `${doc.settings.contentWidth}px`, margin: '0 auto' }}>
                                        <SortableContext items={doc.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                            {doc.blocks.length === 0 ? <div className="text-center py-12 text-gray-400"><Type size={36} className="mx-auto mb-3 opacity-50" /><p className="font-medium">Kéo thả vào đây</p></div> : <div className="space-y-2">{doc.blocks.map((b, i) => <SortableBlock key={b.id} block={b} index={i} total={doc.blocks.length} isSelected={selectedId === b.id} onSelect={() => setSelectedId(b.id)} onSelectId={setSelectedId} onDelete={() => deleteBlock(b.id)} onUpdate={updateBlock} onMoveUp={() => moveBlock(b.id, 'up')} onMoveDown={() => moveBlock(b.id, 'down')} onDuplicate={() => duplicateBlock(b.id)} isDragOver={dragOverId === b.id} />)}</div>}
                                        </SortableContext>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-72 bg-white border-l border-gray-200 p-5 flex flex-col overflow-y-auto"><PropertiesPanel block={selectedBlock} onUpdate={updateBlock} onInsertTag={handleInsertTag} docSettings={doc.settings} onUpdateSettings={updateSettings} /></div>
                </div>
                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: {
                                    opacity: '0.4',
                                },
                            },
                        }),
                    }}
                >
                    {activeId && (
                        activeId.startsWith('element-') ? (() => {
                            const allElements = [...ELEMENT_TYPES, ...LAYOUT_ELEMENTS, ...MEDIA_ELEMENTS, ...CUSTOM_ELEMENTS, ...ECOMMERCE_ELEMENTS];
                            const el = allElements.find((e) => `element-${e.type}-${e.label}` === activeId);

                            if (!el) return null;
                            return (
                                <div className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-blue-500 rounded-2xl shadow-2xl scale-105 cursor-grabbing opacity-90">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        {(el as any).iconText ? <span className="text-sm font-bold">{(el as any).iconText}</span> : el.icon}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{el.label}</span>
                                </div>
                            );
                        })() : (() => {
                            const block = findBlockById(doc.blocks, activeId);
                            if (!block) return null;
                            return (
                                <div className="bg-white rounded-lg shadow-2xl ring-2 ring-blue-500 opacity-90 scale-105 cursor-grabbing overflow-hidden pointer-events-none" style={{ width: doc.settings.contentWidth }}>
                                    <div className="p-4">
                                        <BlockRenderer block={block} onUpdate={() => { }} />
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </DragOverlay>
            </DndContext>

            {showHistoryModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] ${previewHistoryItem ? 'max-w-4xl' : 'max-w-lg'}`}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><History size={18} />{previewHistoryItem ? 'Xem trước' : 'Lịch sử'}</h3><button onClick={() => previewHistoryItem ? setPreviewHistoryItem(null) : setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm"><X size={18} /></button></div>
                        <div className="flex flex-1 overflow-hidden">{!previewHistoryItem ? <div className="p-5 overflow-y-auto w-full space-y-2">{emailHistory.length === 0 ? <div className="text-center py-10 text-gray-400">Chưa có.</div> : emailHistory.map((h) => <div key={h.id} onClick={() => setPreviewHistoryItem(h)} className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 bg-white cursor-pointer flex justify-between items-center"><div><div className="font-medium text-gray-800 text-sm">{h.title}</div><div className="text-[11px] text-gray-400">{new Date(h.timestamp).toLocaleString('vi-VN')}</div></div><div className="flex items-center gap-1"><button onClick={(e) => handleDeleteHistory(e, h.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button><div className="text-blue-400 bg-blue-50 p-1.5 rounded-lg"><Eye size={16} /></div></div></div>)}</div> : <div className="flex-1 bg-gray-200 p-6 flex justify-center overflow-hidden"><div className="w-full max-w-[650px] h-full bg-white shadow-xl rounded-xl overflow-hidden"><iframe srcDoc={previewHistoryItem.html} className="w-full h-full border-none" /></div></div>}</div>
                    </div>
                </div>
            )}

            {/* Structure Map Modal */}
            <StructureMapModal
                isOpen={showStructureMap}
                onClose={() => setShowStructureMap(false)}
                blocks={doc.blocks}
                onSelectBlock={(id) => { setSelectedId(id); setShowStructureMap(false); }}
                selectedId={selectedId}
            />

            <ImportJsonModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={executeImport} />

            <PreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                htmlContent={generateHTML()}
                jsonContent={JSON.stringify(doc, null, 2)}
                emailTitle={emailTitle}
                onSendTest={async (email, subject) => {
                    showToast(`Đang gửi test tới ${email}...`, 'info');
                    try {
                        await EmailService.sendTestEmail(email, generateHTML(), subject);
                        showToast('Đã gửi thành công! Kiểm tra hộp thư.', 'success');
                    } catch (error) {
                        showToast('Gửi thất bại. Kiểm tra console.', 'error');
                        console.error(error);
                    }
                }}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} isDestructive={confirmDialog.isDestructive} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm} />

            {/* Email Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl w-[95vw] h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <EmailReport onBack={() => setShowReportModal(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Manager Modal */}
            <CampaignManager
                isOpen={showCampaignModal}
                onClose={() => setShowCampaignModal(false)}
                onCreateCampaign={() => { }}
            />

            {/* Scheduled Campaigns Modal */}
            {showScheduledModal && (
                <ScheduledCampaignsModal
                    isOpen={showScheduledModal}
                    onClose={() => setShowScheduledModal(false)}
                />
            )}
        </div>
    );
};

export default VisualEmailBuilder;