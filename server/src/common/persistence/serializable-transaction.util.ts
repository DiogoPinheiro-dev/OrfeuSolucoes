import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type TransactionRunner = {
  $transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    options: { isolationLevel: Prisma.TransactionIsolationLevel }
  ): Promise<T>;
};

/** O SQL Server escolheu a transação como vítima de um impasse ou de um conflito de escrita. */
export function isPrismaTransactionConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';
}

/**
 * Executa a operação em transação serializável. Quando o banco a escolhe como vítima de um impasse, a pessoa
 * recebe um conflito com orientação em vez de um erro genérico; os demais erros seguem como vieram.
 */
export async function runSerializableTransaction<T>(
  prisma: TransactionRunner,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  conflictMessage: string
): Promise<T> {
  try {
    return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (isPrismaTransactionConflict(error)) {
      throw new ConflictException(conflictMessage);
    }
    throw error;
  }
}
