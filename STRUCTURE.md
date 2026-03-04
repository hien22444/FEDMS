# Cấu Trúc Dự Án FEDOM

## 📁 Cấu Trúc Thư Mục Chính

```
src/
├── pages/                    # Các trang của ứng dụng
│   ├── landing/              # Landing Page (Trang chủ marketing)
│   │   └── landingpage.tsx   # Component LandingPage - Trang giới thiệu DormFlow
│   ├── signin/               # Trang đăng nhập
│   │   └── index.tsx
│   ├── signup/               # Trang đăng ký
│   │   └── index.tsx
│   └── security/             # Security System (Hệ thống quản lý bảo mật)
│       ├── dashboard/        # Dashboard Security (Tổng Quan)
│       │   └── index.tsx     # Trang tổng quan với summary cards và panels
│       ├── camera-checkin/   # Quản lý Camera Check-In
│       │   └── index.tsx     # Trang quản lý camera và check-in/check-out
│       ├── checkout-requests/# Yêu Cầu Checkout
│       │   └── index.tsx     # Trang quản lý các yêu cầu checkout
│       └── visitors/         # Khách Tham Quan
│           └── index.tsx     # Trang quản lý khách tham quan
│
├── layouts/                  # Layout components
│   ├── SecurityLayout.tsx    # Layout cho hệ thống Security (có header navigation)
│   ├── PrivateLayout.tsx     # Layout cho các trang private (nếu có)
│   ├── PrivateHeader.tsx     # Header component
│   └── PrivateSideBar.tsx   # Sidebar component
│
├── components/               # Các component tái sử dụng
│   └── unix/                 # Unix components
│
├── constants/                # Constants và configs
│   └── routes.ts            # Định nghĩa các routes
│
├── routers/                  # Router configuration
│   └── index.tsx            # React Router setup
│
└── utils/                    # Utility functions
    └── util.ts              # Helper functions (cn, etc.)
```

## 🎯 Landing Page (`src/pages/landing/landingpage.tsx`)

**Mô tả:** Trang landing page marketing cho DormFlow, hiển thị khi truy cập root path `/`.

**Tính năng:**
- Navigation bar với logo và menu
- Hero section với CTA buttons
- Features section (6 tính năng chính)
- CTA section (Call-to-action)
- Footer với links và social media

**Route:** `/` (ROUTES.LANDING)

**Dependencies:** `lucide-react` cho icons

---

## 🔒 Security System (`src/layouts/SecurityLayout.tsx`)

**Mô tả:** Layout chung cho hệ thống quản lý bảo mật DormFlow Security.

**Tính năng:**
- Header với logo "DormFlow Security"
- Navigation tabs:
  - Tổng Quan (Dashboard)
  - Camera Checkin
  - Yêu Cầu Checkout
  - Khách Tham Quan
- Notification bell với red dot indicator
- Logout button

**Các trang sử dụng SecurityLayout:**
1. **Dashboard** (`/dashboard`) - Trang tổng quan
   - 4 Summary Cards (Yêu Cầu Chưa Xử Lý, Khách Trong Ký Túc, Yêu Cầu Checkout, Camera Hoạt Động)
   - Panel trái: Yêu Cầu Đang Xử Lý
   - Panel phải: Thông Báo Bảo Mật

2. **Camera Checkin** (`/camera-checkin`) - Quản lý camera
   - Summary cards (Hoạt Động, Ngoại Tuyến, Tổng Số, Chi Tiết Lưu)
   - Panel trái: Check In/Out với QR Code scanner
   - Panel phải: Camera feeds grid

3. **Checkout Requests** (`/checkout-requests`) - Yêu cầu checkout
   - Filter tabs (Tất Cả, Chờ Duyệt, Đã Duyệt, Hoàn Thành)
   - Request cards với status và action buttons

4. **Visitors** (`/visitors`) - Quản lý khách tham quan
   - Active visitor count badge
   - Visitor cards với status (Đang ở / Đã Rời)
   - Add New Visitor button

---

## 🛣️ Routes Configuration

**File:** `src/constants/routes.ts`

```typescript
export const ROUTES = {
  LANDING: '/',                    // Landing page (marketing)
  SIGN_IN: '/signin',              // Đăng nhập
  SIGN_UP: '/signup',              // Đăng ký
  DASHBOARD: '/dashboard',          // Dashboard Security (Tổng Quan)
  CAMERA_CHECKIN: '/camera-checkin',        // Camera Check-In
  CHECKOUT_REQUESTS: '/checkout-requests',  // Yêu Cầu Checkout
  VISITORS: '/visitors',           // Khách Tham Quan
};
```

---

## 🎨 Design System

**Màu sắc chính:**
- Primary Orange: `#FF5C00`
- Background: `#FFFBF7` (light beige)
- Text: `text-gray-900` (dark gray)

**Icons:** Sử dụng `lucide-react` library

**Styling:** Tailwind CSS với custom colors

---

## 📝 Notes

- LandingPage là trang công khai, không cần authentication
- SecurityLayout và các trang bên trong có thể cần authentication (tùy vào yêu cầu)
- Tất cả các trang Security đều có cùng header navigation
- Responsive design với breakpoints: `md:`, `lg:`
