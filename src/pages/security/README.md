# Security System Pages

## 📍 Vị Trí
`src/pages/security/`

## 📝 Mô Tả
Folder này chứa tất cả các trang của hệ thống quản lý bảo mật DormFlow Security. Tất cả các trang này đều sử dụng `SecurityLayout` và có cùng header navigation.

## 📁 Cấu Trúc

```
security/
├── dashboard/              # Dashboard (Tổng Quan)
│   └── index.tsx          # Trang tổng quan với summary cards và panels
├── camera-checkin/        # Camera Check-In
│   └── index.tsx         # Trang quản lý camera và check-in/check-out
├── checkout-requests/     # Yêu Cầu Checkout
│   └── index.tsx         # Trang quản lý các yêu cầu checkout
└── visitors/              # Khách Tham Quan
    └── index.tsx         # Trang quản lý khách tham quan
```

## 🎯 Các Trang

### 1. Dashboard (`dashboard/index.tsx`)
- **Route:** `/security`
- **Mô tả:** Trang tổng quan với các thống kê và thông báo
- **Tính năng:**
  - 4 Summary Cards (Yêu Cầu Chưa Xử Lý, Khách Trong Ký Túc, Yêu Cầu Checkout, Camera Hoạt Động)
  - Panel trái: Yêu Cầu Đang Xử Lý
  - Panel phải: Thông Báo Bảo Mật

### 2. Camera Checkin (`camera-checkin/index.tsx`)
- **Route:** `/security/camera-checkin`
- **Mô tả:** Quản lý camera và check-in/check-out
- **Tính năng:**
  - Summary cards (Hoạt Động, Ngoại Tuyến, Tổng Số, Chi Tiết Lưu)
  - Panel trái: Check In/Out với QR Code scanner và Manual input
  - Panel phải: Camera feeds grid với status indicators
  - Recent Activity list

### 3. Checkout Requests (`checkout-requests/index.tsx`)
- **Route:** `/security/checkout-requests`
- **Mô tả:** Quản lý các yêu cầu checkout của sinh viên
- **Tính năng:**
  - Filter tabs (Tất Cả, Chờ Duyệt, Đã Duyệt, Hoàn Thành)
  - Request cards với avatar, user info, status và action buttons
  - Status indicators với icons và colors

### 4. Visitors (`visitors/index.tsx`)
- **Route:** `/security/visitors`
- **Mô tả:** Quản lý khách tham quan
- **Tính năng:**
  - Active visitor count badge
  - Visitor cards với status (Đang ở / Đã Rời)
  - Check-in/check-out times
  - Add New Visitor button

## 🔧 Layout
Tất cả các trang trong folder này đều được wrap bởi `SecurityLayout` (`src/layouts/SecurityLayout.tsx`), cung cấp:
- Header với logo "DormFlow Security"
- Navigation tabs
- Notification bell
- Logout button

## 🎨 Design System
- Background: `#FFFBF7` (light beige)
- Primary color: `#FF5C00` (orange)
- Icons: `lucide-react`
- Styling: Tailwind CSS

## 📱 Responsive
Tất cả các trang đều responsive với breakpoints:
- Mobile: Stack layout
- Tablet/Desktop: Grid layout với 2 columns
