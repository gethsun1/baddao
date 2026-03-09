import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createLogger } from '../../common/logger';

const logger = createLogger('DaoService');

@Injectable()
export class DaoService {
    constructor(private readonly prisma: PrismaService) { }

    findAll(creator?: string) {
        logger.debug({ module: 'DaoService' }, 'Fetching all DAOs');
        return this.prisma.dAO.findMany({
            where: creator ? { creator } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByAddress(address: string) {
        const dao = await this.prisma.dAO.findFirst({
            where: {
                OR: [
                    { daoAddress: address },
                    { governorAddress: address },
                ],
            },
        });
        if (!dao) throw new NotFoundException(`DAO ${address} not found`);
        return dao;
    }

    async getProposals(address: string) {
        const dao = await this.findByAddress(address);
        return this.prisma.proposal.findMany({
            where: { daoId: dao.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getMembers(address: string) {
        const dao = await this.findByAddress(address);
        return this.prisma.member.findMany({
            where: { daoId: dao.id },
            orderBy: { joinedAt: 'desc' },
        });
    }

    async getTransactions(address: string) {
        const dao = await this.findByAddress(address);
        return this.prisma.treasuryTransaction.findMany({
            where: { daoId: dao.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(address: string, data: { daoName?: string; description?: string }) {
        // Try both the governor address and daoAddress columns
        const dao = await this.prisma.dAO.findFirst({
            where: {
                OR: [
                    { daoAddress: address },
                    { governorAddress: address },
                ],
            },
        });
        if (!dao) throw new NotFoundException(`DAO ${address} not found`);
        return this.prisma.dAO.update({
            where: { id: dao.id },
            data: {
                daoName: data.daoName ?? dao.daoName,
                description: data.description ?? dao.description,
            },
        });
    }
}
