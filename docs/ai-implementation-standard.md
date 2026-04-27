# OptiM.KI — AI Implementation Standard & Blueprint

> **Dành cho AI Coding Assistant:** Hãy đọc kỹ tài liệu này trước khi bắt đầu tạo bất kỳ tính năng (feature) hoặc trang (page) mới nào trong project này. Mục tiêu là đảm bảo sự đồng nhất tuyệt đối về UI/UX và kiến trúc hệ thống.

---

## 1. Danh mục Tính năng (Feature Registry)

Dựa trên cấu trúc Sidebar, hệ thống bao gồm các nhóm tính năng sau. Khi tạo tính năng mới, hãy xác định nó thuộc nhóm nào:

### 🛠 Nhóm 1: Models & Content (Chiến lược & Nội dung mẫu)
- **Opti M.KI (MỚI):** Core AI.
- **Mastermind:** Hệ thống chiến lược tổng thể.
- **IMC Planner:** Lập kế hoạch truyền thông tích hợp (Tham chiếu chuẩn cho Input Page).
- **STP Model:** Phân tích Phân khúc - Mục tiêu - Định vị.
- **PESTEL Builder:** Phân tích môi trường vĩ mô.
- **Porter's Analyzer:** Phân tích 5 lực lượng cạnh tranh.
- **Brand Vault:** Kho lưu trữ tài sản thương hiệu.
- **Persona Builder:** Xây dựng chân dung khách hàng.

### 💡 Nhóm 2: Idea Strategy AI (Sáng tạo & Ý tưởng)
- **Hook Generator:** Tạo tiêu đề/mở đầu thu hút.
- **Content Generator:** Tạo nội dung đa nền tảng.
- **Auto Brief:** Tự động hóa bản yêu cầu sáng tạo.

### 📈 Nhóm 3: Ads & Performance (Quảng cáo & Hiệu suất)
- **Budget Allocator:** Phân bổ ngân sách quảng cáo.
- **ROAS Calculator:** Tính toán tỷ suất lợi nhuận quảng cáo.
- **Ads Health:** Kiểm tra sức khỏe tài khoản quảng cáo.

---

## 2. Tiêu chuẩn Giao diện Input (Input Page Standard)

Mọi trang nhập liệu cho tính năng AI **PHẢI** tuân thủ cấu trúc của file [imc-input-design-system.md](file:///d:/MKTLABB2/docs/imc-input-design-system.md).

### Cấu trúc bắt buộc của một Feature Page:
1. **Layout Wrapper:** `flex h-screen flex-col overflow-hidden bg-[#FCFDFC]`
2. **Header:** Sử dụng component `<FeatureHeader />` với:
   - `eyebrow`: Định dạng `AI-POWERED [DOMAIN] ENGINE` (10px bold uppercase).
   - `title`: Tên tính năng (24px semibold).
   - `subline`: Mô tả ngắn gọn quy trình 2-3 bước.
   - `right actions`: Quota indicator, Tab switcher (Thủ công/Vault), History button, và Primary CTA button "Tạo...".
3. **Content Area:** 
   - Sử dụng thẻ `cardClass` (rounded-2xl, border-stone-200, shadow-sm).
   - Sử dụng **Wizard Steps** (Giai đoạn 1, 2, 3...) nếu nhập liệu phức tạp.
   - Các trường nhập liệu dùng component `<ImcPlannerEditorialField />`.

---

## 3. Tiêu chuẩn Sidebar & Điều hướng (Navigation Standard)

Khi thêm tính năng mới, AI phải cập nhật file `components/Sidebar.tsx` theo đúng style tại [sidebar-design-system.md](file:///d:/MKTLABB2/docs/sidebar-design-system.md):

- **Font:** Plus Jakarta Sans.
- **Color:** Background `#FCFDFC`, Active item có màu nền nhạt hoặc text đậm hơn.
- **Hierarchy:** Phân cấp rõ ràng theo `NavGroup` (có icon Lucide tương ứng).
- **Badge:** Sử dụng badge "MỚI" (màu cam nhạt `#FFF7ED` text `#C2410C`) cho các tính năng vừa cập nhật.

---

## 4. Stack Công nghệ & Quy tắc Code

- **Framework:** React + TypeScript.
- **Styling:** Tailwind CSS (Ưu tiên dùng inline classes, KHÔNG tạo file CSS mới trừ khi thực sự cần thiết).
- **Icons:** `lucide-react` (Stroke width: 1.5 hoặc 2 tùy vị trí).
- **Design Philosophy:** Minimalist, Editorial, High-end (Sử dụng palette màu Stone/Slate).
- **Components:** Tái sử dụng tối đa các thành phần trong thư mục `components/`.

---

## 5. Quy trình tạo Tính năng mới (Workflow)

Nếu tôi yêu cầu bạn "Tạo tính năng X", hãy làm theo các bước:

1. **Phân tích:** Xác định X thuộc nhóm nào trong Sidebar.
2. **Tạo Component:** Tạo file `components/XFeature.tsx` dựa trên template của `IMCPlanner.tsx`.
3. **Thiết kế Form:** Chia giai đoạn (wizard) và các field (EditorialField) phù hợp với X.
4. **Cập nhật Điều hướng:** Thêm mục X vào đúng nhóm trong `Sidebar.tsx`.
5. **Đăng ký Route:** Thêm route cho X trong `App.tsx`.
6. **Kiểm tra:** Đảm bảo `eyebrow`, `title` và màu sắc đồng bộ với hệ thống hiện tại.

---

> **Lưu ý:** Tuyệt đối không tự ý đổi Font, không dùng màu sắc sặc sỡ (Red, Blue, Green nguyên bản). Chỉ dùng các tone màu trung tính (Stone, Slate) và các accent color đã được định nghĩa trong `index.html`.
