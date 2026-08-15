import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { UpcomingQueryDto } from './dto/upcoming-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Total / active / expiring soon / expired counts' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('by-department')
  @ApiOperation({ summary: 'Compliance record counts grouped by department' })
  getByDepartment() {
    return this.dashboardService.getByDepartment();
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Compliance record counts grouped by compliance type' })
  getByType() {
    return this.dashboardService.getByType();
  }

  @Get('upcoming')
  @ApiOperation({
    summary:
      'Records expiring within the next N days (default 30), or between startDate and endDate',
  })
  getUpcoming(@Query() query: UpcomingQueryDto) {
    return this.dashboardService.getUpcoming(query);
  }
}
