import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RevenueService {
    constructor(private readonly prisma: PrismaService) { }

    async getTotal() {
        const all = await this.prisma.treasuryTransaction.findMany({ where: { type: 'PROTOCOL_FEE' } });
        const total = all.reduce((acc: bigint, r: any) => acc + BigInt(r.amount), 0n);
        return { total: total.toString(), count: all.length };
    }

    async getByDAO() {
        const all = await this.prisma.treasuryTransaction.findMany({
            where: { type: 'PROTOCOL_FEE' },
            orderBy: { createdAt: 'desc' },
            include: { dao: true }
        });
        const grouped: Record<string, bigint> = {};
        for (const r of all) {
            const addr = r.dao.daoAddress;
            grouped[addr] = (grouped[addr] ?? 0n) + BigInt(r.amount);
        }
        return Object.entries(grouped).map(([daoAddress, amount]) => ({
            daoAddress,
            total: amount.toString(),
        }));
    }

    async getBySource() {
        const all = await this.prisma.treasuryTransaction.findMany();
        const grouped: Record<string, bigint> = {};
        for (const r of all) {
            const t = r.type;
            grouped[t] = (grouped[t] ?? 0n) + BigInt(r.amount);
        }
        return Object.entries(grouped).map(([source, amount]) => ({
            source,
            total: amount.toString(),
        }));
    }

    async getSummary() {
        const [total, byDao, bySource] = await Promise.all([
            this.getTotal(),
            this.getByDAO(),
            this.getBySource(),
        ]);
        return { total, byDao, bySource };
    }
}
