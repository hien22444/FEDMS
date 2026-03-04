/* eslint-disable @typescript-eslint/no-namespace */

export enum ViolationStatus {
  NEW = 'new',
  UNDER_REVIEW = 'under_review',
  RESOLVED_PENALIZED = 'resolved_penalized',
  RESOLVED_NO_ACTION = 'resolved_no_action',
  REJECTED = 'rejected',
}

export enum ViolationType {
  POLICY_VIOLATION = 'policy_violation',
  OTHER = 'other',
}

export enum ReporterType {
  STUDENT = 'student',
  SECURITY = 'security',
  MANAGER = 'manager',
}

export enum PenaltyType {
  SEVERE = 'severe',
  MINOR = 'minor',
}

export namespace IViolation {
  export interface Student {
    id: string;
    student_code: string;
    full_name: string;
    phone?: string;
    behavioral_score?: number;
    violations_current_semester?: number;
  }

  export interface Reporter {
    id: string;
    fullname: string;
    email: string;
  }

  export interface Reviewer {
    id: string;
    full_name: string;
  }

  export interface ViolationReport {
    id: string;
    report_code: string;
    reported_student: Student;
    reporter: Reporter;
    reporter_type: ReporterType;
    violation_type: ViolationType;
    description: string;
    evidence_urls: string[];
    violation_date: string;
    location?: string;
    status: ViolationStatus;
    reviewed_at?: string;
    reviewed_by?: Reviewer;
    review_notes?: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface CreateViolationDto {
    student_code: string;
    reporter_type: ReporterType;
    violation_type: ViolationType;
    description: string;
    evidence_urls?: string[];
    violation_date: string;
    location?: string;
  }

  export interface ReviewViolationDto {
    status: ViolationStatus;
    review_notes?: string;
    penalty?: {
      penalty_type: PenaltyType;
      points_deducted: number;
      reason?: string;
    };
  }

  export interface ViolationQuery {
    page?: number;
    limit?: number;
    status?: ViolationStatus;
    violation_type?: ViolationType;
    student_code?: string;
    start_date?: string;
    end_date?: string;
  }

  export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  export interface ViolationListResponse {
    data: ViolationReport[];
    pagination: Pagination;
  }

  export interface Penalty {
    id: string;
    student: string;
    report?: {
      report_code: string;
      violation_type: ViolationType;
      description: string;
    };
    penalty_type: PenaltyType;
    points_deducted: number;
    reason: string;
    semester: string;
    issued_by: {
      full_name: string;
    };
    issued_at: string;
  }

  export interface StudentPenaltiesResponse {
    student: {
      student_code: string;
      full_name: string;
      behavioral_score: number;
      violations_current_semester: number;
      is_banned_permanently: boolean;
      ban_until_semester?: string;
    };
    penalties: Penalty[];
  }

  export interface ViolationStatistics {
    totalReports: number;
    byStatus: {
      new: number;
      under_review: number;
      resolved_penalized: number;
      resolved_no_action: number;
      rejected: number;
    };
    currentSemester: string;
    totalPenaltiesThisSemester: number;
  }

  export interface SearchStudentResult {
    id: string;
    student_code: string;
    full_name: string;
    phone?: string;
    behavioral_score: number;
    violations_current_semester: number;
  }
}
