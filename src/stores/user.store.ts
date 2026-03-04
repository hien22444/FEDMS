import type { IUser } from '@/interfaces';
import { makeAutoObservable } from 'mobx';

const initValue: IUser.Response = {
  id: '',
  email: '',
  role: '',
  is_active: false,
  fullname: '',
  avatarUrl: '',
};

export class UserStore {
  private user: IUser.Response = initValue;
  constructor() {
    makeAutoObservable(this);
  }

  get() {
    return this.user;
  }

  set(user: IUser.Response) {
    this.user = user;
  }

  reset() {
    this.user = initValue;
  }
}

export const userStore = new UserStore();
