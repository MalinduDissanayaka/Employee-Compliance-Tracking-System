import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateComplianceRecordDto } from './create-compliance-record.dto';
import { ComplianceStatus } from '../../common/enums/compliance-status.enum';

export class UpdateComplianceRecordDto extends PartialType(
  CreateComplianceRecordDto,
) {
  @ApiPropertyOptional({
    enum: ComplianceStatus,
    description:
      'Manual status override, e.g. mark RENEWED after a document has been renewed.',
  })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;
}
