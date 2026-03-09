import { Test, TestingModule } from '@nestjs/testing';
import { MintService } from './mint.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException, BadRequestException } from '@nestjs/common';

// ── Mock helpers ──────────────────────────────────────────────────────────────
const mockPrisma = {
    dAO: {
        findFirst: jest.fn(),
    },
    fiatOrder: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
};

const mockMintQueue = {
    add: jest.fn(),
};

describe('MintService', () => {
    let service: MintService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MintService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: getQueueToken('mint'), useValue: mockMintQueue },
            ],
        }).compile();
        service = module.get(MintService);
    });

    // ── initiate ──────────────────────────────────────────────────────────────
    describe('initiate()', () => {
        it('creates a PENDING order when DAO exists and ref is unique', async () => {
            mockPrisma.dAO.findFirst.mockResolvedValue({ id: 'dao-1', daoAddress: '0xabc' });
            mockPrisma.fiatOrder.findFirst.mockResolvedValue(null);
            mockPrisma.fiatOrder.create.mockResolvedValue({ id: 'order-1', status: 'PENDING' });

            const result = await service.initiate(
                {
                    daoAddress: '0xabc',
                    paymentProviderRef: 'stripe-ref-001',
                    amountFiat: '50',
                    currency: 'USD',
                },
                '127.0.0.1',
            );

            expect(result.status).toBe('PENDING');
            expect(mockMintQueue.add).not.toHaveBeenCalled();
        });

        it('throws BadRequestException if DAO not found', async () => {
            mockPrisma.dAO.findFirst.mockResolvedValue(null);
            await expect(
                service.initiate({ daoAddress: '0xdead', paymentProviderRef: 'ref', amountFiat: '10', currency: 'USD' }, '127.0.0.1'),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws ConflictException on duplicate paymentProviderRef', async () => {
            mockPrisma.dAO.findFirst.mockResolvedValue({ id: 'dao-1' });
            mockPrisma.fiatOrder.findFirst.mockResolvedValue({ id: 'existing' });
            await expect(
                service.initiate({ daoAddress: '0xabc', paymentProviderRef: 'dup-ref', amountFiat: '10', currency: 'USD' }, '127.0.0.1'),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ── confirmAndQueue ───────────────────────────────────────────────────────
    describe('confirmAndQueue()', () => {
        it('queues mint job on PENDING order', async () => {
            mockPrisma.fiatOrder.findFirst.mockResolvedValue({
                id: 'order-1',
                status: 'PENDING',
                dao: { daoAddress: '0xabc', nftAddress: '0xnft' },
            });
            mockPrisma.fiatOrder.update.mockResolvedValue({});

            await service.confirmAndQueue('ref-001', '1000000000000000000');

            expect(mockPrisma.fiatOrder.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMED' }) }),
            );
            expect(mockMintQueue.add).toHaveBeenCalledWith('execute-mint', expect.any(Object), expect.any(Object));
        });

        it('skips silently if order not found (duplicate webhook)', async () => {
            mockPrisma.fiatOrder.findFirst.mockResolvedValue(null);
            await expect(service.confirmAndQueue('ghost-ref', '100')).resolves.toBeUndefined();
            expect(mockMintQueue.add).not.toHaveBeenCalled();
        });

        it('skips silently if order already MINTED (idempotency)', async () => {
            mockPrisma.fiatOrder.findFirst.mockResolvedValue({
                id: 'order-1',
                status: 'MINTED',
                dao: {},
            });
            await service.confirmAndQueue('ref-done', '100');
            expect(mockMintQueue.add).not.toHaveBeenCalled();
        });
    });
});
