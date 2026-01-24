import { api } from '../apiRequest';

export const signIn = async (doc) => {
  const res = await api.post('auth/signin', doc);
  return res;
};

export const signUp = async (doc) => {
  const res = await api.post('auth/register', doc);
  return res;
};

export const logout = async () => {
  await api.post('auth/logout', {});
};

// export const forgotPassword = async (doc) => {
//   await api.post('auth/forgot-password', doc);
// };

// export const verifyOtp = async (doc) => {
//   await api.post('auth/verify-otp', doc);
// };
// export const resetPassword = async (doc) => {
//   await api.post('auth/reset-password', doc);
// };

// export const renewOtp = async (doc) => {
//   await api.post('auth/renew-otp', doc);
// };
