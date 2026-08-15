import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord } from '../compliance-records/entities/compliance-record.entity';
import { ComplianceStatus } from '../common/enums/compliance-status.enum';
import { UpcomingQueryDto } from './dto/upcoming-query.dto';

export interface DashboardSummary {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private readonly complianceRecordRepository: Repository<ComplianceRecord>,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const rows = await this.complianceRecordRepository
      .createQueryBuilder('record')
      .select('record.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.status')
      .getRawMany<{ status: ComplianceStatus; count: string }>();

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const count = Number(row.count);
      counts[row.status] = count;
      total += count;
    }

    return {
      total,
      active: counts[ComplianceStatus.ACTIVE] ?? 0,
      expiringSoon: counts[ComplianceStatus.EXPIRING_SOON] ?? 0,
      expired: counts[ComplianceStatus.EXPIRED] ?? 0,
    };
  }

  async getByDepartment(): Promise<{ department: string; count: number }[]> {
    const rows = await this.complianceRecordRepository
      .createQueryBuilder('record')
      .innerJoin('record.employee', 'employee')
      .select('employee.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .groupBy('employee.department')
      .orderBy('employee.department', 'ASC')
      .getRawMany<{ department: string; count: string }>();

    return rows.map((row) => ({ department: row.department, count: Number(row.count) }));
  }

  async getByType(): Promise<{ complianceType: string; count: number }[]> {
    const rows = await this.complianceRecordRepository
      .createQueryBuilder('record')
      .select('record.complianceType', 'complianceType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.complianceType')
      .orderBy('record.complianceType', 'ASC')
      .getRawMany<{ complianceType: string; count: string }>();

    return rows.map((row) => ({
      complianceType: row.complianceType,
      count: Number(row.count),
    }));
  }

  async getUpcoming(query: UpcomingQueryDto): Promise<ComplianceRecord[]> {
    const { startDate, endDate } = this.resolveWindow(query);

    return this.complianceRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.employee', 'employee')
      .where('record.expiryDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('record.status != :renewed', { renewed: ComplianceStatus.RENEWED })
      .orderBy('record.expiryDate', 'ASC')
      .getMany();
  }

  private resolveWindow(query: UpcomingQueryDto): { startDate: string; endDate: string } {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (query.startDate || query.endDate) {
      if (!query.startDate || !query.endDate) {
        throw new BadRequestException('Both startDate and endDate must be provided together');
      }
      if (new Date(query.endDate).getTime() < new Date(query.startDate).getTime()) {
        throw new BadRequestException('endDate must not be before startDate');
      }
      return { startDate: query.startDate, endDate: query.endDate };
    }

    const days = query.days ?? 30;
    const end = new Date();
    end.setDate(end.getDate() + days);
    return { startDate: todayStr, endDate: end.toISOString().slice(0, 10) };
  }
}
