export namespace IVisitor {
  export interface Visitor {
    id: string;
    request: string;
    full_name: string;
    citizen_id: string;
    phone: string;
    relationship: 'parent' | 'sibling' | 'friend' | 'other';
    relationship_other?: string;
    checkin?: CheckinRecord | null;
  }

  export interface CheckinRecord {
    id: string;
    request: string;
    visitor: string;
    check_in_time: string;
    check_out_time: string | null;
    checked_in_by: string | null;
    checked_out_by: string | null;
    notes?: string;
  }

  export interface VisitorRequest {
    id: string;
    request_code: string;
    user: {
      id: string;
      email: string;
      fullname: string;
    };
    student?: {
      full_name: string;
      student_code: string;
      phone?: string;
    } | null;
    visit_date: string;
    visit_time_from: string;
    visit_time_to: string;
    purpose: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    rejection_reason?: string;
    reviewed_at?: string | null;
    reviewed_by?: string | null;
    visitors: Visitor[];
    createdAt: string;
  }

  export interface CreateVisitorRequestDto {
    visit_date: string;
    /** "HH:MM" — defaults to 07:00 on BE if not provided */
    visit_time_from?: string;
    /** "HH:MM" — defaults to 17:00 on BE if not provided */
    visit_time_to?: string;
    purpose: string;
    visitors: {
      full_name: string;
      citizen_id: string;
      phone: string;
      relationship: string;
      relationship_other?: string;
    }[];
  }

  export interface ActiveVisitor {
    id: string;
    check_in_time: string;
    check_out_time: string | null;
    visitor: {
      id: string;
      full_name: string;
      citizen_id: string;
      phone: string;
      relationship: string;
    };
    request: {
      id: string;
      request_code: string;
      visit_time_from: string;
      visit_time_to: string;
      user: {
        email: string;
        fullname: string;
      };
    };
    student?: {
      full_name: string;
      student_code: string;
    } | null;
  }

  export interface AllRequestsResponse {
    data: VisitorRequest[];
    total: number;
    page: number;
    limit: number;
  }
}
