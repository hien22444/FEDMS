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
      { key: 'bed-statistics', label: 'Bed Usage Statistics', icon: 'barChart', path: '/manager/bed-statistics' },
    ],
  },
  {
    group: 'DORMITORY MANAGEMENT',
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
          { key: 'update-status', label: 'Update Status', path: '/manager/beds/status' },
          { key: 'change-assignment', label: 'Change Assignment', path: '/manager/beds/assignment' },
        ],
      },
    ],
  },
  {
    group: 'STUDENT MANAGEMENT',
    items: [
      { key: 'booking-history', label: 'Booking History', icon: 'history', path: '/manager/bookings' },
      { key: 'checkout', label: 'Checkout Management', icon: 'checkout', path: '/manager/checkout' },
      { key: 'login-student', label: 'Login as Student', icon: 'user', path: '/manager/login-student' },
    ],
  },
  {
    group: 'VIOLATION & DISCIPLINE',
    items: [
      { key: 'violations', label: 'Violation Management', icon: 'warning', path: '/manager/violations' },
      { key: 'create-violation', label: 'Create Violation', icon: 'plus', path: '/manager/violations/create' },
    ],
  },
  {
    group: 'FACILITIES & REQUESTS',
    items: [
      { key: 'facilities', label: 'Facilities Management', icon: 'tool', path: '/manager/facilities' },
      { key: 'requests', label: 'Request List', icon: 'list', path: '/manager/requests' },
    ],
  },
  {
    group: 'ELECTRICITY & BILLING',
    items: [
      {
        key: 'electricity',
        label: 'Electricity Management',
        icon: 'electricity',
        path: '/manager/electricity',
        children: [
          { key: 'all-records', label: 'All Records', path: '/manager/electricity' },
          { key: 'import-data', label: 'Import Data', path: '/manager/electricity/import' },
          { key: 'create-record', label: 'Create Record', path: '/manager/electricity/create' },
        ],
      },
      { key: 'invoices', label: 'Invoice List', icon: 'invoice', path: '/manager/invoices' },
    ],
  },
  {
    group: 'COMMUNICATION',
    items: [
      { key: 'news', label: 'News Management', icon: 'news', path: '/manager/news' },
      { key: 'chat', label: 'Chat with Students', icon: 'chat', path: '/manager/chat' },
      { key: 'email', label: 'Send Email', icon: 'email', path: '/manager/email' },
      { key: 'notifications', label: 'Notifications', icon: 'bell', path: '/manager/notifications' },
    ],
  },
  {
    group: 'SYSTEM SETTINGS',
    items: [
      { key: 'config', label: 'Data Configuration', icon: 'settings', path: '/manager/config' },
      // { key: 'import', label: 'Import Data', icon: 'import', path: '/manager/import' },
      // { key: 'export', label: 'Export Data', icon: 'export', path: '/manager/export' },
      { key: 'settings', label: 'Settings', icon: 'gear', path: '/manager/settings' },
    ],
  },
];
