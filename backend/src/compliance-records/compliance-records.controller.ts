import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComplianceRecordsService } from './compliance-records.service';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { UpdateComplianceRecordDto } from './dto/update-compliance-record.dto';
import { ComplianceRecordQueryDto } from './dto/compliance-record-query.dto';

@ApiTags('Compliance Records')
@Controller('compliance-records')
export class ComplianceRecordsController {
  constructor(private readonly complianceRecordsService: ComplianceRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new compliance record' })
  create(@Body() createComplianceRecordDto: CreateComplianceRecordDto) {
    return this.complianceRecordsService.create(createComplianceRecordDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List compliance records (filter by employeeId, status, department, complianceType; paginated)',
  })
  findAll(@Query() query: ComplianceRecordQueryDto) {
    return this.complianceRecordsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single compliance record by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceRecordsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a compliance record' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplianceRecordDto: UpdateComplianceRecordDto,
  ) {
    return this.complianceRecordsService.update(id, updateComplianceRecordDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a compliance record' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceRecordsService.remove(id);
  }
}
