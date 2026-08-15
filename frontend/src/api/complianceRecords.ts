import { apiClient } from './client';
import type {
  ComplianceRecord,
  ComplianceStatus,
  ComplianceType,
  CreateComplianceRecordInput,
  PaginatedResult,
  UpdateComplianceRecordInput,
} from '../types';

export interface ComplianceRecordQuery {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: ComplianceStatus;
  department?: string;
  complianceType?: ComplianceType;
  search?: string;
}

export async function listComplianceRecords(
  query: ComplianceRecordQuery = {},
): Promise<PaginatedResult<ComplianceRecord>> {
  const { data } = await apiClient.get<PaginatedResult<ComplianceRecord>>('/compliance-records', {
    params: query,
  });
  return data;
}

export async function getComplianceRecord(id: string): Promise<ComplianceRecord> {
  const { data } = await apiClient.get<ComplianceRecord>(`/compliance-records/${id}`);
  return data;
}

export async function createComplianceRecord(
  input: CreateComplianceRecordInput,
): Promise<ComplianceRecord> {
  const { data } = await apiClient.post<ComplianceRecord>('/compliance-records', input);
  return data;
}

export async function updateComplianceRecord(
  id: string,
  input: UpdateComplianceRecordInput,
): Promise<ComplianceRecord> {
  const { data } = await apiClient.patch<ComplianceRecord>(`/compliance-records/${id}`, input);
  return data;
}

export async function deleteComplianceRecord(id: string): Promise<void> {
  await apiClient.delete(`/compliance-records/${id}`);
}
