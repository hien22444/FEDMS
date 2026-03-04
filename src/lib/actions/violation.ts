import type { IViolation } from '@/interfaces';
import { api } from '../apiRequest';
import QueryString from 'qs';

const API_PREFIX = 'violations';

/**
 * Get all violation reports with filtering and pagination
 */
export const getViolationReports = async (query: IViolation.ViolationQuery = {}) => {
  const params = QueryString.stringify(query, {
    encodeValuesOnly: true,
    skipNulls: true,
  });

  const res = await api.get<IViolation.ViolationListResponse>(
    `${API_PREFIX}${params ? `?${params}` : ''}`,
  );

  return res;
};

/**
 * Get violation report by ID
 */
export const getViolationReportById = async (id: string) => {
  const res = await api.get<IViolation.ViolationReport>(`${API_PREFIX}/${id}`);

  return res;
};

/**
 * Create a new violation report
 */
export const createViolationReport = async (data: IViolation.CreateViolationDto) => {
  const res = await api.post<IViolation.ViolationReport>(API_PREFIX, data);

  return res;
};

/**
 * Review/Update violation report status
 */
export const reviewViolationReport = async (id: string, data: IViolation.ReviewViolationDto) => {
  const res = await api.put<IViolation.ViolationReport>(`${API_PREFIX}/${id}/review`, data);

  return res;
};

/**
 * Delete violation report (only new reports)
 */
export const deleteViolationReport = async (id: string) => {
  const res = await api.delete<{ message: string }>(`${API_PREFIX}/${id}`);

  return res;
};

/**
 * Search student by student code
 */
export const searchStudentByCode = async (code: string) => {
  const res = await api.get<IViolation.SearchStudentResult | null>(
    `${API_PREFIX}/search-student?code=${encodeURIComponent(code)}`,
  );

  return res;
};

/**
 * Get penalties for a student
 */
export const getStudentPenalties = async (studentCode: string) => {
  const res = await api.get<IViolation.StudentPenaltiesResponse>(
    `${API_PREFIX}/student/${encodeURIComponent(studentCode)}/penalties`,
  );

  return res;
};

/**
 * Get violation statistics
 */
export const getViolationStatistics = async () => {
  const res = await api.get<IViolation.ViolationStatistics>(`${API_PREFIX}/statistics`);

  return res;
};
