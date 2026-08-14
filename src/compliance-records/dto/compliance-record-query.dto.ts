import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ComplianceType } from '../../common/enums/compliance-type.enum';
import { ComplianceStatus } from '../../common/enums/compliance-status.enum';

export class ComplianceRecordQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: ComplianceStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Filter by employee department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: ComplianceType, description: 'Filter by compliance type' })
  @IsOptional()
  @IsEnum(ComplianceType)
  complianceType?: ComplianceType;

  @ApiPropertyOptional({ description: 'Search by employee name, code, or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
