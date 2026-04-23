/* eslint-disable @typescript-eslint/no-namespace */

export namespace IFaceRecognition {
  export interface RegisteredStudent {
    id: string;
    studentId: string;
    studentCode: string;
    fullName: string;
    avatarUrl?: string;
    faceImageUrl?: string;
    qualityScore: number;
    registeredBy: string;
    registeredAt: string;
  }

  export interface RegisterResponse {
    id: string;
    studentId: string;
    studentCode: string;
    fullName: string;
    qualityScore: number;
    faceImageUrl: string;
    registeredAt: string;
  }

  export interface Detection {
    student_id: string | null;
    student_name: string | null;
    student_code: string | null;
    avatar_url: string | null;
    confidence: number | null;
    bbox: number[];
    det_score: number;
    is_match: boolean;
    access_log_id: string | null;
    status_unchanged?: boolean;
  }

  export interface FaceDetectionResult {
    camera_id: string;
    camera_type: string;
    timestamp: number;
    detections: Detection[];
    frame_base64: string;
  }

  export interface CameraStatusUpdate {
    camera_id: string;
    status: 'active' | 'offline' | 'error';
    fps?: number;
    error_message?: string | null;
  }

  export interface CameraConfig {
    camera_id: string;
    name: string;
    location?: string;
    type: 'checkin' | 'checkout';
    source_type: 'webcam' | 'rtsp';
    source_url: string;
    is_active: boolean;
    fps_target: number;
    recognition_threshold: number;
  }

  export interface AccessLog {
    id: string;
    student?: {
      _id: string;
      student_code: string;
      full_name: string;
      avatar_url?: string;
    };
    type: 'check_in' | 'check_out';
    method: 'face_recognition' | 'manual';
    camera_id?: string;
    confidence?: number;
    face_snapshot_url?: string;
    logged_by?: {
      email: string;
      fullname: string;
    };
    manual_reason?: string;
    visitor_name?: string;
    id_card?: string;
    notes?: string;
    createdAt: string;
  }

  export interface AccessLogStats {
    todayCheckIns: number;
    todayCheckOuts: number;
    currentlyInside: number;
  }

  export interface ReportStats {
    totalCheckIns: number;
    totalCheckOuts: number;
    currentlyInside: number;
    manualOverrides: number;
  }

  export interface AccessLogPaginated {
    logs: AccessLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
}
