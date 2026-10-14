import { ConflictException } from '@nestjs/common';
import { isPrismaTransactionConflict, runSerializableTransaction } from './serializable-transaction.util';

describe('runSerializableTransaction', () => {
  const mensagem = 'Outra operação alterou os dados ao mesmo tempo. Atualize os dados e tente de novo.';

  it('executa a operação em transação serializável e devolve o resultado', async () => {
    const tx = { marcador: 'tx' };
    const prisma = { $transaction: jest.fn(async (operation: (client: unknown) => Promise<unknown>) => operation(tx)) };

    await expect(runSerializableTransaction(prisma as never, async (client) => client, mensagem)).resolves.toBe(tx);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('troca o impasse do banco por um conflito com orientação', async () => {
    const impasse = Object.assign(new Error('Transaction failed due to a write conflict or a deadlock.'), { code: 'P2034' });
    const prisma = { $transaction: jest.fn().mockRejectedValue(impasse) };

    await expect(runSerializableTransaction(prisma as never, async () => undefined, mensagem)).rejects.toThrow(new ConflictException(mensagem));
  });

  it('preserva os demais erros', async () => {
    const falha = Object.assign(new Error('Banco indisponível.'), { code: 'P1001' });
    const prisma = { $transaction: jest.fn().mockRejectedValue(falha) };

    await expect(runSerializableTransaction(prisma as never, async () => undefined, mensagem)).rejects.toBe(falha);
  });

  it.each([
    [{ code: 'P2034' }, true],
    [{ code: 'P2002' }, false],
    [new Error('sem código'), false],
    [null, false],
    ['P2034', false]
  ])('reconhece o conflito de transação em %p: %s', (erro, esperado) => {
    expect(isPrismaTransactionConflict(erro)).toBe(esperado);
  });
});
