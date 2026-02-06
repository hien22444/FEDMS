import type { IUser } from '@/interfaces';
import { makeAutoObservable } from 'mobx';

const initValue: IUser.Response = {
  id: '',
  fullname: '',
  email: '',
  avatarUrl: '',
  createdAt: new Date(),
  updatedAt: new Date(),
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
