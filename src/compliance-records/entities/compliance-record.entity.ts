import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { ComplianceType } from '../../common/enums/compliance-type.enum';
import { ComplianceStatus } from '../../common/enums/compliance-status.enum';

@Entity('compliance_records')
export class ComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.complianceRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Index()
  @Column({ name: 'compliance_type', type: 'enum', enum: ComplianceType })
  complianceType!: ComplianceType;

  @Column({ name: 'issued_date', type: 'date' })
  issuedDate!: string;

  @Index()
  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.ACTIVE,
  })
  status!: ComplianceStatus;

  @Column({ name: 'document_url', type: 'varchar', length: 1000, nullable: true })
  documentUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'expiring_notification_sent', type: 'boolean', default: false })
  expiringNotificationSent!: boolean;

  @Column({ name: 'expired_notification_sent', type: 'boolean', default: false })
  expiredNotificationSent!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;
}
