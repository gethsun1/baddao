import { Controller, Get } from '@nestjs/common';
import { RevenueService } from './revenue.service';

@Controller('protocol/revenue')
export class RevenueController {
    constructor(private readonly revenueService: RevenueService) { }

    @Get()
    getSummary() {
        return this.revenueService.getSummary();
    }
}
