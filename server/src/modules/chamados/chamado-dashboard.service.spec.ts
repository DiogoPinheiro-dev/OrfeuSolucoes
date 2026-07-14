import { ChamadoDashboardService } from './chamado-dashboard.service';

describe('ChamadoDashboardService', () => {
  it('calcula indicadores, medias e agrupamentos somente para a empresa ativa', async () => {
    const criadoEm = new Date('2026-07-14T10:00:00Z');
    const rows = [
      { status: 'EM_ATENDIMENTO', slaStatus: 'ATRASADO', criadoEm, primeiraRespostaEm: new Date('2026-07-14T10:30:00Z'), resolvidoEm: null, prioridadeId: 1, categoriaId: 1, responsavelId: 'u1', liderAtendimentoId: null, prioridadeConfiguracao: { nome: 'Alta', cor: '#f00' }, categoria: { nome: 'Acesso' }, responsavel: { nome: 'Ana', login: null, email: null }, liderAtendimento: null },
      { status: 'PENDENTE', slaStatus: 'PAUSADO', criadoEm, primeiraRespostaEm: new Date('2026-07-14T11:00:00Z'), resolvidoEm: null, prioridadeId: 1, categoriaId: null, responsavelId: null, liderAtendimentoId: null, prioridadeConfiguracao: { nome: 'Alta', cor: '#f00' }, categoria: null, responsavel: null, liderAtendimento: null },
      { status: 'RESOLVIDO', slaStatus: 'NO_PRAZO', criadoEm, primeiraRespostaEm: null, resolvidoEm: new Date('2026-07-14T12:00:00Z'), prioridadeId: 2, categoriaId: 1, responsavelId: 'u1', liderAtendimentoId: null, prioridadeConfiguracao: { nome: 'Normal', cor: '#00f' }, categoria: { nome: 'Acesso' }, responsavel: { nome: 'Ana', login: null, email: null }, liderAtendimento: null },
      { status: 'ARQUIVADO', slaStatus: 'NO_PRAZO', criadoEm, primeiraRespostaEm: null, resolvidoEm: null, prioridadeId: 2, categoriaId: null, responsavelId: null, liderAtendimentoId: 'u2', prioridadeConfiguracao: { nome: 'Normal', cor: '#00f' }, categoria: null, responsavel: null, liderAtendimento: { nome: 'Bruno', login: null, email: null } }
    ];
    const findMany = jest.fn().mockResolvedValue(rows);
    const authorization = { assertCompanyContext: jest.fn().mockReturnValue(7), assertFeatureAction: jest.fn().mockResolvedValue(undefined) };
    const service = new ChamadoDashboardService({ chamado: { findMany } } as any, authorization as any);
    const result = await service.obter({ sub: 'admin', empresaId: 7 } as any);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { empresaId: 7 } }));
    expect(authorization.assertFeatureAction).toHaveBeenCalledWith(expect.anything(), 'dashboard', 'visualizar');
    expect(result).toMatchObject({ totalAbertos: 2, emAtendimento: 1, pendentes: 1, resolvidos: 1, arquivados: 1, atrasados: 1, tempoMedioPrimeiraRespostaMinutos: 45, tempoMedioResolucaoMinutos: 120 });
    expect(result.porPrioridade[0]).toMatchObject({ nome: 'Alta', total: 2 });
    expect(result.porCategoria.find((item) => item.chave === 'sem-categoria')?.total).toBe(2);
    expect(result.porAtendente.find((item) => item.nome === 'Ana')?.total).toBe(2);
  });
});