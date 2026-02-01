export const ROUTES = {
  LANDING: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  GOOGLE_CALLBACK: '/auth/google/callback',

  // Student routes
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_NEWS: '/student/news',
  STUDENT_SCHEDULE: '/student/schedule',
  STUDENT_BOOKING: '/student/booking',
  STUDENT_UTILITIES: '/student/utilities',
  STUDENT_PAYMENT: '/student/payment',
  STUDENT_REQUESTS: '/student/requests',
  STUDENT_MAINTENANCE: '/student/maintenance',
  STUDENT_PROFILE: '/student/profile',

  // Security routes
  SECURITY_DASHBOARD: '/security',
  CAMERA_CHECKIN: '/security/camera-checkin',
  CHECKOUT_REQUESTS: '/security/checkout-requests',
  VISITORS: '/security/visitors',

  // Manager routes
  MANAGER: '/manager',
  MANAGER_DORMS: '/manager/dorms',
  MANAGER_BLOCKS: '/manager/blocks',
  MANAGER_ROOMS: '/manager/rooms',
  MANAGER_BEDS: '/manager/beds',
  MANAGER_STUDENTS: '/manager/students',
  MANAGER_BOOKINGS: '/manager/bookings',
  MANAGER_CHECKOUT: '/manager/checkout',
  MANAGER_VIOLATIONS: '/manager/violations',
  MANAGER_FACILITIES: '/manager/facilities',
  MANAGER_REQUESTS: '/manager/requests',
  MANAGER_ELECTRICITY: '/manager/electricity',
  MANAGER_INVOICES: '/manager/invoices',
  MANAGER_NEWS: '/manager/news',
  MANAGER_CHAT: '/manager/chat',
  MANAGER_SETTINGS: '/manager/settings',
};

export const SUB_ROUTES = {
  BUILDER: 'builder',
  KNOWLEDGE: 'knowledge',
  CONVERSATION: 'conversations',
  SETTING: 'settings',
};
