import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord } from './entities/compliance-record.entity';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { UpdateComplianceRecordDto } from './dto/update-compliance-record.dto';
import { ComplianceRecordQueryDto } from './dto/compliance-record-query.dto';
import { PaginatedResultDto } from '../common/dto/pagination-query.dto';
import { ComplianceStatus } from '../common/enums/compliance-status.enum';
import { EmployeesService } from '../employees/employees.service';

function computeStatus(expiryDate: string, referenceDate = new Date()): ComplianceStatus {
  const today = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()),
  );
  const expiry = new Date(expiryDate);
  const expiryUtc = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate()));
  const diffDays = Math.floor((expiryUtc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return ComplianceStatus.EXPIRED;
  if (diffDays <= 30) return ComplianceStatus.EXPIRING_SOON;
  return ComplianceStatus.ACTIVE;
}

@Injectable()
export class ComplianceRecordsService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private readonly complianceRecordRepository: Repository<ComplianceRecord>,
    private readonly employeesService: EmployeesService,
  ) {}

  async create(dto: CreateComplianceRecordDto): Promise<ComplianceRecord> {
    await this.employeesService.findOne(dto.employeeId);
    this.validateDateOrder(dto.issuedDate, dto.expiryDate);

    const record = this.complianceRecordRepository.create({
      ...dto,
      status: computeStatus(dto.expiryDate),
    });
    return this.complianceRecordRepository.save(record);
  }

  async findAll(
    query: ComplianceRecordQueryDto,
  ): Promise<PaginatedResultDto<ComplianceRecord>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.complianceRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.employee', 'employee');

    if (query.employeeId) {
      qb.andWhere('record.employeeId = :employeeId', { employeeId: query.employeeId });
    }
    if (query.status) {
      qb.andWhere('record.status = :status', { status: query.status });
    }
    if (query.complianceType) {
      qb.andWhere('record.complianceType = :complianceType', {
        complianceType: query.complianceType,
      });
    }
    if (query.department) {
      qb.andWhere('employee.department = :department', { department: query.department });
    }
    if (query.search) {
      qb.andWhere(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.employeeCode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('record.expiryDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResultDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<ComplianceRecord> {
    const record = await this.complianceRecordRepository.findOne({
      where: { id },
      relations: { employee: true },
    });
    if (!record) {
      throw new NotFoundException(`Compliance record with id ${id} not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateComplianceRecordDto): Promise<ComplianceRecord> {
    const record = await this.findOne(id);

    if (dto.employeeId) {
      await this.employeesService.findOne(dto.employeeId);
    }

    const nextIssuedDate = dto.issuedDate ?? record.issuedDate;
    const nextExpiryDate = dto.expiryDate ?? record.expiryDate;
    this.validateDateOrder(nextIssuedDate, nextExpiryDate);

    const expiryDateChanged = dto.expiryDate && dto.expiryDate !== record.expiryDate;

    Object.assign(record, dto);

    if (dto.status) {
      // Manual status override (e.g. marking RENEWED). Reset notification
      // flags so the next lifecycle (post-renewal) can notify again.
      if (dto.status === ComplianceStatus.RENEWED || dto.status === ComplianceStatus.ACTIVE) {
        record.expiringNotificationSent = false;
        record.expiredNotificationSent = false;
      }
    } else if (expiryDateChanged) {
      record.status = computeStatus(nextExpiryDate);
      record.expiringNotificationSent = false;
      record.expiredNotificationSent = false;
    }

    return this.complianceRecordRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.complianceRecordRepository.softRemove(record);
  }

  private validateDateOrder(issuedDate: string, expiryDate: string): void {
    if (new Date(expiryDate).getTime() <= new Date(issuedDate).getTime()) {
      throw new BadRequestException('expiryDate must be later than issuedDate');
    }
  }
}
