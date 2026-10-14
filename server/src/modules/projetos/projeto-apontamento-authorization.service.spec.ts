import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoApontamentoAuthorizationService } from './projeto-apontamento-authorization.service';
import { ProjetoPapel } from './types/projeto.types';

describe('ProjetoApontamentoAuthorizationService', () => {
  const user = { sub: 'usuario-1', empresaId: 7 } as never;
  const criarServico = (assertFeatureActionAccess: jest.Mock) =>
    new ProjetoApontamentoAuthorizationService({} as never, { assertFeatureActionAccess } as never, {} as never, {} as never);

  it('confere cada ação em Meus apontamentos e devolve as permissões do autor', async () => {
    const permitidas = new Set<string>([ProjetoAcao.INCLUIR, ProjetoAcao.EXCLUIR]);
    const assertFeatureActionAccess = jest.fn(async (_user: unknown, _funcionalidade: string, acao: string) => {
      if (!permitidas.has(acao)) throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
      return 7;
    });

    await expect(criarServico(assertFeatureActionAccess).permissoesDoAutor(user))
      .resolves.toEqual({ podeIncluir: true, podeAlterar: false, podeExcluir: true });
    expect(assertFeatureActionAccess).toHaveBeenCalledWith(user, ProjetoFuncionalidade.MEUS_APONTAMENTOS, ProjetoAcao.ALTERAR);
  });

  it('nao transforma falhas inesperadas em permissao negada', async () => {
    const falha = new Error('Catálogo indisponível.');

    await expect(criarServico(jest.fn().mockRejectedValue(falha)).permissoesDoAutor(user)).rejects.toBe(falha);
  });

  it.each([
    [ProjetoPapel.RESPONSAVEL, true],
    [ProjetoPapel.MEMBRO, true],
    [ProjetoPapel.OBSERVADOR, false],
    [null, false]
  ])('o papel %s lanca horas: %s', (papel, esperado) => {
    expect(criarServico(jest.fn()).lancaHoras(papel)).toBe(esperado);
  });

  describe('Horas do projeto', () => {
    const contexto = (papel: ProjetoPapel | null, arquivadoEm: Date | null = null) =>
      ({ empresaId: 7, projeto: { id: 'projeto-1', arquivadoEm }, papel }) as never;
    const montar = (opcoes: { admin?: boolean; hierarquia?: { restrito: boolean; usuarioIds: string[] }; acoes?: string[] } = {}) => {
      const acoes = new Set(opcoes.acoes ?? []);
      const authorization = {
        isSystemAdmin: jest.fn().mockReturnValue(opcoes.admin ?? false),
        assertWritableProject: jest.fn((projeto: { arquivadoEm: Date | null }) => {
          if (projeto.arquivadoEm) throw new BadRequestException('O projeto arquivado esta disponivel somente para consulta.');
        }),
        visibilityWhere: jest.fn().mockReturnValue({ OR: [{ responsavelId: 'usuario-1' }] }),
        assertFeatureActionAccess: jest.fn(async (_user: unknown, funcionalidade: string, acao: string) => {
          if (!acoes.has(`${funcionalidade}:${acao}`)) throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
          return 7;
        })
      };
      const hierarquia = { escopo: jest.fn().mockResolvedValue({ recursoIds: [], ...(opcoes.hierarquia ?? { restrito: false, usuarioIds: [] }) }) };
      const orcamento = {
        gerenciarFinanceiro: jest.fn(async () => {
          if (!opcoes.admin && !acoes.has('orcamento-do-projeto:gerenciar_financeiro')) throw new ForbiddenException('Usuario sem permissao para gerenciar o financeiro neste projeto.');
        })
      };
      const service = new ProjetoApontamentoAuthorizationService({} as never, authorization as never, hierarquia as never, orcamento as never);
      return { service, hierarquia };
    };

    it('da visao completa ao responsavel e ao administrador e, ao superior, so a propria e a dos subordinados', async () => {
      const completa = montar();
      await expect(completa.service.escopoDasHoras(user, contexto(ProjetoPapel.RESPONSAVEL))).resolves.toEqual({ completo: true, usuarioIds: [] });
      await expect(montar({ admin: true }).service.escopoDasHoras(user, contexto(null))).resolves.toEqual({ completo: true, usuarioIds: [] });
      expect(completa.hierarquia.escopo).not.toHaveBeenCalled();

      const superior = montar({ hierarquia: { restrito: true, usuarioIds: ['usuario-1', 'subordinado-1'] } });
      const escopo = await superior.service.escopoDasHoras(user, contexto(ProjetoPapel.MEMBRO));
      expect(escopo).toEqual({ completo: false, usuarioIds: ['usuario-1', 'subordinado-1'] });
      expect(superior.service.filtroDoEscopo(escopo)).toEqual({ usuarioId: { in: ['usuario-1', 'subordinado-1'] } });
      expect(superior.service.filtroDoEscopo({ completo: true, usuarioIds: [] })).toEqual({});
    });

    it('deixa quem nao tem recurso so com os proprios apontamentos, embora o backlog nao seja restrito para essa pessoa', async () => {
      await expect(montar().service.escopoDasHoras(user, contexto(ProjetoPapel.OBSERVADOR)))
        .resolves.toEqual({ completo: false, usuarioIds: ['usuario-1'] });
    });

    it('calcula as permissoes efetivas e deixa o projeto arquivado somente para consulta', async () => {
      const todas = [
        'horas-do-projeto:aprovar_horas', 'horas-do-projeto:reabrir_horas', 'horas-do-projeto:fechar_periodo',
        'orcamento-do-projeto:visualizar_financeiro', 'orcamento-do-projeto:gerenciar_financeiro'
      ];
      const { service } = montar({ acoes: todas });

      await expect(service.permissoesDasHoras(user, contexto(ProjetoPapel.RESPONSAVEL))).resolves.toEqual({
        podeAprovar: true, podeReabrir: true, podeFecharPeriodo: true, podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true
      });
      await expect(service.permissoesDasHoras(user, contexto(ProjetoPapel.MEMBRO))).resolves.toMatchObject({ podeFecharPeriodo: false });
      await expect(service.permissoesDasHoras(user, contexto(ProjetoPapel.RESPONSAVEL, new Date()))).resolves.toEqual({
        podeAprovar: false, podeReabrir: false, podeFecharPeriodo: false, podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: false
      });
      // O administrador fecha competências sem ser o responsável e vê o financeiro sem a ação do catálogo.
      await expect(montar({ admin: true, acoes: ['horas-do-projeto:fechar_periodo'] }).service.permissoesDasHoras(user, contexto(null)))
        .resolves.toEqual({
          podeAprovar: false, podeReabrir: false, podeFecharPeriodo: true, podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true
        });
    });

    it('reserva o fechamento de competencias ao responsavel e ao administrador e lista os projetos visiveis', () => {
      const { service } = montar();

      expect(() => service.assertFechamentoDePeriodo(user, contexto(ProjetoPapel.RESPONSAVEL))).not.toThrow();
      expect(() => montar({ admin: true }).service.assertFechamentoDePeriodo(user, contexto(null))).not.toThrow();
      expect(() => service.assertFechamentoDePeriodo(user, contexto(ProjetoPapel.MEMBRO)))
        .toThrow(new ForbiddenException('Somente o responsável do projeto fecha e reabre as competências.'));
      expect(() => service.assertProjetoGravavel(contexto(ProjetoPapel.RESPONSAVEL, new Date()))).toThrow(BadRequestException);
      expect(service.filtroProjetosDasHoras(user, 7, false)).toEqual({ empresaId: 7, OR: [{ responsavelId: 'usuario-1' }], arquivadoEm: null });
      expect(service.filtroProjetosDasHoras(user, 7, true)).toEqual({ empresaId: 7, OR: [{ responsavelId: 'usuario-1' }] });
    });
  });
});
