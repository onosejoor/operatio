import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';

export const RATE_LIMITS = {
  default: {
    ttl: 60_000,
    limit: 100,
  },
  auth: {
    register: {
      ttl: 60_000,
      limit: 5,
    },
    verifyEmail: {
      ttl: 60_000,
      limit: 10,
    },
    resendVerification: {
      ttl: 60_000,
      limit: 3,
    },
    login: {
      ttl: 60_000,
      limit: 5,
    },
    refresh: {
      ttl: 60_000,
      limit: 20,
    },
  },
} as const;

export const MONITOR_CHECK_QUEUE = 'monitor-checks';
export const MONITOR_CHECK_JOB = 'check-monitor';

export const PRISMA_TRANSACTION_TIMEOUT = 30000;

export type PrismaTransactionType = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
