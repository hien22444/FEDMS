import type { UserType } from '@/constants';

/* eslint-disable @typescript-eslint/no-namespace */
export namespace IUser {
  export interface Response {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login?: string;
    fullname?: string; // For Google OAuth users
    google_id?: string;
  }

  export interface StudentProfile {
    id: string;
    student_code: string;
    full_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    phone: string;
    citizen_id: string;
    permanent_address?: string;
    avatar_url?: string;
    major?: string;
    cohort?: string;
    behavioral_score: number;
    violations_current_semester: number;
    is_banned_permanently: boolean;
    ban_until_semester?: string;
  }

  export interface SignInDto {
    email: string;
    password: string;
  }

  export interface SignupDto {
    fullname: string;
    email: string;
    password: string;
    userTypes?: UserType[];
    role?: string;
  }
}
