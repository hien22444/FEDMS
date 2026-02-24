# FEDOM Frontend — Review & Documentation
> Senior Code Review | Updated: 2026-02-22

---

## 1. TỔNG QUAN

**FEDOM** là frontend của hệ thống quản lý ký túc xá FPT University.

| Thành phần | Chi tiết |
|-----------|---------|
| Framework | React 19 + TypeScript + Vite |
| UI Library | Ant Design 5 + Tailwind CSS + Lucide React |
| State | MobX + React Context + TanStack React Query |
| Routing | React Router DOM 6 |
| Auth | JWT (localStorage) + Google OAuth |
| Charts | Recharts |

---

## 2. TẤT CẢ ROUTES & PAGES

### 2.1 Public Routes (không cần auth)

| Path | Component | Mô tả |
|------|-----------|-------|
| `/` | LandingPage | Trang chủ giới thiệu |
| `/signin` | SignInPage | Đăng nhập Student/Manager |
| `/signup` | SignUpPage | Đăng ký tài khoản |
| `/admin/login` | AdminLoginPage | Đăng nhập Admin (trang riêng) |
| `/auth/google/callback` | GoogleCallbackPage | Xử lý Google OAuth callback |
| `*` | NotFoundPage | 404 |

### 2.2 Student Routes — `role: 'student'` — Layout: `StudentLayout`

| Path | Component | Trạng thái |
|------|-----------|-----------|
| `/student/dashboard` | StudentDashboard | ✅ Có UI (data hardcode) |
| `/student/news` | NewsPage | 🔲 Placeholder |
| `/student/schedule` | SchedulePage | 🔲 Placeholder |
| `/student/booking` | BookingPage | 🔲 Placeholder |
| `/student/utilities` | UtilitiesPage | 🔲 Placeholder |
| `/student/payment` | PaymentPage | 🔲 Placeholder |
| `/student/requests` | RequestsPage | ✅ Kết nối API |
| `/student/cfd-points` | CFDPage | 🔲 Placeholder |
| `/student/guidelines` | GuidelinesPage | 🔲 Placeholder |
| `/student/maintenance` | MaintenancePage | 🔲 Placeholder |
| `/student/faq` | FAQPage | 🔲 Placeholder |
| `/student/dorm-rules` | DormRulesPage | 🔲 Placeholder |
| `/student/notifications` | NotificationsPage | ✅ Kết nối API |

**3/13 trang Student có nội dung thực (Dashboard, Requests, Notifications).**

### 2.3 Security Routes — `role: 'security'` — Layout: `SecurityLayout`

| Path | Component | Trạng thái |
|------|-----------|-----------|
| `/security` | DashboardPage | ✅ Có UI |
| `/security/camera-checkin` | CameraCheckinPage | ✅ Có UI |
| `/security/checkout-requests` | CheckoutRequestsPage | ✅ Có UI |
| `/security/visitors` | VisitorsPage | ✅ Có UI |

### 2.4 Manager Routes — `role: 'manager'` — Layout: `ManagerLayout`

| Path | Component | Trạng thái |
|------|-----------|-----------|
| `/manager` | ManagerDashboardPage | ✅ Có UI (data hardcode) |
| `/manager/violations` | ViolationListPage | ✅ Kết nối API |
| `/manager/violations/create` | CreateViolationPage | ✅ Kết nối API |
| `/manager/bed-statistics` | BedStatisticsPage | ✅ Có UI (data hardcode) |
| `/manager/dorms` | ComingSoon | 🔲 Chưa làm |
| `/manager/blocks` | ComingSoon | 🔲 Chưa làm |
| `/manager/rooms` | ComingSoon | 🔲 Chưa làm |
| `/manager/beds` | ComingSoon | 🔲 Chưa làm |
| `/manager/bookings` | ComingSoon | 🔲 Chưa làm |
| `/manager/checkout` | ComingSoon | 🔲 Chưa làm |
| `/manager/facilities` | ComingSoon | 🔲 Chưa làm |
| `/manager/requests` | ComingSoon | 🔲 Chưa làm |
| `/manager/electricity/*` | ComingSoon (3 sub) | 🔲 Chưa làm |
| `/manager/invoices` | ComingSoon | 🔲 Chưa làm |
| `/manager/news` | ComingSoon | 🔲 Chưa làm |
| `/manager/chat` | ComingSoon | 🔲 Chưa làm |
| `/manager/email` | ComingSoon | 🔲 Chưa làm |
| `/manager/notifications` | ComingSoon | 🔲 Chưa làm |
| `/manager/config` | ComingSoon | 🔲 Chưa làm |
| `/manager/settings` | ComingSoon | 🔲 Chưa làm |

**Chỉ 3/20 trang Manager có nội dung thực.**

### 2.5 Admin Routes — `role: 'admin'` — Layout: `AdminLayout`

| Path | Component | Trạng thái |
|------|-----------|-----------|
| `/admin` | AdminDashboardPage | ✅ Có UI (data hardcode) |
| `/admin/dorms` | AdminDormsPage | ✅ Kết nối API |
| `/admin/blocks` | AdminBlocksPage | ✅ Kết nối API |
| `/admin/users` | AdminUsersPage | ✅ Kết nối API (import + list) |
| `/admin/facilities` | AdminFacilitiesPage | ✅ Kết nối API (Equipment) |
| `/admin/reports` | ComingSoon | 🔲 Chưa làm |
| `/admin/data` | ComingSoon | 🔲 Chưa làm |

**5/7 trang Admin có nội dung thực.**

---

## 3. API ACTIONS LAYER

### 3.1 Authentication — `src/lib/actions/auth.ts`

| Function | Method | Endpoint | Mô tả |
|----------|--------|----------|-------|
| `signIn` | POST | `auth/login` | Đăng nhập, lưu token vào localStorage |
| `signUp` | POST | `auth/register` | Đăng ký, tự lưu token |
| `logout` | — | — | Xóa localStorage tokens |
| `getProfile` | GET | `auth/profile` | Lấy user + profile hiện tại |
| `refreshAccessToken` | POST | `auth/refresh-token` | Làm mới access token |

### 3.2 Admin Actions — `src/lib/actions/admin.ts`

#### Auth Admin
| Function | Method | Endpoint |
|----------|--------|----------|
| `adminLogin` | POST | `v1/auth/login` |

#### Dorm Management
| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchDorms` | GET | `v1/dorms?page&limit&search` |
| `createDorm` | POST | `v1/dorms` |
| `updateDorm` | PATCH | `v1/dorms/{id}` |
| `deleteDorm` | DELETE | `v1/dorms/{id}` |

#### Block Management
| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchBlocks` | GET | `v1/blocks?page&limit&dorm` |
| `getBlockById` | GET | `v1/blocks/{id}` |
| `createBlock` | POST | `v1/blocks` |
| `updateBlock` | PATCH | `v1/blocks/{id}` |
| `deleteBlock` | DELETE | `v1/blocks/{id}` |

#### User Management
| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchUsers` | GET | `users?page&limit&search&role` |
| `importUsersFromExcel` | POST | `users/import-excel` (FormData) |
| `deleteUser` | DELETE | `users/{id}` |

#### Equipment Management *(Mới từ dev)*
| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchEquipmentCategories` | GET | `v1/equipment/categories` |
| `createEquipmentCategory` | POST | `v1/equipment/categories` |
| `updateEquipmentCategory` | PATCH | `v1/equipment/categories/{id}` |
| `deleteEquipmentCategory` | DELETE | `v1/equipment/categories/{id}` |
| `fetchEquipmentTemplates` | GET | `v1/equipment/templates` |
| `createEquipmentTemplate` | POST | `v1/equipment/templates` |
| `updateEquipmentTemplate` | PATCH | `v1/equipment/templates/{id}` |
| `deleteEquipmentTemplate` | DELETE | `v1/equipment/templates/{id}` |
| `fetchRoomTypeConfigs` | GET | `v1/equipment/room-type-configs` |
| `createRoomTypeConfig` | POST | `v1/equipment/room-type-configs` |
| `updateRoomTypeConfig` | PATCH | `v1/equipment/room-type-configs/{id}` |
| `deleteRoomTypeConfig` | DELETE | `v1/equipment/room-type-configs/{id}` |

### 3.3 Visitor Actions — `src/lib/actions/visitor.ts`

| Function | Method | Endpoint |
|----------|--------|----------|
| `getMyVisitorRequests` | GET | `visitors/requests/my` |
| `createVisitorRequest` | POST | `visitors/requests` |
| `cancelVisitorRequest` | PATCH | `visitors/requests/{id}/cancel` |
| `getAllVisitorRequests` | GET | `visitors/requests` |
| `approveVisitorRequest` | PATCH | `visitors/requests/{id}/approve` |
| `rejectVisitorRequest` | PATCH | `visitors/requests/{id}/reject` |
| `checkinVisitor` | POST | `visitors/requests/{id}/checkin` |
| `checkoutVisitor` | PATCH | `visitors/checkins/{id}/checkout` |
| `completeVisitorRequest` | PATCH | `visitors/requests/{id}/complete` |
| `getActiveVisitors` | GET | `visitors/active` |

### 3.4 Notification Actions — `src/lib/actions/notification.ts`

| Function | Method | Endpoint |
|----------|--------|----------|
| `getMyNotifications` | GET | `notifications` |
| `markNotificationAsRead` | PATCH | `notifications/{id}/read` |
| `markAllNotificationsRead` | PATCH | `notifications/read-all` |
| `deleteNotification` | DELETE | `notifications/{id}` |

### 3.5 Violation Actions — `src/lib/actions/violation.ts`

| Function | Method | Endpoint |
|----------|--------|----------|
| `getViolationReports` | GET | `violations?page&limit&status&type&startDate&endDate` |
| `getViolationReportById` | GET | `violations/{id}` |
| `createViolationReport` | POST | `violations` |
| `reviewViolationReport` | PUT | `violations/{id}/review` |
| `deleteViolationReport` | DELETE | `violations/{id}` |
| `searchStudentByCode` | GET | `violations/search-student?code=...` |
| `getStudentPenalties` | GET | `violations/student/{code}/penalties` |
| `getViolationStatistics` | GET | `violations/statistics` |

### 3.6 HTTP Client — `src/lib/apiRequest.ts`

```
Base URL: import.meta.env.VITE_BASE_URL

Methods: get<T>, post<T>, put<T>, patch<T>, delete<T>

Auto-attach: Authorization: Bearer {token}

Error handling:
  - 401 → tự động gọi refresh-token
  - Nếu refresh thất bại → xóa token + redirect /signin
  - Deduplication: nhiều requests 401 đồng thời chỉ gọi refresh 1 lần

FormData: Không set Content-Type (để browser tự set multipart/form-data)

Response: { data: T } hoặc { success: true, data: T }
```

---

## 4. STATE MANAGEMENT

### 4.1 AuthContext — `src/contexts/AuthContext.tsx`

**State:**
| Field | Type | Mô tả |
|-------|------|-------|
| `isAuthenticated` | boolean | Đã đăng nhập chưa |
| `isLoading` | boolean | Đang kiểm tra auth |
| `user` | `IUser.Response \| null` | Info user (id, email, role) |
| `profile` | `IUser.StudentProfile \| null` | Profile chi tiết (student) |

**Methods:**
| Method | Mô tả |
|--------|-------|
| `login(token, user, profile?)` | Set auth state |
| `logout()` | Xóa token + redirect landing |
| `refreshProfile()` | Fetch lại profile từ API |

**Tính năng đặc biệt:**
- **Inactivity timeout:** 30 phút không hoạt động → tự logout
- **Activity tracking:** Throttled 60s — lắng nghe `mousedown`, `keydown`, `scroll`, `touchstart`
- **Token validation on mount:** Kiểm tra token hợp lệ khi app khởi động
- **Auto refresh on 401:** Token hết hạn → tự refresh

**LocalStorage keys:**

| Key | Mục đích |
|-----|---------|
| `token` | JWT access token |
| `refreshToken` | Refresh token |
| `lastActivity` | Timestamp hoạt động cuối |
| `device_id` | Device identifier |
| `admin-token` | Token admin (dùng khác key!) |
| `theme` | Theme preference |

### 4.2 PrivateRoute — `src/components/unix/PrivateRoute.tsx`

```
Kiểm tra:
  1. isLoading → hiển thị loading
  2. !isAuthenticated → redirect /signin
  3. allowedRoles có set và role không khớp → redirect /signin
```

### 4.3 Contexts chưa dùng
- **PrivateContext.tsx** — Empty, không implement
- **AppContext.tsx** — Provide `null`, không dùng ở đâu

### 4.4 MobX UserStore — `src/stores/user.store.ts`
- Store đơn giản với getter/setter/reset
- Dùng ít, phần lớn state qua AuthContext

---

## 5. LAYOUTS

### 5.1 AdminLayout
- **Sidebar:** 280px, màu orange-600, fixed
- **Components:** `AdminSidebar` + main content
- **Menu:**
  - Dashboard
  - Dorm Management (`/admin/dorms`)
  - Block Management (`/admin/blocks`)
  - Facility Management (`/admin/facilities`)
  - User Management (`/admin/users`)
  - Reports (Coming Soon)
  - Data (Coming Soon)

### 5.2 ManagerLayout
- **Sidebar:** 280px, orange-600, fixed
- **Header:** `ManagerHeader` (fixed top, `pt-16` cho content)
- **Main:** `ml-[280px]`
- **Menu Groups:**
  - Dashboard (Dashboard, Bed Statistics)
  - Dormitory Mgmt (Dorms, Blocks, Rooms, Beds)
  - Student Mgmt (Booking, Checkout, Login as Student)
  - Violation & Discipline (List, Create)
  - Facilities & Requests
  - Electricity & Billing
  - Communication (Chat, Email, Notifications)
  - System Settings (Config, Settings)
- **Icons:** `react-icons/ri` library

### 5.3 StudentLayout
- **Sidebar:** Collapsible — 240px / 80px khi thu gọn
- **Logo:** "DOM" (FPT Dormitory)
- **User Info:** Avatar, full_name, student_code, behavioral_score (CFD)
- **Menu:** Home, News, Schedule, Booking, Utilities, Payment, Requests, CFD Points, Guidelines, Maintenance, FAQ, Dorm Rules, Notifications
- **Footer:** Logout button

### 5.4 SecurityLayout
- **Header:** Màu `#FF5C00` (orange), logo
- **Nav:** Tab-style với icons
- **Items:** Overview, Camera Checkin, Checkout Requests, Visitors
- **Features:** Bell notification icon, logout button

---

## 6. WORKFLOW & NGHIỆP VỤ

### 6.1 Authentication Flow
```
User nhập email + password
  ↓
POST auth/login → nhận { token, refreshToken, user, profile }
  ↓
Lưu localStorage: 'token', 'refreshToken'
  ↓
AuthContext.login(token, user, profile)
  ↓
PrivateRoute cho phép vào trang tương ứng theo role

Token hết hạn (401):
  apiRequest nhận 401
    ↓
  Gọi POST auth/refresh-token { refreshToken }
  (Deduplicated — nhiều requests cùng lúc chỉ gọi 1 lần)
    ↓
  Nhận token mới → retry request gốc
    ↓
  Nếu refresh thất bại → logout + redirect /signin

Inactivity 30 phút:
  AuthContext phát hiện → tự gọi logout()
```

### 6.2 Google OAuth Flow
```
User click "Login with Google"
  ↓
Redirect đến /auth/google (BE) → Google consent
  ↓
Google → BE callback → BE lưu tokens vào in-memory store (TTL 5 phút)
  ↓
BE redirect FE: /auth/google/callback?code=<64-char-opaque-hex>  [KHÔNG có token trong URL]
  ↓
GoogleCallbackPage gọi GET /auth/google/exchange?code=<code>
  (guard: useRef để tránh React 18 StrictMode double-invoke)
  ↓
BE xóa code (single-use) → trả về { token, refreshToken, user, profile }
  ↓
AuthContext.login() → Navigate đến dashboard theo role
```

### 6.3 Admin — Quản lý Dorm & Block
```
AdminDormsPage / AdminBlocksPage:
  Mount → fetchDorms/fetchBlocks() → hiển thị Table

Tạo mới:
  Click "Add" → mở Modal
  Fill form → Submit → createDorm/createBlock()
  Success → đóng Modal + reload list

Chỉnh sửa:
  Click "Edit" ở row → mở Modal (pre-fill data)
  Submit → updateDorm/updateBlock()
  Success → reload list

Xóa:
  Click "Delete" → xác nhận Popconfirm
  Confirm → deleteDorm/deleteBlock()
  Success → reload list
```

### 6.4 Admin — Import Excel Users
```
AdminUsersPage → Tab "Import Excel":
  Drag-drop hoặc click upload file .xlsx/.xls
    ↓
  importUsersFromExcel(file) → POST FormData
    ↓
  Hiển thị kết quả:
    - Summary: total / success / failed
    - Table "Imported": row, email, role, code
    - Table "Errors": row, email, error message

Tab "User List":
  fetchUsers({page, limit, search, role}) → hiển thị Table
  Filter theo role (dropdown)
  Search theo email/name
  Delete: Popconfirm → deleteUser(id)
    (Không xóa được admin accounts)
```

### 6.5 Admin — Equipment Management
```
AdminFacilitiesPage (802 lines):
  3 tabs: Categories | Templates | Room Type Configs

Tab Categories:
  fetchEquipmentCategories() → Table
  Create/Edit: Modal form (category_name, description)
  Delete: Popconfirm

Tab Templates:
  fetchEquipmentTemplates() → Table (với filter category, is_active)
  Create/Edit: Modal form (equipment_name, category, brand, model, unit_price, ...)
  Delete: Popconfirm

Tab Room Type Configs:
  fetchRoomTypeConfigs() → Table
  Create/Edit: Modal form (room_type, template, standard_quantity, is_mandatory)
  Delete: Popconfirm
```

### 6.6 Manager — Violation Management
```
ViolationListPage:
  Mount → getViolationReports() + getViolationStatistics()
  Hiển thị:
    - 4 stat cards (Total, Pending, Penalized, Penalties this semester)
    - Table với filters (status, type, date range, student code search)
    - Actions: View detail, Delete (chỉ status=new)

CreateViolationPage:
  Tìm SV: searchStudentByCode(code) → hiển thị info SV
  Fill form: violation_type, description, violation_date, location, evidence_urls
  Submit: createViolationReport(data)
  Success: redirect về list

Chi tiết:
  getViolationReportById(id)
  Manager review: reviewViolationReport(id, { status, penalty_type, points_deducted, reason })
```

---

## 7. SENIOR CODE REVIEW — VẤN ĐỀ

### 🔴 CRITICAL

#### C1. Dashboard data hoàn toàn hardcode
**Files:** `src/pages/manager/dashboard/page.tsx`, `src/pages/admin/dashboard/index.tsx`
**Vấn đề:**
```typescript
// manager/dashboard
const dashboardStats = {
  totalDorms: 5, totalBlocks: 25, totalRooms: 580,
  totalBeds: 2315, occupiedBeds: 1847, // TẤT CẢ FAKE
}
```
**Hậu quả:** Dashboard hiển thị số liệu giả, không phản ánh thực tế hệ thống.
**Fix:** Gọi API thống kê từ BE.

#### C2. Token key không nhất quán
**Vấn đề:**
- `AuthContext.tsx` lưu: `localStorage.setItem('token', ...)` và `localStorage.setItem('refreshToken', ...)`
- `localStorages.ts` dùng: key `'admin-token'` và `'refresh-token'`
**Hậu quả:** Admin panel và student panel có thể đọc nhầm token của nhau, gây lỗi auth khó debug.
**Fix:** Chuẩn hóa tất cả key names vào một constants file.

#### ~~C3. Token và user data lộ trên URL (Google OAuth)~~ ✅ ĐÃ FIX (2026-02-22)
**File:** `src/pages/auth/google-callback/index.tsx`
**Đã fix:** BE dùng in-memory one-time code, FE exchange code lấy token. Token không bao giờ xuất hiện trong URL.
**Fix thêm (2026-02-23):** Sửa lỗi double `/v1/v1/` trong exchange URL (VITE_BASE_URL đã có `/v1`, không cần thêm). Thêm `useRef` guard tránh React 18 StrictMode chạy exchange 2 lần.

#### C4. 12/13 trang Student chưa implement
**Vấn đề:** Tất cả routes student đã đăng ký nhưng component là placeholder:
`/student/booking`, `/student/payment`, `/student/maintenance`, v.v.
**Hậu quả:** Student đăng nhập vào không làm được gì ngoài xem dashboard.

---

### 🟠 HIGH

#### H1. Không có Error Boundary
**Vấn đề:** Không có `ErrorBoundary` component nào trong toàn bộ codebase.
**Hậu quả:** Một component crash → toàn bộ trang trắng, user mất trải nghiệm.
**Fix:**
```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Routes />
</ErrorBoundary>
```

#### H2. Refresh token không rotate
**File:** `src/lib/apiRequest.ts`
**Comment trong code:** *"Refresh token is NOT rotated — keep the original"*
**Vấn đề:** Token refresh 7 ngày không thay đổi → nếu bị đánh cắp, attacker có 7 ngày toàn quyền.
**Fix:** Implement rotation phía BE, FE lưu token mới sau mỗi lần refresh.

#### H3. Không có request timeout
**Vấn đề:** `fetch()` trong `apiRequest.ts` không có timeout. Request có thể treo vô hạn.
**Hậu quả:** Network chậm → user ngồi chờ mãi, không có thông báo lỗi.
**Fix:** Dùng `AbortController` với timeout 30s.

#### H4. Không có debounce cho search inputs
**Vấn đề:** Search boxes ở AdminUsersPage, ViolationListPage gọi API ngay khi user gõ.
**Hậu quả:** Gõ "nguyen" → 6 API calls thay vì 1.
**Fix:** `useDebounce` hook với 500ms delay.

#### H5. Admin pages fetch với `limit: 50` hardcode
**Files:** `AdminDormsPage`, `AdminBlocksPage`
**Vấn đề:**
```typescript
fetchDorms({ page: 1, limit: 50 }) // hardcoded
```
**Hậu quả:** Khi có >50 dorms → dữ liệu bị cắt bớt, không có pagination UI.
**Fix:** Implement proper pagination với Table `onChange`.

---

### 🟡 MEDIUM

#### M1. Không có loading skeleton
**Vấn đề:** Chỉ dùng `<Spin>` toàn trang khi loading, không có skeleton screens.
**Fix:** Dùng Ant Design `Skeleton` hoặc custom skeleton components.

#### M2. Search không reset về page 1
**Vấn đề:** Khi user đang ở page 3 rồi tìm kiếm → kết quả tìm kiếm vẫn show từ page 3.
**Fix:** Reset `currentPage = 1` khi filter/search thay đổi.

#### M3. Không có empty state
**Vấn đề:** Table trống khi không có dữ liệu không hiển thị gì (hoặc chỉ "No Data").
**Fix:** Custom empty state với icon và message hướng dẫn.

#### M4. Unused/Dead code
- `AppContext.tsx` — provide `null`, không dùng ở đâu
- `PrivateContext.tsx` — empty, không implement
- Nhiều `import` trong các file không được dùng
- Dependency lớn không dùng: `@builder.io/react`, `froala-editor`, `grapesjs`, `@plasmicapp/loader-react`

#### M5. Không có xác nhận trước khi xóa (inconsistent)
- Một số chỗ dùng Ant Design `Popconfirm`
- Một số chỗ xóa luôn không hỏi
**Fix:** Chuẩn hóa: tất cả delete actions phải có confirm dialog.

#### M6. Form validation thiếu zod/yup
**Vấn đề:** Chỉ dùng Ant Design `rules` cơ bản, không có schema validation phức tạp.
**Fix:** Dùng `zod` + `@hookform/resolvers` hoặc Ant Design form với custom validators.

#### M7. Magic numbers không có tên
```typescript
30 * 60 * 1000  // 30 phút inactivity — không rõ ngay
60 * 1000       // 60s throttle — không rõ ngay
```
**Fix:** Export từ constants file với tên có ý nghĩa.

#### M8. Inconsistent design system
- Admin pages: thuần Ant Design
- Security/Manager: Tailwind CSS + Lucide icons
- Student: mix cả hai
**Fix:** Thống nhất một hệ thống, ưu tiên Ant Design + Tailwind utilities.

---

### 🟢 LOW

#### L1. JWT stored trong localStorage (XSS risk)
**Vấn đề:** `localStorage` accessible via JS → nếu có XSS, attacker lấy được token.
**Fix lý tưởng:** Dùng `httpOnly cookie` (cần BE hỗ trợ).
**Fix tạm thời:** Sanitize tất cả user-generated content trước khi render.

#### L2. CSRF protection thiếu
**Vấn đề:** State-changing requests (POST/PUT/DELETE) không có CSRF token.
**Fix:** Thêm `X-CSRF-Token` header (cần BE hỗ trợ).

#### L3. Không có tests
**Vấn đề:** 0 file test trong toàn bộ project.
**Fix:** Jest + React Testing Library, mục tiêu 60%+ coverage cho utils và API actions.

#### L4. Không có analytics
**Vấn đề:** Không biết user thực sự dùng tính năng nào.
**Fix:** Thêm tracking (Mixpanel hoặc custom analytics).

#### L5. Bundle size lớn
**Vấn đề:** Load nhiều UI library nặng không code-split.
**Fix:** Lazy load routes, tree-shake Ant Design, xóa deps không dùng.

#### L6. Google OAuth user data parse không safe
**File:** `src/pages/auth/google-callback/index.tsx`
```typescript
const userData = JSON.parse(decodeURIComponent(userParam));
// Không try-catch → crash nếu data malformed
```
**Fix:** Wrap trong try-catch, validate schema.

#### L7. Không có i18n
**Vấn đề:** Text hardcode tiếng Anh, một số tiếng Việt.
**Fix:** `react-i18next` để hỗ trợ đa ngôn ngữ dễ dàng sau này.

---

## 8. DEPENDENCIES AUDIT

### Đang dùng
| Package | Version | Mục đích |
|---------|---------|---------|
| react | 19.1.0 | Core |
| react-router-dom | 6.30.3 | Routing |
| antd | 5.25.4 | UI |
| tailwindcss | 3.x | Utilities CSS |
| mobx + mobx-react-lite | 6.15.0 | State |
| @tanstack/react-query | 4.39.2 | Server state |
| recharts | 2.15.3 | Charts |
| dayjs | 1.11.13 | Dates |
| react-hot-toast | 2.5.2 | Notifications |
| lucide-react | 0.563.0 | Icons |
| react-icons | 5.5.0 | Icons |

### Có trong package.json nhưng KHÔNG dùng (nên xóa)
| Package | Kích thước ước tính |
|---------|-------------------|
| `@builder.io/react` | ~500KB |
| `@measured/puck` | ~300KB |
| `froala-editor` | ~2MB |
| `grapesjs` | ~1.5MB |
| `@plasmicapp/loader-react` | ~400KB |

**Tổng lãng phí: ~4.7MB+ bundle size**

---

## 9. ENVIRONMENT VARIABLES

| Biến | Bắt buộc | Mô tả |
|------|---------|-------|
| `VITE_BASE_URL` | ✅ | Backend API base URL |
| `VITE_BASE_WEB_URL` | — | Frontend base URL |

---

## 10. SCORECARD

| Hạng mục | Điểm | Nhận xét |
|---------|------|---------|
| Architecture | 7/10 | Folder structure rõ ràng, separation of concerns tốt |
| Security | 4/10 | Token trong localStorage, URL exposure, thiếu CSRF |
| Code Quality | 6/10 | TypeScript dùng tốt, nhưng nhiều dead code và hardcode |
| Feature Completeness | 3/10 | Phần lớn routes là placeholder, dashboard fake data |
| Error Handling | 4/10 | Thiếu ErrorBoundary, error messages generic, không có timeout |
| UX/UI | 6/10 | Layout đẹp nhưng inconsistent, thiếu loading/empty states |
| Performance | 4/10 | Bundle lớn, không debounce, không lazy load, deps không dùng |
| Testing | 0/10 | 0 test files |

**Tổng issues tìm thấy: 23** (4 Critical, 5 High, 8 Medium, 6 Low)

---

## 11. TÍNH NĂNG ĐÃ HOÀN CHỈNH vs CÒN THIẾU

### Đã hoàn chỉnh (có UI + kết nối API)
| Tính năng | Role |
|----------|------|
| Admin Login | Admin |
| Admin Dashboard (UI only) | Admin |
| Dorm CRUD | Admin |
| Block CRUD | Admin |
| User Import Excel | Admin |
| User List + Delete | Admin |
| Equipment Category/Template/Config | Admin |
| Violation List + Filter + Stats | Manager |
| Create Violation Report | Manager |
| Review Violation | Manager |
| Security Dashboard | Security |
| Camera Checkin | Security |
| Visitor Management (approve/reject/checkin/checkout) | Security |
| Student Visitor Requests (create/cancel/list) | Student |
| Student Notifications (list/read/delete) | Student |

### Chưa hoàn chỉnh (placeholder / hardcode)
| Tính năng | Role | Mức độ ưu tiên |
|----------|------|--------------|
| Manager Dashboard (real data) | Manager | 🔴 Cao |
| Booking Request Management | Manager | 🔴 Cao |
| Room Management | Manager | 🔴 Cao |
| Student Dashboard (real data) | Student | 🟠 Cao |
| Student Booking | Student | 🔴 Cao |
| Student Payment | Student | 🟠 Trung bình |
| Student Maintenance Request | Student | 🟠 Trung bình |
| Student Notifications | Student | ✅ Done |
| Admin Reports | Admin | 🟡 Thấp |
| Chat / Email | Manager | 🟡 Thấp |
| Invoice / Electricity | Manager | 🟠 Trung bình |
