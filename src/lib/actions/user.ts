import type { IPaginatedResponse, IQuery, IUser } from '@/interfaces';
import { api } from '../apiRequest';
import QueryString from 'qs';
import { userStore } from '@/stores';

export const getUserProfile = async () => {
  const user = await api.get<IUser.Response>('users/profile');

  userStore.set(user);
  return user;
};

export const updateProfile = async (doc: FormData) => {
  const user = await api.put<IUser.Response>('users/update', doc);

  return user;
};

// export const updatePassword = async (
//   doc: IUser.ChangePasswordDto,
// ) => {
//   const res = await api.put<boolean>('users/update-password', doc);

//   return res;
// };

export const getListUser = async (query: IQuery) => {
  const params = QueryString.stringify(query, {
    encodeValuesOnly: true,
  });

  const res = await api.get<IPaginatedResponse<IUser.Response>>(
    `users/list?${params}`,
    {},
  );

  return res;
};

export const deleteUser = async (id: string) => {
  await api.delete(`users/${id}/delete`);
};
