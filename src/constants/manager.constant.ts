// Manager Constants & Enums

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  FULL = 'FULL',
  MAINTENANCE = 'MAINTENANCE',
}

export enum BedStatus {
  EMPTY = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum RequestType {
  MAINTENANCE = 'Maintenance',
  CLEANING = 'Cleaning',
  AC_REPAIR = 'AC Repair',
  PLUMBING = 'Plumbing',
  ELECTRICAL = 'Electrical',
}

// Sidebar Menu Configuration
export const MANAGER_MENU = [
   {
    group: 'DASHBOARD',
    items: [
      { key: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard', path: '/manager' },
    ],
  },
  {
    group: 'DMS SERVICES',
    items: [
      { key: 'news', label: 'News Management', icon: 'news', path: '/manager/news' },
      { key: 'face-registration', label: 'Face Registration', icon: 'user', path: '/manager/face-registration' },
      { key: 'chat', label: 'Chat with Students', icon: 'chat', path: '/manager/chat' },
      { key: 'email-center', label: 'Email Center', icon: 'email', path: '/manager/email' },
      { key: 'notifications', label: 'Notifications', icon: 'bell', path: '/manager/notifications' },
      { key: 'requests', label: 'Request List', icon: 'list', path: '/manager/requests' },
      {
        key: 'violations',
        label: 'Violation Management',
        icon: 'warning',
        path: '/manager/violations',
        children: [
          { key: 'violation-list', label: 'Violation Management', path: '/manager/violations' },
          { key: 'create-violation', label: 'Create Violation', path: '/manager/violations/create' },
          { key: 'students-cfd-risk', label: 'CFD at-risk (≤2)', path: '/manager/students-cfd-risk' },
        ],
      },
    ],
  },
 
  {
    group: 'ACCOMMODATION',
    items: [
      { key: 'booking-history', label: 'Booking Management', icon: 'history', path: '/manager/bookings' },
      { key: 'checkout', label: 'Checkout', icon: 'checkout', path: '/manager/checkout' },
      { key: 'bed-statistics', label: 'Bed Usage Statistics', icon: 'barChart', path: '/manager/bed-statistics' },
    ],
  },
  {
    group: 'UTILITY & BILLING',
    items: [
      { key: 'electricity', label: 'Electricity Management', icon: 'electricity', path: '/manager/electricity' },
      { key: 'invoices', label: 'Invoice List', icon: 'invoice', path: '/manager/invoices' },
    ],
  },
  {
    group: 'FACILITIES',
    items: [
      { key: 'dorms', label: 'Dorm List', icon: 'building', path: '/manager/dorms' },
      { key: 'blocks', label: 'Block List', icon: 'block', path: '/manager/blocks' },
      { key: 'rooms', label: 'Room List', icon: 'door', path: '/manager/rooms' },
      {
        key: 'beds',
        label: 'Bed Management',
        icon: 'bed',
        path: '/manager/beds',
        children: [
          { key: 'all-beds', label: 'All Beds', path: '/manager/beds' },
          { key: 'change-assignment', label: 'Change Assignment', path: '/manager/beds/assignment' },
        ],
      },
      { key: 'facilities', label: 'Facilities Management', icon: 'tool', path: '/manager/facilities' },
    ],
  },
  {
    group: 'OTHER',
    items: [
      { key: 'login-student', label: 'Login as Student', icon: 'user', path: '/manager/login-student' },
      { key: 'config', label: 'Date Config', icon: 'settings', path: '/manager/config' },
    ],
  },
];
