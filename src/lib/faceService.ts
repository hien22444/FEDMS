import type { IFaceRecognition } from '@/interfaces';

const LOCAL_FACE_SERVICE_URL = (import.meta.env.VITE_FACE_SERVICE_URL || '')
  .trim()
  .replace(/\/+$/, '');

export interface LocalFaceRegistrationResult {
  success: boolean;
  embedding: number[];
  bbox: number[];
  det_score: number;
  quality_score: number;
  face_crop_base64?: string;
}

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const { detail, message } = payload as { detail?: string; message?: string };
    if (detail) return detail;
    if (message) return message;
  }

  return fallback;
};

const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return text;
        }
      })()
    : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackMessage));
  }

  return payload as T;
};

const requestFaceService = async <T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string
): Promise<T> => {
  if (!LOCAL_FACE_SERVICE_URL) {
    throw new Error('VITE_FACE_SERVICE_URL is not configured');
  }

  const response = await fetch(`${LOCAL_FACE_SERVICE_URL}${path}`, init);
  return parseResponse<T>(response, fallbackMessage);
};

export const getLocalFaceServiceUrl = () => (LOCAL_FACE_SERVICE_URL ? LOCAL_FACE_SERVICE_URL : null);

export const registerFaceWithLocalService = async (
  image: File
): Promise<LocalFaceRegistrationResult> => {
  const formData = new FormData();
  formData.append('image', image);

  return requestFaceService<LocalFaceRegistrationResult>(
    '/register',
    {
      method: 'POST',
      body: formData,
    },
    'Local FaceService registration failed'
  );
};

export const startLocalCamera = async (camera: IFaceRecognition.CameraConfig) =>
  requestFaceService(
    `/cameras/${camera.camera_id}/start`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_type: camera.source_type,
        source_url: camera.source_url,
        camera_type: camera.type,
        fps_target: camera.fps_target,
        recognition_threshold: camera.recognition_threshold,
      }),
    },
    'Failed to start local FaceService camera'
  );

export const stopLocalCamera = async (cameraId: string) =>
  requestFaceService(
    `/cameras/${cameraId}/stop`,
    {
      method: 'POST',
    },
    'Failed to stop local FaceService camera'
  );

export const getLocalCameraStatus = async (
  cameraId: string
): Promise<IFaceRecognition.CameraStatusUpdate> => {
  if (!LOCAL_FACE_SERVICE_URL) {
    throw new Error('VITE_FACE_SERVICE_URL is not configured');
  }

  const response = await fetch(`${LOCAL_FACE_SERVICE_URL}/cameras/${cameraId}/status`);
  if (response.status === 404) {
    return { camera_id: cameraId, status: 'offline' };
  }

  const payload = await parseResponse<{
    camera_id?: string;
    status?: 'active' | 'offline' | 'error';
    fps_actual?: number;
    error_message?: string | null;
  }>(response, 'Failed to get local FaceService camera status');

  return {
    camera_id: payload.camera_id || cameraId,
    status: payload.status || 'offline',
    fps: payload.fps_actual,
    error_message: payload.error_message ?? null,
  };
};
