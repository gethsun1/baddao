import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import { DaoService } from './dao.service';

@Controller('daos')
export class DaoController {
    constructor(private readonly daoService: DaoService) { }

    @Get()
    findAll(@Query('creator') creator?: string) {
        return this.daoService.findAll(creator);
    }

    @Get(':address')
    findOne(@Param('address') address: string) {
        return this.daoService.findByAddress(address);
    }

    @Get(':address/proposals')
    getProposals(@Param('address') address: string) {
        return this.daoService.getProposals(address);
    }

    @Get(':address/members')
    getMembers(@Param('address') address: string) {
        return this.daoService.getMembers(address);
    }

    @Get(':address/transactions')
    getTransactions(@Param('address') address: string) {
        return this.daoService.getTransactions(address);
    }
    @Patch(':address')
    update(
        @Param('address') address: string,
        @Body() body: { daoName?: string; description?: string },
    ) {
        return this.daoService.update(address, body);
    }
}
