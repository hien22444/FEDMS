# Security Layout Component

## 📍 Vị Trí
`src/layouts/SecurityLayout.tsx`

## 📝 Mô Tả
SecurityLayout là layout chung cho hệ thống quản lý bảo mật DormFlow Security. Layout này bao gồm header với navigation tabs và được sử dụng bởi tất cả các trang trong hệ thống Security.

## 🎯 Sử Dụng
Layout này wrap các trang Security sau:
- Dashboard (Tổng Quan)
- Camera Checkin
- Checkout Requests (Yêu Cầu Checkout)
- Visitors (Khách Tham Quan)

## 🎨 Cấu Trúc Component

### Header Section
- **Logo:** Shield icon với "D" trong background cam
- **Title:** "DormFlow Security"
- **Subtitle:** "Hệ Thống Quản Lý Bảo Mật"

### Navigation Tabs
4 tabs chính với icons:
1. **Tổng Quan** (LayoutDashboard icon) - Route: `/dashboard`
2. **Camera Checkin** (Camera icon) - Route: `/camera-checkin`
3. **Yêu Cầu Checkout** (FileText icon) - Route: `/checkout-requests`
4. **Khách Tham Quan** (Users icon) - Route: `/visitors`

- Active tab được highlight với màu cam và underline
- Hover effects trên các tabs

### Right Actions
- **Notification Bell:** Icon với red dot indicator
- **Logout Button:** "Đăng Xuất" với LogOut icon

### Main Content Area
- Sử dụng `<Outlet />` để render các child routes
- Container với max-width và padding

## 🔧 Dependencies
- `react`
- `react-router-dom` - Outlet, Link, useLocation, useNavigate
- `lucide-react` - Icons: LayoutDashboard, Camera, FileText, Users, Bell, LogOut, Shield
- `@/constants` - ROUTES
- `@/utils` - cn utility function

## 🎨 Styling
- Background: `#FFFBF7` (light beige)
- Header: White background với shadow
- Active tab: `#FF5C00` (orange) với underline
- Sticky header: `sticky top-0 z-50`

## 📱 Responsive
- Navigation tabs responsive với breakpoints
- Mobile: Có thể cần hamburger menu (chưa implement)

## 🔄 Navigation Logic
- Sử dụng `useLocation()` để detect active route
- Highlight tab tương ứng với current pathname
- Navigation sử dụng React Router `Link` component
