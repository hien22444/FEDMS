import { api } from '../apiRequest';
import type { IFaceRecognition } from '@/interfaces';

export const getCameras = async () => {
  return api.get<IFaceRecognition.CameraConfig[]>('cameras');
};

export const startCamera = async (cameraId: string) => {
  return api.post(`cameras/${cameraId}/start`, {});
};

export const stopCamera = async (cameraId: string) => {
  return api.post(`cameras/${cameraId}/stop`, {});
};

export const getCameraStatus = async (cameraId: string) => {
  return api.get<IFaceRecognition.CameraStatusUpdate>(`cameras/${cameraId}/status`);
};
