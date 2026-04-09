import { api } from '../apiRequest';
import type { IFaceRecognition } from '@/interfaces';

export const getCameras = async () => {
  return api.get<IFaceRecognition.CameraConfig[]>('cameras', { cache: 'no-store' });
};

export const startCamera = async (cameraId: string) => {
  return api.post(`cameras/${cameraId}/start`, {});
};

export const stopCamera = async (cameraId: string) => {
  return api.post(`cameras/${cameraId}/stop`, {});
};

export const getCameraStatus = async (cameraId: string) => {
  return api.get<IFaceRecognition.CameraStatusUpdate>(`cameras/${cameraId}/status`, {
    cache: 'no-store',
  });
};

export const updateCameraSource = async (
  cameraId: string,
  source: { source_type: 'webcam' | 'rtsp'; source_url: string },
  authToken?: string
) => {
  return api.patch<IFaceRecognition.CameraConfig>(
    `cameras/${cameraId}/source`,
    source,
    authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
  );
};

export const resetCameraSource = async (cameraId: string, authToken?: string) => {
  return api.delete<IFaceRecognition.CameraConfig>(
    `cameras/${cameraId}/source`,
    authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
  );
};
