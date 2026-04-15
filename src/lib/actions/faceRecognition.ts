import { api } from '../apiRequest';
import type { IFaceRecognition } from '@/interfaces';

// ─── Face Registration (Manager) ───

export interface RegisterFaceEmbeddingPayload {
  embedding: number[];
  qualityScore?: number;
  faceCropBase64?: string;
}

export const registerFace = async (studentId: string, image: File) => {
  const formData = new FormData();
  formData.append('studentId', studentId);
  formData.append('image', image);
  return api.post<IFaceRecognition.RegisterResponse>('face-recognition/register', formData);
};

export const saveRegisteredFace = async (
  studentId: string,
  payload: RegisterFaceEmbeddingPayload
) => {
  return api.post<IFaceRecognition.RegisterResponse>('face-recognition/register', {
    studentId,
    ...payload,
  });
};

export const removeFace = async (studentId: string) => {
  return api.delete(`face-recognition/${studentId}`);
};

export const getRegisteredStudents = async () => {
  return api.get<IFaceRecognition.RegisteredStudent[]>('face-recognition/students');
};

export const getStudentFaceDetail = async (studentId: string) => {
  return api.get<IFaceRecognition.RegisteredStudent>(`face-recognition/students/${studentId}`);
};
