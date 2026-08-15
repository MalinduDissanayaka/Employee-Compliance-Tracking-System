import { apiClient } from './client';
import type {
  ComplianceRecord,
  DashboardSummary,
  DepartmentBreakdown,
  TypeBreakdown,
} from '../types';

export interface UpcomingQuery {
  days?: number;
  startDate?: string;
  endDate?: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return data;
}

export async function getByDepartment(): Promise<DepartmentBreakdown[]> {
  const { data } = await apiClient.get<DepartmentBreakdown[]>('/dashboard/by-department');
  return data;
}

export async function getByType(): Promise<TypeBreakdown[]> {
  const { data } = await apiClient.get<TypeBreakdown[]>('/dashboard/by-type');
  return data;
}

export async function getUpcoming(query: UpcomingQuery = {}): Promise<ComplianceRecord[]> {
  const { data } = await apiClient.get<ComplianceRecord[]>('/dashboard/upcoming', {
    params: query,
  });
  return data;
}
