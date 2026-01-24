import { api } from '../apiRequest';
import QueryString from 'qs';
import { userStore } from '@/stores';

export const getUserProfile = async () => {
  const user = await api.get('users/profile');
  userStore.set(user);
  return user;
};

export const updateProfile = async (doc) => {
  const user = await api.put('users/update', doc);
  return user;
};

// export const updatePassword = async (doc) => {
//   const res = await api.put('users/update-password', doc);
//   return res;
// };

export const getListUser = async (query) => {
  const params = QueryString.stringify(query, {
    encodeValuesOnly: true,
  });

  const res = await api.get(`users/list?${params}`, {});
  return res;
};

export const deleteUser = async (id) => {
  await api.delete(`users/${id}/delete`);
};
