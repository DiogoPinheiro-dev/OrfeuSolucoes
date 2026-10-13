import { ConflictException } from '@nestjs/common';
import { ProjetoApontamentoService } from './projeto-apontamento.service';

describe('ProjetoApontamentoService', () => {
  const user = { sub: 'usuario-1', empresaId: 7 } as never;
  const exclusao = { id: 'apontamento-1', versao: 1 };
  const criarServico = (transacao: jest.Mock) => {
    const prisma = {
      $transaction: transacao,
      projetoApontamento: { findFirst: jest.fn().mockResolvedValue({ projetoId: 'projeto-1' }) }
    };
    const authorization = {
      assertAcaoDoAutor: jest.fn().mockResolvedValue(7),
      projetoParaLancar: jest.fn().mockResolvedValue({ empresaId: 7, projeto: { id: 'projeto-1', situacao: 'EM_ANDAMENTO' }, papel: 'MEMBRO' })
    };
    const naoUsado = {} as never;

    return new ProjetoApontamentoService(prisma as never, authorization as never, naoUsado, naoUsado, naoUsado, naoUsado);
  };

  it('grava em transação serializável e troca o impasse do SQL Server por um conflito com orientação', async () => {
    const impasse = Object.assign(new Error('Transaction failed due to a write conflict or a deadlock.'), { code: 'P2034' });
    const transacao = jest.fn().mockRejectedValue(impasse);

    await expect(criarServico(transacao).excluir(exclusao, user)).rejects.toThrow(
      new ConflictException('Outra operação alterou os seus apontamentos ao mesmo tempo. Atualize os dados e tente de novo.')
    );
    expect(transacao).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('preserva os demais erros da transação', async () => {
    const falha = Object.assign(new Error('Banco indisponível.'), { code: 'P1001' });

    await expect(criarServico(jest.fn().mockRejectedValue(falha)).excluir(exclusao, user)).rejects.toBe(falha);
  });
});
