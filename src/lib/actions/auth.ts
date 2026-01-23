import { api } from '../apiRequest';
import type { IUser } from '@/interfaces';

export const signIn = async (doc: IUser.SignInDto) => {
  const res = await api.post<{
    user: IUser.Response;
  }>('auth/signin', doc);

  return res;
};

export const signUp = async (doc: IUser.SignupDto) => {
  const res = await api.post<{
    user: IUser.Response;
  }>('auth/register', doc);

  return res;
};

export const logout = async () => {
  await api.post('auth/logout', {});
};

// export const forgotPassword = async (
//   doc: IUser.ForgotPasswordDto,
// ) => {
//   await api.post('auth/forgot-password', doc);
// };

// export const verifyOtp = async (doc: IUser.VerifyOtpDto) => {
//   await api.post('auth/verify-otp', doc);
// };
// export const resetPassword = async (doc: IUser.ResetPasswordDto) => {
//   await api.post('auth/reset-password', doc);
// };

// export const renewOtp = async (doc: IUser.RenewOtp) => {
//   await api.post('auth/renew-otp', doc);
// };
