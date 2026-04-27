# Sidebar Navigation Registry — OptiM.KI

> Source: `Sidebar.tsx` · 2026-04-26  
> **Mục đích:** Danh sách CHÍNH XÁC toàn bộ tên và ViewState ID của mọi item trong sidebar. AI KHÔNG được đặt tên khác.

---

## Logo / Home

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `HOME_DASHBOARD` | **OptiM.KI** (logo text) | `Sparkles` |

---

## NavGroup: "Models & Content"

> Icon nhóm: `Brain` · Default: expanded

| ViewState ID | Label hiển thị | Icon | Badge |
|---|---|---|---|
| `OPTIMKI_BUILDER` | **Opti M.KI Engine** | `Sparkles` | `Mới` |
| `MASTERMIND_STRATEGY` | **Mastermind Strategy** | `Brain` | — |
| `IMC_PLANNER` | **IMC Planner** | `Target` | — |
| `STP_MODEL` | **STP Model** | `Layers` | — |
| `PESTEL_BUILDER` | **PESTEL Builder** | `Globe` | — |
| `PORTER_ANALYZER` | **Porter's Analyzer** | `Target` | — |
| `STRATEGIC_MODELS` | **Strategic Models** | `Target` | — |
| `INSIGHT_FINDER` | **Insight Finder** | `BrainCircuit` | — |
| `CUSTOMER_JOURNEY_MAPPER` | **Customer Journey** | `Map` | — |
| `BRAND_VAULT` | **Brand Vault** | `ShieldCheck` | — |
| `PERSONA_BUILDER` | **Persona Builder** | `Users` | — |
| `RIVAL_RADAR` | **Rival Radar** | `Radar` | — |
| `BRAND_POSITIONING_BUILDER` | **Brand Positioning** | `Compass` | — |
| `PRICING_ANALYZER` | **Pricing Analyzer** | `DollarSign` | — |
| `AUDIENCE_EMOTION_MAP` | **Audience Emotion Map** | `Heart` | — |

---

## NavGroup: "Idea Strategy AI"

> Icon nhóm: `Lightbulb` · Default: collapsed

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `HOOK_GENERATOR` | **Hook Generator** | `Zap` |
| `CONTENT_WRITER` | **Viết Content** | `PenTool` |
| `MINDMAP_GENERATOR` | **Mindmap AI** | `BrainCircuit` |
| `SCAMPER_TOOL` | **SCAMPER Ideation** | `Lightbulb` |
| `SMART_CALENDAR` | **Smart Content Calendar** | `CalendarDays` |
| `AUTO_BRIEF` | **Auto Brief** | `FileText` |
| `SOP_BUILDER` | **SOP Builder** | `FileCheck` |
| `CREATIVE_ANGLE_EXPLORER` | **Creative Angle Explorer** | `Lightbulb` |

---

## NavGroup: "Design & Visuals"

> Icon nhóm: `ImageIcon` · Default: collapsed

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `VISUAL_EMAIL` | **Visual Email** | `Mail` |
| `FRAME_VISUAL` | **Frame Visual** | `Film` |
| `MOCKUP_GENERATOR` | **Mockup Generator** | `MonitorPlay` |
| `KEY_VISUALS_CREATE` | **Tạo dự án KV** | `PlusSquare` |
| `KEY_VISUALS_LIST` | **Danh sách KV** | `List` |
| `CHAIN_LINK` | **Chain Link** | `Link2` |

---

## NavGroup: "Ads & Performance"

> Icon nhóm: `TrendingUp` · Default: collapsed

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `BUDGET_ALLOCATOR` | **Budget Allocator** | `PieChart` |
| `UTM_BUILDER` | **UTM Builder** | `Link2` |
| `AB_TESTING` | **A/B Testing Calc** | `Calculator` |
| `ROAS_FORECASTER` | **ROAS Forecaster** | `TrendingUp` |
| `ADS_HEALTH_CHECKER` | **Ads Health Checker** | `Activity` |

---

## ── Divider ──

---

## NavGroup: "Quản lý Plan"

> Icon nhóm: `CreditCard` · Default: collapsed

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `PLAN_CALENDAR` | **Lịch thanh toán** | `Calendar` |
| `PLAN_LIST` | **Danh sách Plans** | `List` |

---

## Single Nav Items (không có dropdown)

> Hiển thị trực tiếp, không thuộc NavGroup nào

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `TODO` | **To-Do List** | `CheckSquare` |
| `NEWS_AGGREGATOR` | **Tin Tức Tổng Hợp** | `Globe` |
| `MARKETING_KNOWLEDGE` | **Kho Kiến Thức** | `BookOpen` |
| `TOOLKIT` | **Bộ Công Cụ** | `Zap` |

---

## User Menu (bottom, không phải nav item)

> Hiện ra khi click vào avatar/tên user ở cuối sidebar

| ViewState ID | Label hiển thị | Icon |
|---|---|---|
| `FEATURES_GUIDE` | **Hướng dẫn sử dụng** | `HelpCircle` |
| `LANDING_INTRO` | **Xem Landing Page** | `Rocket` |
| — | **Đăng xuất** | `LogOut` |

---

## Version

```
v1.7.0 · OptiM.KI
```

---

## Quy tắc bắt buộc cho AI

1. **Tên label PHẢI giữ nguyên** — không được dịch, rút gọn, hay đổi tên
2. **ViewState ID PHẢI đúng** — dùng đúng string constant khi `setView()`
3. **Số lượng item PHẢI đủ** — tổng cộng:
   - Models & Content: **15 items**
   - Idea Strategy AI: **8 items**
   - Design & Visuals: **6 items**
   - Ads & Performance: **5 items**
   - Quản lý Plan: **2 items** (dropdown)
   - Single items: **4 items**
4. **Icon đúng theo bảng** — import từ `lucide-react`
5. **Badge "Mới"** chỉ có ở `OPTIMKI_BUILDER`, style: `bg-[#FFE8D6] text-[#C45C26]`
6. **Thứ tự nhóm** trong sidebar (từ trên xuống):
   - Models & Content
   - Idea Strategy AI
   - Design & Visuals
   - Ads & Performance
   - ── divider ──
   - Quản lý Plan
   - To-Do List
   - Tin Tức Tổng Hợp
   - Kho Kiến Thức
   - Bộ Công Cụ
