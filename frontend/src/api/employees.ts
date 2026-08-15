import { apiClient } from './client';
import type {
  CreateEmployeeInput,
  Employee,
  PaginatedResult,
  UpdateEmployeeInput,
} from '../types';

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  department?: string;
  search?: string;
}

export async function listEmployees(query: EmployeeQuery = {}): Promise<PaginatedResult<Employee>> {
  const { data } = await apiClient.get<PaginatedResult<Employee>>('/employees', { params: query });
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/employees/${id}`);
  return data;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { data } = await apiClient.post<Employee>('/employees', input);
  return data;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const { data } = await apiClient.patch<Employee>(`/employees/${id}`, input);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`);
}
