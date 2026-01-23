/**
 * Set cookie để cho phép truy cập editor pages
 */
export const setEditorAccessCookie = () => {
  if (typeof document === 'undefined') return;

  const cookieOptions = [
    'editor-access-token=true',
    'path=/',
    'SameSite=None',
    'Secure', // Bắt buộc khi dùng SameSite=None (chỉ hoạt động với HTTPS)
    'max-age=86400', // 24 giờ
  ];

  document.cookie = cookieOptions.join('; ');
};
