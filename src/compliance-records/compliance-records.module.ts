import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceRecordsService } from './compliance-records.service';
import { ComplianceRecordsController } from './compliance-records.controller';
import { ComplianceRecord } from './entities/compliance-record.entity';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRecord]), EmployeesModule],
  controllers: [ComplianceRecordsController],
  providers: [ComplianceRecordsService],
  exports: [ComplianceRecordsService, TypeOrmModule],
})
export class ComplianceRecordsModule {}
