import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ComplianceType } from '../../common/enums/compliance-type.enum';
import { IsAfterDate } from '../../common/validators/is-after-date.validator';

export class CreateComplianceRecordDto {
  @ApiProperty({ description: 'ID of the employee this record belongs to' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: ComplianceType, example: ComplianceType.VISA })
  @IsNotEmpty()
  @IsEnum(ComplianceType)
  complianceType: ComplianceType;

  @ApiProperty({ example: '2026-01-15', description: 'Date the item was issued' })
  @IsNotEmpty()
  @IsDateString()
  issuedDate: string;

  @ApiProperty({
    example: '2027-01-15',
    description: 'Date the item expires. Must be after issuedDate.',
  })
  @IsNotEmpty()
  @IsDateString()
  @IsAfterDate('issuedDate', {
    message: 'expiryDate must be later than issuedDate',
  })
  expiryDate: string;

  @ApiPropertyOptional({ example: 'https://docs.company.com/visa/EMP-1001.pdf' })
  @IsOptional()
  @IsUrl({}, { message: 'documentUrl must be a valid URL' })
  @MaxLength(1000)
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'Renewal submitted to HR on 2026-01-01' })
  @IsOptional()
  @IsString()
  notes?: string;
}
