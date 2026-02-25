/**
 * Set cookie to allow access to editor pages
 */
export const setEditorAccessCookie = () => {
  if (typeof document === 'undefined') return;

  const cookieOptions = [
    'editor-access-token=true',
    'path=/',
    'SameSite=None',
    'Secure', // Required when using SameSite=None (only works with HTTPS)
    'max-age=86400', // 24 hours
  ];

  document.cookie = cookieOptions.join('; ');
};
