# OptiMKT

OptiMKT là một workspace marketing AI local-first, gom nhiều tính năng tạo nội dung, phân tích chiến lược, vận hành campaign, và lưu lịch sử làm việc trong cùng một app.

Repo này chạy theo mô hình:

- Frontend: `React 19 + Vite + TypeScript`
- Backend local: `Express`
- Persistence: `Supabase`
- AI layer: gọi qua local proxy và các service AI trong repo

## Mục tiêu dự án

Ứng dụng được xây để hỗ trợ team marketing hoặc founder xử lý nhanh các nhóm việc:

- sinh nội dung và creative
- lập kế hoạch và framework chiến lược
- lưu và mở lại lịch sử làm việc
- quản lý một số công cụ marketing nội bộ trong cùng dashboard

Các module hiện diện trong app gồm nhiều nhóm như:

- `Opti M.KI Engine`
- `PESTEL`, `Porter`, `STP`, `IMC`
- `Brand Vault`, `Brand Positioning`, `Persona`
- `Content Generator`, `Hook Generator`, `Auto Brief`
- `ROAS`, `Budget Allocator`, `Ads Health`
- `News`, `Toolkit`, `Visual/Mockup` tools

## Tech Stack

- `React 19`
- `Vite 6`
- `TypeScript`
- `React Router`
- `Supabase`
- `Firebase Auth`
- `Express`
- `html-to-image`, `html2canvas`, `jsPDF`
- `Lucide React`, `Framer Motion`, `Recharts`

## Yêu cầu môi trường

- `Node.js` 18+
- `npm`
- Một project `Supabase` nếu bạn muốn bật lưu lịch sử / database features
- API key AI nếu bạn muốn dùng các tính năng sinh nội dung / phân tích

## Cài đặt

1. Cài dependencies

```bash
npm install
```

2. Tạo file env local

```bash
cp .env.example .env.local
```

Nếu đang dùng Windows PowerShell và chưa có `cp`, bạn có thể copy file thủ công từ `.env.example` sang `.env.local`.

3. Điền biến môi trường cần thiết trong `.env.local`

Tối thiểu, nên có:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
```

Tuỳ chọn:

```env
VITE_BACKEND_URL=http://localhost:3011
OPENAI_MODEL_FREE=gpt-4.1-mini
OPENAI_MODEL_PRO=gpt-4.1
OPENAI_MODEL_PROMAX=gpt-5.4
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Chạy local

Chạy cả frontend Vite và server local:

```bash
npm run start
```

App mặc định:

- Frontend: `http://localhost:3000`
- Backend local: `http://localhost:3011`

Nếu cần chạy riêng:

```bash
npm run dev
npm run server
```

## Scripts

```bash
npm run dev      # chạy frontend Vite
npm run server   # chạy Express server local
npm run start    # chạy frontend + server cùng lúc
npm run build    # build production
npm run preview  # preview bản build
```

## Cấu trúc thư mục chính

```text
components/   UI components và các feature màn hình
services/     business logic, AI requests, save/load data
lib/          client setup, helpers nền tảng
server/       code backend phụ trợ
functions/    serverless / function-style scripts
docs/         guideline, design system, tài liệu dự án
supabase/     tài nguyên liên quan Supabase
scripts/      utility scripts
```

Một vài file quan trọng:

- [App.tsx](D:\MKTLABB2\App.tsx): router và app shell
- [server.js](D:\MKTLABB2\server.js): local backend / proxy
- [lib/supabase.ts](D:\MKTLABB2\lib\supabase.ts): Supabase client
- [services/geminiService.ts](D:\MKTLABB2\services\geminiService.ts): AI service layer chính
- [components/result-design-system.css](D:\MKTLABB2\components\result-design-system.css): token và pattern dùng chung cho result pages
- [docs/design-guidelines.md](D:\MKTLABB2\docs\design-guidelines.md): hướng dẫn giao diện kết quả

## Kiến trúc chạy app

Luồng cơ bản:

1. Người dùng thao tác trên frontend
2. Component gọi `services/*`
3. Service có thể:
   - gọi AI qua local server hoặc client wrapper
   - đọc/ghi Supabase
   - xử lý format dữ liệu, export, render report
4. Kết quả được render lại thành page kết quả hoặc lưu lịch sử

## Database và persistence

Repo này đang dùng `Supabase` cho nhiều tính năng lưu cloud history và dữ liệu người dùng.

Nếu chưa cấu hình Supabase:

- app vẫn có thể chạy một phần
- một số tính năng lưu lịch sử / đồng bộ sẽ bị tắt hoặc fallback

Các file SQL cũ hiện nằm chủ yếu ở:

- [docs/legacy-sql](D:\MKTLABB2\docs\legacy-sql)

## AI và biến môi trường

Hiện tại repo có lớp service AI và local proxy. Tên biến môi trường trong code hiện đang xoay quanh:

- `OPENAI_API_KEY`
- `VITE_BACKEND_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- nhóm biến `Firebase`

Lưu ý:

- đừng commit `.env.local`
- nếu thiếu key AI, các tính năng phân tích / generate sẽ lỗi hoặc bị tắt
- nếu thiếu Supabase, các tính năng cần database có thể không hoạt động đầy đủ

## UI Result Design System

Các trang kết quả nên dùng chung design system tại:

- [components/result-design-system.css](D:\MKTLABB2\components\result-design-system.css)
- [docs/design-guidelines.md](D:\MKTLABB2\docs\design-guidelines.md)

Nguồn tham chiếu hiện tại là `Opti M.KI Engine`.

Các pattern đã chuẩn hoá gồm:

- sticky result navbar
- section header pattern
- badge / chip pattern
- premium lock card / pro gate pattern

## AI plan routing

Repo hiện đã có lớp policy để map `subscription tier -> model` ở backend.

Flow:

1. Frontend gửi `plan`, `feature`, `taskType`
2. Local backend chọn model thật
3. Backend thử model ưu tiên trước, nếu model không available thì fallback sang candidate tiếp theo

File chính:

- [lib/ai-model-policy.js](D:\MKTLABB2\lib\ai-model-policy.js)
- [server.js](D:\MKTLABB2\server.js)

Biến môi trường có thể override theo plan:

```env
OPENAI_MODEL_FREE=gpt-4.1-mini
OPENAI_MODEL_PRO=gpt-4.1
OPENAI_MODEL_PROMAX=gpt-5.4
```

Ví dụ hiện tại `Opti M.KI Engine` đã gửi `tier` vào luồng generate để backend tự chọn model theo plan.

## Quy ước phát triển trong repo này

Trước khi sửa code, nên đọc:

- [AGENTS.md](D:\MKTLABB2\AGENTS.md)
- [docs/design-guidelines.md](D:\MKTLABB2\docs\design-guidelines.md)
- [.claude/workflows/development-rules.md](D:\MKTLABB2\.claude\workflows\development-rules.md)

Một vài nguyên tắc quan trọng đang áp dụng:

- ưu tiên `YAGNI`, `KISS`, `DRY`
- sửa trực tiếp file hiện có, không tạo bản `enhanced` song song
- giữ UI result pages theo cùng một visual system
- đảm bảo code build được sau thay đổi

## Troubleshooting

### App chạy nhưng AI không phản hồi

Kiểm tra:

- `.env.local` đã có `OPENAI_API_KEY`
- local server đã chạy bằng `npm run start` hoặc `npm run server`
- `VITE_BACKEND_URL` có đúng nếu bạn override backend URL

### Không lưu được lịch sử

Kiểm tra:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- bảng / policy tương ứng đã được tạo trong Supabase

### Đăng nhập không hoạt động

Kiểm tra nhóm biến `Firebase` trong `.env.local`.

## Build production

```bash
npm run build
```

Sau đó preview local:

```bash
npm run preview
```

## Ghi chú

- Repo này đang chứa nhiều module và có dấu hiệu phát triển theo thời gian, nên không phải thư mục nào cũng theo một kiến trúc đồng nhất hoàn toàn.
- Khi thêm tính năng mới, ưu tiên reuse service, token, và result pattern đã có thay vì tạo hệ mới.

## License

Chưa khai báo license trong repo.
