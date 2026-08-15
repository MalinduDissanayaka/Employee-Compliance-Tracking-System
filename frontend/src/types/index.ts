export const ComplianceType = {
  VISA: 'Visa',
  CERTIFICATION: 'Certification',
  BACKGROUND_CHECK: 'Background Check',
  TRAINING: 'Training',
  WORK_PERMIT: 'Work Permit',
} as const;
export type ComplianceType = (typeof ComplianceType)[keyof typeof ComplianceType];

export const ComplianceStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
  RENEWED: 'RENEWED',
} as const;
export type ComplianceStatus = (typeof ComplianceStatus)[keyof typeof ComplianceStatus];

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  complianceType: ComplianceType;
  issuedDate: string;
  expiryDate: string;
  status: ComplianceStatus;
  documentUrl: string | null;
  notes: string | null;
  expiringNotificationSent: boolean;
  expiredNotificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardSummary {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
}

export interface TypeBreakdown {
  complianceType: string;
  count: number;
}

export interface CreateEmployeeInput {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface CreateComplianceRecordInput {
  employeeId: string;
  complianceType: ComplianceType;
  issuedDate: string;
  expiryDate: string;
  documentUrl?: string;
  notes?: string;
}

export interface UpdateComplianceRecordInput extends Partial<CreateComplianceRecordInput> {
  status?: ComplianceStatus;
}
