import { makeAutoObservable } from 'mobx';

const initValue = {
  id: '',
  fullname: '',
  email: '',
  avatarUrl: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export class UserStore {
  constructor() {
    this.user = initValue;
    makeAutoObservable(this);
  }

  get() {
    return this.user;
  }

  set(user) {
    this.user = user;
  }

  reset() {
    this.user = initValue;
  }
}

export const userStore = new UserStore();
