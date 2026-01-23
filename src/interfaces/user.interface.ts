import type { UserType } from '@/constants';

/* eslint-disable @typescript-eslint/no-namespace */
export namespace IUser {
  export interface Response {
    id: string;
    fullname: string;
    email: string;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface SignInDto {
    email: string;
    password: string;
  }
  export interface SignupDto {
    fullname: string;
    email: string;
    password: string;
    userTypes: UserType[];
  }
}
