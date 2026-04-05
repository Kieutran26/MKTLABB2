import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeService, Knowledge } from '../services/knowledgeService';
import { BookOpen, Search, Plus, X, Edit2, Trash2, Save, Eye, BookMarked } from 'lucide-react';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

/** Editorial minimalism: single stone treatment for all categories */
const getColor = (_cat: string) => ({
    bg: 'bg-stone-100/80',
    text: 'text-stone-600',
    dot: 'bg-stone-400',
});

// Initial data
const INITIAL_KNOWLEDGE: Omit<Knowledge, 'id'>[] = [
    { term: 'Relationship Marketing', definition: 'Chiến lược tập trung vào việc xây dựng mối quan hệ lâu dài, cá nhân hóa với khách hàng.\n\n**Ví dụ:** Shopee gửi voucher sinh nhật, Amazon đề xuất sản phẩm dựa trên lịch sử mua hàng.', category: 'Khách Hàng' },
    { term: 'ICP (Ideal Customer Profile)', definition: 'Mô tả loại khách hàng mang lại giá trị cao nhất cho công ty.\n\n**Ví dụ:** "Doanh nghiệp SME doanh thu 5-50 tỷ/năm, đang muốn rebrand".', category: 'Khách Hàng' },
    { term: 'Customer Segmentation', definition: 'Quá trình chia cơ sở khách hàng thành các nhóm dựa trên đặc điểm chung.\n\n**Ví dụ:** Chia theo độ tuổi, hành vi mua, giá trị đơn hàng.', category: 'Khách Hàng' },
    { term: 'Customer Advocacy', definition: 'Mức độ khách hàng chủ động giới thiệu thương hiệu cho người khác.\n\n**Ví dụ:** Khách hàng Apple thường xuyên giới thiệu sản phẩm cho bạn bè.', category: 'Khách Hàng' },
    { term: 'Customer Loyalty', definition: 'Mức độ khách hàng tiếp tục mua hàng từ một thương hiệu.\n\n**Ví dụ:** Chương trình Starbucks Rewards.', category: 'Khách Hàng' },
    { term: 'Pain Points', definition: 'Những vấn đề, thách thức cụ thể mà khách hàng đang gặp phải.\n\n**Ví dụ:** "Tôi mất quá nhiều thời gian để tạo content".', category: 'Khách Hàng' },
    { term: 'Customer Churn', definition: 'Khách hàng ngừng sử dụng sản phẩm/dịch vụ.\n\n**Ví dụ:** Spotify mất 5% subscriber/tháng = Churn Rate 5%.', category: 'Khách Hàng' },
    { term: 'Customer Journey Map', definition: 'Sơ đồ mô tả các bước khách hàng trải qua khi tương tác với thương hiệu.\n\n**Ví dụ:** Awareness → Interest → Consideration → Purchase → Loyalty.', category: 'Khách Hàng' },
    { term: 'Buyer Persona', definition: 'Hồ sơ đại diện cho kiểu khách hàng lý tưởng.\n\n**Ví dụ:** "Lan, 28 tuổi, thu nhập 15-20 triệu, quan tâm skincare".', category: 'Khách Hàng' },
    { term: 'Ambassador', definition: 'Khách hàng hoặc người ảnh hưởng hợp tác quảng bá sản phẩm một cách tự nhiên.\n\n**Ví dụ:** Brand Ambassador của Nike, Adidas.', category: 'Khách Hàng' },
    { term: 'Touchpoint', definition: 'Điểm khách hàng tương tác với thương hiệu.\n\n**Ví dụ:** Quảng cáo, website, email, nhân viên tư vấn.', category: 'Khách Hàng' },
    { term: 'VOC (Voice of Customer)', definition: 'Chương trình thu thập và phân tích phản hồi của khách hàng.\n\n**Ví dụ:** Survey NPS, phỏng vấn khách hàng, phân tích review.', category: 'Khách Hàng' },
    { term: 'Customer Delight', definition: 'Cung cấp trải nghiệm vượt xa mong đợi khách hàng.\n\n**Ví dụ:** Zappos gửi hoa tặng khách hàng, upgrade miễn phí giao hàng.', category: 'Khách Hàng' },
    { term: 'Customer Success', definition: 'Đảm bảo khách hàng đạt được mục tiêu khi sử dụng sản phẩm/dịch vụ.\n\n**Ví dụ:** Đội CS của SaaS giúp onboard và training khách hàng.', category: 'Khách Hàng' },
    { term: 'UX (User Experience)', definition: 'Cách người dùng tương tác và cảm nhận về sản phẩm.\n\n**Ví dụ:** UI/UX tốt giúp giữ chân người dùng trên app/website.', category: 'Khách Hàng' },
    { term: 'Marketing Funnel', definition: 'Mô hình mô tả hành trình khách hàng từ biết đến mua hàng.\n\n**Giai đoạn:** Awareness → Consideration → Conversion → Loyalty → Advocacy.', category: 'Phễu & Leads' },
    { term: 'Sales Funnel', definition: 'Các bước hành động dẫn đến giao dịch, do đội sales quản lý.\n\n**Ví dụ:** Cold call → Đánh giá nhu cầu → Demo → Báo giá → Chốt.', category: 'Phễu & Leads' },
    { term: 'AIDA Model', definition: '**A**ttention - **I**nterest - **D**esire - **A**ction\n\nMô hình mô tả các bước nhận thức của khách hàng.', category: 'Phễu & Leads' },
    { term: 'Leads', definition: 'Cá nhân/tổ chức đã thể hiện sự quan tâm đến sản phẩm.\n\n**Ví dụ:** Người điền form, để lại email, inbox fanpage.', category: 'Phễu & Leads' },
    { term: 'MQL', definition: 'Marketing Qualified Lead - Lead được Marketing đánh giá có tiềm năng cao.\n\n**Ví dụ:** Người tải 3 ebook, xem 5 video demo, quay lại 10 lần/tuần.', category: 'Phễu & Leads' },
    { term: 'SQL', definition: 'Sales Qualified Lead - MQL sẵn sàng nhận cuộc gọi bán hàng.\n\n**Ví dụ:** Người yêu cầu báo giá, hỏi cụ thể về gói dịch vụ.', category: 'Phễu & Leads' },
    { term: 'Lead Generation', definition: 'Quá trình thu hút và chuyển đổi người lạ thành leads.\n\n**Ví dụ:** Chạy ads, SEO, content marketing, webinar.', category: 'Phễu & Leads' },
    { term: 'SWOT Analysis', definition: '**S**trengths - **W**eaknesses - **O**pportunities - **T**hreats\n\nCông cụ đánh giá yếu tố nội bộ và bên ngoài.', category: 'Chiến Lược' },
    { term: 'SMART Goals', definition: '**S**pecific - **M**easurable - **A**chievable - **R**elevant - **T**ime-bound\n\nKhuôn khổ thiết lập mục tiêu hiệu quả.', category: 'Chiến Lược' },
    { term: 'STP', definition: '**S**egmentation - **T**argeting - **P**ositioning\n\nBa bước quan trọng trong hoạch định chiến lược marketing.', category: 'Chiến Lược' },
    { term: 'USP', definition: 'Unique Selling Proposition - Lý do độc đáo mà khách hàng nên mua sản phẩm của bạn.\n\n**Ví dụ:** Domino\'s "Pizza nóng trong 30 phút hoặc miễn phí".', category: 'Chiến Lược' },
    { term: 'Brand Positioning', definition: 'Tạo hình ảnh độc đáo trong tâm trí khách hàng.\n\n**Ví dụ:** Volvo = An toàn, Apple = Sáng tạo.', category: 'Chiến Lược' },
    { term: 'Blue Ocean Strategy', definition: 'Chiến lược tạo không gian thị trường mới không có cạnh tranh.\n\n**Ngược lại:** Red Ocean = thị trường bão hòa, cạnh tranh khốc liệt.', category: 'Chiến Lược' },
    { term: 'Competitive Advantage', definition: 'Yếu tố cho phép công ty hoạt động hiệu quả hơn đối thủ.\n\n**Ví dụ:** Chi phí thấp, sản phẩm khác biệt, dịch vụ vượt trội.', category: 'Chiến Lược' },
    { term: 'PESTEL Analysis', definition: '**P**olitical - **E**conomic - **S**ociocultural - **T**echnological - **E**nvironmental - **L**egal\n\nPhân tích yếu tố vĩ mô.', category: 'Chiến Lược' },
    { term: 'Organic Reach', definition: 'Số người thấy nội dung mà không trả tiền quảng cáo.\n\n**Ví dụ:** Đăng bài, 5.000 người thấy mà không chạy ads.', category: 'Đo Lường' },
    { term: 'Paid Reach', definition: 'Số người thấy nội dung thông qua quảng cáo trả tiền.\n\n**Ví dụ:** Chi $100 FB Ads, tiếp cận 20.000 người.', category: 'Đo Lường' },
    { term: 'Impressions', definition: 'Số lần nội dung được hiển thị.\n\n**Lưu ý:** Một người có thể thấy nhiều lần, nên Impressions ≥ Reach.', category: 'Đo Lường' },
    { term: 'Frequency', definition: 'Số lần trung bình một người thấy quảng cáo.\n\n**Lưu ý:** Frequency > 7 có thể gây khó chịu.', category: 'Đo Lường' },
    { term: 'CPM', definition: 'Cost Per Mille - Chi phí cho mỗi 1.000 lượt hiển thị.\n\n**Ví dụ:** CPM = $5 nghĩa là trả $5/1.000 Impressions.', category: 'Chi Phí' },
    { term: 'CPC', definition: 'Cost Per Click - Chi phí cho mỗi click.\n\n**Công thức:** CPC = Tổng chi phí / Số click', category: 'Chi Phí' },
    { term: 'CPA', definition: 'Cost Per Acquisition - Chi phí để có khách hàng mới.\n\n**Ví dụ:** Chi $1.000, có 50 đơn → CPA = $20/đơn.', category: 'Chi Phí' },
    { term: 'CPL', definition: 'Cost Per Lead - Chi phí cho mỗi lead thu được.\n\n**Công thức:** CPL = Tổng chi phí / Số leads', category: 'Chi Phí' },
    { term: 'ROI', definition: 'Return on Investment - Tỷ suất hoàn vốn.\n\n**Công thức:** ROI = (Lợi nhuận - Chi phí) / Chi phí × 100%', category: 'Chi Phí' },
    { term: 'ROMI', definition: 'Return on Marketing Investment.\n\n**Công thức:** ROMI = (Doanh thu tăng - Chi phí MKT) / Chi phí MKT', category: 'Chi Phí' },
    { term: 'ROAS', definition: 'Return on Ad Spend - Tỷ suất lợi nhuận trên chi tiêu quảng cáo.\n\n**Ví dụ:** Chi $1.000, thu $5.000 → ROAS = 5:1.', category: 'Chi Phí' },
    { term: 'COGS', definition: 'Cost of Goods Sold - Giá vốn hàng bán.\n\nTổng chi phí trực tiếp để tạo ra sản phẩm/dịch vụ.', category: 'Chi Phí' },
    { term: 'Conversion', definition: 'Hành động mong muốn mà người dùng thực hiện.\n\n**Ví dụ:** Mua hàng, đăng ký, tải app, điền form.', category: 'Chuyển Đổi' },
    { term: 'Conversion Rate', definition: 'Tỷ lệ người dùng thực hiện hành động chuyển đổi.\n\n**Công thức:** CR = (Conversions / Visits) × 100%', category: 'Chuyển Đổi' },
    { term: 'CTR', definition: 'Click-Through Rate - Tỷ lệ click so với impressions.\n\n**Công thức:** CTR = (Clicks / Impressions) × 100%', category: 'Chuyển Đổi' },
    { term: 'Engagement Rate', definition: 'Tỷ lệ tương tác trên tổng số người tiếp cận.\n\n**Công thức:** ER = (Like + Comment + Share) / Reach × 100%', category: 'Chuyển Đổi' },
    { term: 'AOV', definition: 'Average Order Value - Giá trị đơn hàng trung bình.\n\n**Công thức:** AOV = Tổng doanh thu / Số đơn hàng', category: 'Giá Trị' },
    { term: 'LTV / CLV', definition: 'Customer Lifetime Value - Tổng giá trị khách hàng mang lại.\n\n**Ví dụ:** Mua 200k/tháng × 24 tháng = LTV 4.8 triệu.', category: 'Giá Trị' },
    { term: 'LTV:CPA Ratio', definition: 'Tỷ lệ LTV so với CPA.\n\n**Lành mạnh:** ≥ 3:1 (LTV gấp 3 lần CPA).', category: 'Giá Trị' },
    { term: 'Retention Rate', definition: 'Tỷ lệ khách hàng tiếp tục sử dụng dịch vụ.\n\n**Ví dụ:** Đầu tháng 1.000, cuối tháng còn 950 → Retention = 95%.', category: 'Giá Trị' },
    { term: 'Churn Rate', definition: 'Tỷ lệ khách hàng ngừng mua/hủy dịch vụ.\n\n**Công thức:** Churn Rate = 100% - Retention Rate', category: 'Giá Trị' },
    { term: 'NPS', definition: 'Net Promoter Score - Chỉ số đo lường lòng trung thành.\n\n**Công thức:** NPS = %Promoters - %Detractors', category: 'Giá Trị' },
    { term: 'Market Share', definition: 'Tỷ lệ doanh số của bạn trong tổng doanh số ngành.\n\n**Ví dụ:** Thị trường 100 tỷ, bạn bán 20 tỷ → 20% market share.', category: 'Thị Trường' },
    { term: 'Market Size', definition: 'Tổng giá trị hoặc số lượng sản phẩm có thể bán trong một thị trường.\n\n**Gồm:** TAM, SAM, SOM.', category: 'Thị Trường' },
    { term: 'Niche Market', definition: 'Phân khúc nhỏ của thị trường lớn, phục vụ nhu cầu rất cụ thể.\n\n**Ví dụ:** Mỹ phẩm hữu cơ cho da nhạy cảm của phụ nữ mang thai.', category: 'Thị Trường' },
    { term: 'Market Penetration', definition: 'Chiến lược tăng doanh số trong thị trường hiện tại.\n\n**Cách làm:** Khuyến mãi, quảng cáo rầm rộ.', category: 'Thị Trường' },
    { term: 'Market Development', definition: 'Chiến lược đưa sản phẩm hiện có vào thị trường mới.\n\n**Ví dụ:** Mở rộng địa lý, phân khúc tuổi mới.', category: 'Thị Trường' },
    { term: 'A/B Testing', definition: 'Thử nghiệm 2 phiên bản để xem bản nào hiệu quả hơn.\n\n**Ví dụ:** 2 quảng cáo khác hình ảnh, so sánh CTR.', category: 'Công Cụ' },
    { term: 'Remarketing', definition: 'Quảng cáo nhắm đến người đã từng tương tác với thương hiệu.\n\n**Ví dụ:** Xem giày Shopee → thấy quảng cáo đôi giày đó trên Facebook.', category: 'Công Cụ' },
    { term: 'Lookalike Audience', definition: 'Tạo nhóm đối tượng có đặc điểm tương tự khách hàng hiện tại.\n\n**Ví dụ:** Upload 1.000 khách VIP, Facebook tìm 1 triệu người tương tự.', category: 'Công Cụ' },
    { term: 'UTM Parameters', definition: 'Đoạn mã thêm vào URL để theo dõi nguồn traffic.\n\n**Cấu trúc:** ?utm_source=&utm_medium=&utm_campaign=', category: 'Công Cụ' },
    { term: 'UGC', definition: 'User-Generated Content - Nội dung do khách hàng tạo ra.\n\n**Ví dụ:** Ảnh check-in, unboxing video, review.', category: 'Công Cụ' },
    { term: 'Gated Content', definition: 'Nội dung có giá trị chỉ truy cập được sau khi cung cấp thông tin.\n\n**Ví dụ:** Ebook, Whitepaper yêu cầu email.', category: 'Công Cụ' },
    { term: 'Cross-sell', definition: 'Khuyến khích mua thêm sản phẩm bổ sung.\n\n**Ví dụ:** Mua laptop → gợi ý mua chuột, balo.', category: 'Công Cụ' },
    { term: 'Landing Page', definition: 'Trang web thiết kế riêng cho một chiến dịch với mục tiêu conversion.\n\n**Ví dụ:** Trang đăng ký webinar, trang flash sale.', category: 'Kênh' },
    { term: 'Inbound Marketing', definition: 'Chiến lược thu hút khách hàng bằng nội dung có giá trị.\n\n**Kênh:** Blog, SEO, Social Media.', category: 'Kênh' },
    { term: 'Outbound Marketing', definition: 'Phương pháp chủ động tìm kiếm khách hàng.\n\n**Kênh:** Quảng cáo, cold call, email hàng loạt.', category: 'Kênh' },
    { term: 'Media Mix', definition: 'Tỷ lệ phân chia ngân sách giữa các kênh truyền thông.\n\n**Kênh:** TV, Digital, Social, OOH.', category: 'Kênh' },
    { term: 'Price Skimming', definition: 'Định giá cao ban đầu, sau đó giảm dần.\n\n**Ví dụ:** iPhone mới 30 triệu → sau 6 tháng còn 25 triệu.', category: 'Định Giá' },
    { term: 'Penetration Pricing', definition: 'Đặt giá thấp để nhanh chóng chiếm thị phần.\n\n**Ví dụ:** Netflix, Spotify giảm 50% cho 3 tháng đầu.', category: 'Định Giá' },
    { term: 'Budget Allocation', definition: 'Phân chia ngân sách marketing cho các kênh/chiến dịch.\n\n**Cân nhắc:** ROI từng kênh, mục tiêu chiến dịch.', category: 'Ngân Sách' },
    { term: 'Break-even Point', definition: 'Mức doanh số mà tổng doanh thu = tổng chi phí.\n\n**Công thức:** BEP = Fixed Cost / (Price - Variable Cost)', category: 'Ngân Sách' },
    { term: 'Marketing Budget', definition: 'Tổng ngân sách dành cho hoạt động marketing.\n\n**Thông thường:** 5-15% doanh thu.', category: 'Ngân Sách' },
];

const MarketingKnowledge: React.FC = () => {
    const [items, setItems] = useState<Knowledge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Knowledge | null>(null);
    const [newTerm, setNewTerm] = useState('');
    const [newDefinition, setNewDefinition] = useState('');
    const [newExample, setNewExample] = useState('');
    const [newComparisonTitle, setNewComparisonTitle] = useState('');
    const [newComparisonLeft, setNewComparisonLeft] = useState('');
    const [newComparisonRight, setNewComparisonRight] = useState('');
    const [newComparisonConclusion, setNewComparisonConclusion] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTerm, setEditTerm] = useState('');
    const [editDefinition, setEditDefinition] = useState('');
    const [editExample, setEditExample] = useState('');
    const [editComparisonTitle, setEditComparisonTitle] = useState('');
    const [editComparisonLeft, setEditComparisonLeft] = useState('');
    const [editComparisonRight, setEditComparisonRight] = useState('');
    const [editComparisonConclusion, setEditComparisonConclusion] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [isEditingPopup, setIsEditingPopup] = useState(false);

    useEffect(() => { loadKnowledge(); }, []);

    const loadKnowledge = async () => {
        setIsLoading(true);
        const data = await KnowledgeService.getAll();
        if (data.length === 0) {
            await KnowledgeService.bulkInsert(INITIAL_KNOWLEDGE);
            setItems(await KnowledgeService.getAll());
        } else {
            setItems(data);
        }
        setIsLoading(false);
    };

    const filteredItems = useMemo(() => {
        let result = items;
        if (selectedCategory !== 'all') result = result.filter(item => item.category === selectedCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q));
        }
        return result;
    }, [items, searchQuery, selectedCategory]);

    const categories = useMemo(() => [...new Set(items.map(item => item.category))].sort(), [items]);

    const handleAdd = async () => {
        if (!newTerm.trim() || !newDefinition.trim()) return;
        const comparison = newComparisonTitle.trim() || newComparisonLeft.trim() || newComparisonRight.trim() || newComparisonConclusion.trim()
            ? `${newComparisonTitle.trim()}|||${newComparisonLeft.trim()}|||${newComparisonRight.trim()}|||${newComparisonConclusion.trim()}`
            : '';
        const newItem = await KnowledgeService.add({
            term: newTerm.trim(),
            definition: newDefinition.trim(),
            example: newExample.trim(),
            comparison,
            category: newCategory.trim() || 'Chung'
        });
        if (newItem) {
            setItems(prev => [...prev, newItem]);
            setNewTerm(''); setNewDefinition(''); setNewExample('');
            setNewComparisonTitle(''); setNewComparisonLeft(''); setNewComparisonRight(''); setNewComparisonConclusion(''); setNewCategory('');
            setShowAddForm(false);
        }
    };

    const startEdit = (item: Knowledge) => {
        const parts = (item.comparison || '').split('|||');
        // Support both old format (left|||right) and new format (title|||left|||right|||conclusion)
        let title = '', left = '', right = '', conclusion = '';
        if (parts.length === 2) {
            // Old format
            left = parts[0] || '';
            right = parts[1] || '';
        } else if (parts.length >= 4) {
            // New format
            title = parts[0] || '';
            left = parts[1] || '';
            right = parts[2] || '';
            conclusion = parts[3] || '';
        }
        setEditingId(item.id);
        setEditTerm(item.term);
        setEditDefinition(item.definition);
        setEditExample(item.example || '');
        setEditComparisonTitle(title);
        setEditComparisonLeft(left);
        setEditComparisonRight(right);
        setEditComparisonConclusion(conclusion);
        setEditCategory(item.category);
        setIsEditingPopup(true);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editTerm.trim() || !editDefinition.trim()) return;
        const comparison = editComparisonTitle.trim() || editComparisonLeft.trim() || editComparisonRight.trim() || editComparisonConclusion.trim()
            ? `${editComparisonTitle.trim()}|||${editComparisonLeft.trim()}|||${editComparisonRight.trim()}|||${editComparisonConclusion.trim()}`
            : '';
        const updated = await KnowledgeService.update(editingId, {
            term: editTerm.trim(),
            definition: editDefinition.trim(),
            example: editExample.trim(),
            comparison,
            category: editCategory.trim() || 'Chung'
        });
        if (updated) {
            setItems(prev => prev.map(item => item.id === editingId ? updated : item));
            setEditingId(null);
            setIsEditingPopup(false);
            setSelectedItem(updated);
        }
    };

    const cancelPopupEdit = () => {
        setIsEditingPopup(false);
        setEditingId(null);
    };

    const parseComparison = (comp: string | undefined) => {
        if (!comp) return { title: '', left: '', right: '', conclusion: '' };
        const parts = comp.split('|||');
        if (parts.length === 2) {
            // Old format - just left and right
            return { title: '', left: parts[0] || '', right: parts[1] || '', conclusion: '' };
        }
        return {
            title: parts[0] || '',
            left: parts[1] || '',
            right: parts[2] || '',
            conclusion: parts[3] || ''
        };
    };

    const handleDelete = async (id: string) => { if (await KnowledgeService.delete(id)) { setItems(prev => prev.filter(item => item.id !== id)); setSelectedItem(null); } };

    const pillBase =
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors';

    return (
        <div className="min-h-full bg-[#FCFDFC] font-sans text-stone-900">
            <div className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#FCFDFC]/95 backdrop-blur-sm">
                <div className="px-6 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/90 bg-white text-stone-500">
                                <BookMarked size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Marketing glossary
                                </p>
                                <h1 className="text-xl font-normal tracking-tight text-stone-900 sm:text-2xl">
                                    Kho Kiến Thức Marketing
                                </h1>
                                <p className="mt-0.5 text-sm text-stone-500">
                                    {items.length} thuật ngữ • {categories.length} chủ đề
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                        >
                            <Plus size={16} strokeWidth={2} />
                            Thêm
                        </button>
                    </div>
                </div>

                <div className="border-t border-stone-100 px-6 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`${pillBase} ${selectedCategory === 'all'
                                ? 'bg-stone-900 text-white'
                                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                }`}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => {
                            const color = getColor(cat);
                            return (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`${pillBase} ${selectedCategory === cat
                                        ? 'bg-stone-900 text-white'
                                        : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                        }`}
                                >
                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selectedCategory === cat ? 'bg-white/70' : color.dot}`} />
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8">
                <div className="relative mb-8 max-w-2xl">
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm thuật ngữ marketing..."
                        className={`${inputClass} pl-11 shadow-none`}
                    />
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className={`${cardClass} mb-8 max-w-4xl p-6`}>
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Thêm kiến thức mới</h3>
                            <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"><X size={18} strokeWidth={1.5} /></button>
                        </div>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Thuật ngữ *" className={inputClass} />
                            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Chủ đề" className={inputClass} />
                        </div>
                        <div className="mb-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Định nghĩa *</label>
                                <textarea value={newDefinition} onChange={(e) => setNewDefinition(e.target.value)} placeholder="Giải thích khái niệm..." rows={4} className={`${inputClass} resize-none`} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ví dụ thực tế</label>
                                <textarea value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="VD: Shopee gửi voucher sinh nhật..." rows={4} className={`${inputClass} resize-none bg-stone-50/50`} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">So sánh</label>
                                <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40">
                                    <input type="text" value={newComparisonTitle} onChange={(e) => setNewComparisonTitle(e.target.value)} placeholder="Tiêu đề so sánh (VD: A/B Testing vs Multivariate Testing)" className="w-full border-b border-stone-200 bg-stone-50/80 px-4 py-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                    <div className="grid grid-cols-2 gap-0">
                                        <textarea value={newComparisonLeft} onChange={(e) => setNewComparisonLeft(e.target.value)} placeholder="Khái niệm A..." rows={3} className="resize-none border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                        <textarea value={newComparisonRight} onChange={(e) => setNewComparisonRight(e.target.value)} placeholder="Khái niệm B..." rows={3} className="resize-none bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                    </div>
                                    <input type="text" value={newComparisonConclusion} onChange={(e) => setNewComparisonConclusion(e.target.value)} placeholder="Kết luận..." className="w-full border-t border-stone-200 bg-stone-50/80 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddForm(false)} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">Hủy</button>
                            <button type="button" onClick={handleAdd} disabled={!newTerm.trim() || !newDefinition.trim()} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-40">Lưu</button>
                        </div>
                    </div>
                )}

                {/* Edit Form - shown separately, not in popup */}
                {editingId && !isEditingPopup && (
                    <div className={`${cardClass} mb-8 max-w-4xl border-l-4 border-l-stone-300 p-6`}>
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Chỉnh sửa</h3>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"><X size={18} strokeWidth={1.5} /></button>
                        </div>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <input type="text" value={editTerm} onChange={(e) => setEditTerm(e.target.value)} placeholder="Thuật ngữ" className={inputClass} />
                            <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Chủ đề" className={inputClass} />
                        </div>
                        <div className="mb-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Định nghĩa</label>
                                <textarea value={editDefinition} onChange={(e) => setEditDefinition(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ví dụ thực tế</label>
                                <textarea value={editExample} onChange={(e) => setEditExample(e.target.value)} rows={4} className={`${inputClass} resize-none bg-stone-50/50`} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">So sánh</label>
                                <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40">
                                    <input type="text" value={editComparisonTitle} onChange={(e) => setEditComparisonTitle(e.target.value)} placeholder="Tiêu đề so sánh..." className="w-full border-b border-stone-200 bg-stone-50/80 px-4 py-2.5 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                    <div className="grid grid-cols-2 gap-0">
                                        <textarea value={editComparisonLeft} onChange={(e) => setEditComparisonLeft(e.target.value)} placeholder="Khái niệm A..." rows={3} className="resize-none border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                        <textarea value={editComparisonRight} onChange={(e) => setEditComparisonRight(e.target.value)} placeholder="Khái niệm B..." rows={3} className="resize-none bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                    </div>
                                    <input type="text" value={editComparisonConclusion} onChange={(e) => setEditComparisonConclusion(e.target.value)} placeholder="Kết luận..." className="w-full border-t border-stone-200 bg-stone-50/80 px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">Hủy</button>
                            <button type="button" onClick={handleSaveEdit} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"><Save size={14} strokeWidth={2} /> Lưu</button>
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                {isLoading ? (
                    <div className="py-20 text-center text-stone-500">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
                        <p className="text-sm">Đang tải...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className={`${cardClass} mx-auto max-w-md py-16 text-center`}>
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-400">
                            <BookOpen size={28} strokeWidth={1.25} />
                        </div>
                        <p className="text-sm text-stone-500">Không tìm thấy kiến thức nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredItems.map(item => {
                            const color = getColor(item.category);
                            return (
                                <div
                                    key={item.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedItem(item)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedItem(item); } }}
                                    className={`${cardClass} group cursor-pointer p-5 transition-colors hover:border-stone-300`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <span className={`inline-flex max-w-[85%] items-center rounded-full px-2.5 py-1 text-xs font-medium ${color.bg} ${color.text}`}>
                                            {item.category}
                                        </span>
                                        <span className="shrink-0 p-1 text-stone-300 transition-colors group-hover:text-stone-500" aria-hidden>
                                            <Eye size={16} strokeWidth={1.5} />
                                        </span>
                                    </div>
                                    <h3 className="text-base font-medium leading-snug tracking-tight text-stone-900 transition-colors group-hover:text-stone-700">
                                        {item.term}
                                    </h3>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal - Large 2-column layout with inline edit */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]" onClick={() => { setSelectedItem(null); cancelPopupEdit(); }}>
                    <div className={`${cardClass} max-h-[85vh] w-full max-w-4xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.08)]`} onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-stone-100 bg-stone-50/70 px-6 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    {isEditingPopup ? (
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                            <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full max-w-[10rem] rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-200/80 sm:w-32" />
                                            <input type="text" value={editTerm} onChange={(e) => setEditTerm(e.target.value)} className="w-full border-0 border-b border-stone-200 bg-transparent pb-1 text-xl font-normal tracking-tight text-stone-900 focus:border-stone-400 focus:outline-none" />
                                        </div>
                                    ) : (
                                        <>
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getColor(selectedItem.category).bg} ${getColor(selectedItem.category).text}`}>
                                                {selectedItem.category}
                                            </span>
                                            <h2 className="mt-2 text-xl font-normal tracking-tight text-stone-900 sm:text-2xl">{selectedItem.term}</h2>
                                        </>
                                    )}
                                </div>
                                <button type="button" onClick={() => { setSelectedItem(null); cancelPopupEdit(); }} className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-white hover:text-stone-600">
                                    <X size={20} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5">
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Định nghĩa
                                    </h4>
                                    {isEditingPopup ? (
                                        <textarea value={editDefinition} onChange={(e) => setEditDefinition(e.target.value)} rows={6} className={`${inputClass} resize-none`} />
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{selectedItem.definition}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex-1 rounded-2xl border border-stone-200/90 bg-white p-5">
                                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            Ví dụ thực tế
                                        </h4>
                                        {isEditingPopup ? (
                                            <textarea value={editExample} onChange={(e) => setEditExample(e.target.value)} rows={4} className={`${inputClass} resize-none bg-stone-50/30`} />
                                        ) : (
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                                                {selectedItem.example || <span className="italic text-stone-400">Chưa có ví dụ</span>}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex-1 rounded-2xl border border-stone-200/90 bg-stone-50/30 p-5">
                                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            So sánh
                                        </h4>
                                        {isEditingPopup ? (
                                            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                                                <input type="text" value={editComparisonTitle} onChange={(e) => setEditComparisonTitle(e.target.value)} placeholder="Tiêu đề so sánh..." className="w-full border-b border-stone-200 bg-stone-50/80 px-3 py-2 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                                <div className="grid grid-cols-2 gap-0">
                                                    <textarea value={editComparisonLeft} onChange={(e) => setEditComparisonLeft(e.target.value)} placeholder="Khái niệm A..." rows={3} className="resize-none border-r border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                                    <textarea value={editComparisonRight} onChange={(e) => setEditComparisonRight(e.target.value)} placeholder="Khái niệm B..." rows={3} className="resize-none px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                                </div>
                                                <input type="text" value={editComparisonConclusion} onChange={(e) => setEditComparisonConclusion(e.target.value)} placeholder="Kết luận..." className="w-full border-t border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-200/80" />
                                            </div>
                                        ) : (
                                            (() => {
                                                const comp = parseComparison(selectedItem.comparison);
                                                return comp.title || comp.left || comp.right || comp.conclusion ? (
                                                    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                                                        {comp.title && (
                                                            <div className="border-b border-stone-200 bg-stone-50/80 px-3 py-2">
                                                                <p className="text-sm font-semibold text-stone-900">{comp.title}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-stretch gap-0">
                                                            <div className="min-w-0 flex-1 p-3">
                                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{comp.left || <span className="italic text-stone-400">—</span>}</p>
                                                            </div>
                                                            <div className="w-px shrink-0 self-stretch bg-stone-200" />
                                                            <div className="min-w-0 flex-1 p-3">
                                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{comp.right || <span className="italic text-stone-400">—</span>}</p>
                                                            </div>
                                                        </div>
                                                        {comp.conclusion && (
                                                            <div className="border-t border-stone-200 bg-stone-50/80 px-3 py-2">
                                                                <p className="text-sm text-stone-800">{comp.conclusion}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm italic text-stone-400">Chưa có so sánh</span>
                                                );
                                            })()
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
                            {isEditingPopup ? (
                                <>
                                    <button type="button" onClick={cancelPopupEdit} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">Hủy</button>
                                    <button type="button" onClick={handleSaveEdit} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800">
                                        <Save size={14} strokeWidth={2} /> Lưu thay đổi
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" onClick={() => startEdit(selectedItem)} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50">
                                        <Edit2 size={14} strokeWidth={1.5} /> Sửa
                                    </button>
                                    <button type="button" onClick={() => handleDelete(selectedItem.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                                        <Trash2 size={14} strokeWidth={1.5} /> Xóa
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingKnowledge;
