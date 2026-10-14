import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjetoApontamentoAprovacaoService } from './projeto-apontamento-aprovacao.service';

describe('ProjetoApontamentoAprovacaoService', () => {
  const user = { sub: 'gestora-1', empresaId: 7 } as never;
  const contexto = { empresaId: 7, projeto: { id: 'projeto-1', situacao: 'EM_ANDAMENTO', arquivadoEm: null }, papel: 'RESPONSAVEL' };
  const aprovado = {
    id: 'apontamento-1',
    usuarioId: 'analista-1',
    status: 'APROVADO',
    arquivadoEm: null,
    dataTrabalho: new Date('2026-09-14T00:00:00.000Z'),
    versao: 3,
    custoSituacao: 'CALCULADO',
    custoId: 'linha-1',
    taxaHoraAplicada: '120.0000',
    valorCusto: '180.00',
    moeda: 'BRL'
  };
  const criarServico = (transacao: jest.Mock, decididos: unknown[] = [], idempotencia: Record<string, jest.Mock> = {}) => {
    const tx = {
      projetoApontamento: {
        findMany: jest.fn().mockResolvedValue([aprovado]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    };
    const authorization = {
      assertAcaoNasHoras: jest.fn().mockResolvedValue(7),
      projetoDasHoras: jest.fn().mockResolvedValue(contexto),
      assertProjetoGravavel: jest.fn(),
      escopoDasHoras: jest.fn().mockResolvedValue({ completo: true, usuarioIds: [] }),
      filtroDoEscopo: jest.fn().mockReturnValue({})
    };
    const consultas = { doProjeto: jest.fn().mockResolvedValue(decididos) };
    const periodos = { emCompetenciaFechada: jest.fn().mockResolvedValue(new Set()), competencia: jest.fn().mockReturnValue('2026-09') };
    const auditoria = { registrar: jest.fn().mockResolvedValue({}) };
    const service = new ProjetoApontamentoAprovacaoService(
      { $transaction: transacao } as never,
      authorization as never,
      consultas as never,
      periodos as never,
      {} as never,
      idempotencia as never,
      auditoria as never
    );
    return { service, tx, auditoria, consultas };
  };
  const reabertura = { projetoId: 'projeto-1', id: 'apontamento-1', versao: 3, motivo: 'Data lançada errada.' };

  it('decide em transacao serializavel e troca o impasse do SQL Server por um conflito com orientacao', async () => {
    const impasse = Object.assign(new Error('Transaction failed due to a write conflict or a deadlock.'), { code: 'P2034' });
    const transacao = jest.fn().mockRejectedValue(impasse);

    await expect(criarServico(transacao).service.reabrir(reabertura, user)).rejects.toThrow(
      new ConflictException('Outra operação alterou os apontamentos deste projeto ao mesmo tempo. Atualize os dados e tente de novo.')
    );
    expect(transacao).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('responde nao encontrado quando o apontamento reaberto some antes da consulta, apagado pelo autor', async () => {
    const { service, tx, auditoria } = criarServico(jest.fn(async (operacao: (client: unknown) => Promise<unknown>) => operacao(tx)));

    await expect(service.reabrir(reabertura, user)).rejects.toThrow(new NotFoundException('Apontamento não encontrado.'));
    expect(tx.projetoApontamento.updateMany).toHaveBeenCalledWith({
      where: { id: 'apontamento-1', versao: 3 },
      data: expect.objectContaining({ status: 'RASCUNHO', motivo: 'Data lançada errada.', custoSituacao: 'NAO_APLICAVEL', valorCusto: null, versao: { increment: 1 } })
    });
    expect(auditoria.registrar).toHaveBeenCalledWith(tx, expect.objectContaining({ evento: 'REABERTO', entidadeId: 'apontamento-1' }));
  });

  it('repete o lote pela chave de idempotencia sem decidir de novo, inclusive com a resposta guardada vazia', async () => {
    const decididos = [{ id: 'apontamento-1', status: 'APROVADO' }];
    const idempotencia = {
      iniciar: jest.fn()
        .mockResolvedValueOnce({ reutilizada: true, id: 'operacao-1', resposta: { apontamentos: ['apontamento-1', 42] } })
        .mockResolvedValueOnce({ reutilizada: true, id: 'operacao-1', resposta: null }),
      concluir: jest.fn()
    };
    const { service, tx, consultas } = criarServico(
      jest.fn(async (operacao: (client: unknown) => Promise<unknown>) => operacao(tx)),
      decididos,
      idempotencia
    );
    const lote = { projetoId: 'projeto-1', apontamentos: [{ id: 'apontamento-1', versao: 2 }], chaveIdempotencia: 'lote-1' };

    await expect(service.aprovar(lote, user)).resolves.toBe(decididos);
    expect(consultas.doProjeto).toHaveBeenLastCalledWith(['apontamento-1'], user, contexto);
    await service.aprovar(lote, user);
    expect(consultas.doProjeto).toHaveBeenLastCalledWith([], user, contexto);
    expect(idempotencia.iniciar).toHaveBeenCalledWith(tx, {
      empresaId: 7, projetoId: 'projeto-1', usuarioId: 'gestora-1', operacao: 'APROVAR_APONTAMENTOS', chave: 'lote-1'
    }, { apontamentos: [{ id: 'apontamento-1', versao: 2 }], motivo: null });
    expect(tx.projetoApontamento.findMany).not.toHaveBeenCalled();
    expect(tx.projetoApontamento.updateMany).not.toHaveBeenCalled();
    expect(idempotencia.concluir).not.toHaveBeenCalled();
  });
});
