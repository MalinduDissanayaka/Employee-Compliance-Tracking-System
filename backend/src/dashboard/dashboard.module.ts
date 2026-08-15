import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ComplianceRecord } from '../compliance-records/entities/compliance-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRecord])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
