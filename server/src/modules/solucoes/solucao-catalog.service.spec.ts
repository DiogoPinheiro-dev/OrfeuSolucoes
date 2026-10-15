import { BadRequestException } from '@nestjs/common';
import { SolucaoCatalogService } from './solucao-catalog.service';

describe('SolucaoCatalogService', () => {
  it('reserva o identificador da solução de horas aposentada', async () => {
    const prisma = { solucao: { findUnique: jest.fn() } };
    const service = new SolucaoCatalogService(prisma as never, {} as never, {} as never, {} as never);

    await expect(service.create({ slug: 'Horas', nome: 'Nova solução' })).rejects.toThrow('aposentada');
    expect(prisma.solucao.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['templates-de-projeto', 'projetos.relatorio-livre'],
    ['relatorio-livre', 'projetos.portfolio-de-projetos']
  ])('reserva slug e chave técnica das funcionalidades retiradas', async (slug, registryKey) => {
    const prisma = { solucao: { findUnique: jest.fn().mockResolvedValue({ id: 1, slug: 'projetos' }) } };
    const agrupamentos = { assertSlugDisponivel: jest.fn(), assertAssociacaoValida: jest.fn() };
    const service = new SolucaoCatalogService(prisma as never, {} as never, {} as never, agrupamentos as never);

    await expect(service.createFuncionalidade({ solucaoId: 1, slug, titulo: 'Retirada', registryKey }))
      .rejects.toThrow('aposentada');
    expect(agrupamentos.assertSlugDisponivel).not.toHaveBeenCalled();
  });

  it('nega alteracao direta de solucao publicada e orienta o ciclo versionado', async () => {
    const prisma = { solucao: { findUnique: jest.fn().mockResolvedValue({ id: 1, padraoSistema: true, statusPublicacao: 'PUBLICADA' }) } };
    const service = new SolucaoCatalogService(prisma as never, {} as never, {} as never, {} as never);

    await expect(service.update({ id: 1, nome: 'Customizada' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.solucao).not.toHaveProperty('update');
  });

  it('nao injeta acoes CRUD ao criar funcionalidade administrativa', async () => {
    const created = { id: 10, solucaoId: 1, slug: 'relatorio', titulo: 'Relatorio', ordem: 0, ativo: true, somenteAdminSistema: false, padraoSistema: false, statusPublicacao: 'RASCUNHO' };
    const prisma = {
      solucao: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
      funcionalidade: { create: jest.fn().mockResolvedValue(created), findUniqueOrThrow: jest.fn().mockResolvedValue({ ...created, acoes: [] }) }
    };
    const actions = { syncFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined) };
    const agrupamentos = { assertSlugDisponivel: jest.fn().mockResolvedValue(undefined), assertAssociacaoValida: jest.fn().mockResolvedValue(undefined) };
    const service = new SolucaoCatalogService(prisma as never, actions as never, {} as never, agrupamentos as never);

    await service.createFuncionalidade({ solucaoId: 1, slug: 'relatorio', titulo: 'Relatorio' });
    expect(actions.syncFuncionalidadeAcoes).toHaveBeenCalledWith(10, undefined, { includeDefaultActions: false });
    expect(agrupamentos.assertSlugDisponivel).toHaveBeenCalledWith(1, 'relatorio');
    expect(prisma.funcionalidade.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ agrupamentoId: null, ordemNoAgrupamento: null })
    });
  });

  describe('organizacao de funcionalidade publicada', () => {
    const publicada = { id: 20, solucaoId: 1, slug: 'tipos', titulo: 'Tipos', ordem: 70, ativo: true, somenteAdminSistema: false, padraoSistema: true, statusPublicacao: 'PUBLICADA', agrupamentoId: null, ordemNoAgrupamento: null };

    function build() {
      const prisma = {
        funcionalidade: {
          findUnique: jest.fn().mockResolvedValue(publicada),
          update: jest.fn().mockResolvedValue(publicada),
          findUniqueOrThrow: jest.fn().mockResolvedValue({ ...publicada, acoes: [] })
        }
      };
      const actions = { appendFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined) };
      const agrupamentos = {
        assertAssociacaoValida: jest.fn().mockResolvedValue(undefined),
        registrarAssociacao: jest.fn().mockResolvedValue(undefined)
      };
      return { prisma, actions, agrupamentos, service: new SolucaoCatalogService(prisma as never, actions as never, {} as never, agrupamentos as never) };
    }

    it('associa ao agrupamento sem exigir rascunho e registra auditoria', async () => {
      const { prisma, agrupamentos, service } = build();

      await service.updateFuncionalidade({ id: 20, agrupamentoId: 5, ordemNoAgrupamento: 2 }, 'admin-1');

      expect(agrupamentos.assertAssociacaoValida).toHaveBeenCalledWith(1, 5);
      expect(prisma.funcionalidade.update).toHaveBeenCalledWith({ where: { id: 20 }, data: { agrupamentoId: 5, ordemNoAgrupamento: 2 } });
      expect(agrupamentos.registrarAssociacao).toHaveBeenCalledWith(
        20,
        { agrupamentoId: null, ordemNoAgrupamento: null },
        { agrupamentoId: 5, ordemNoAgrupamento: 2 },
        'admin-1'
      );
    });

    it('salva a ordem mesmo quando o formulario envia a lista de novas acoes', async () => {
      const { prisma, actions, agrupamentos, service } = build();

      await service.updateFuncionalidade({ id: 20, ordem: 75, acoes: [] });

      expect(prisma.funcionalidade.update).toHaveBeenCalledWith({ where: { id: 20 }, data: { ordem: 75 } });
      expect(actions.appendFuncionalidadeAcoes).toHaveBeenCalledWith(20, []);
      expect(agrupamentos.assertAssociacaoValida).not.toHaveBeenCalled();
    });

    it('continua exigindo rascunho para alteracao cadastral', async () => {
      const { prisma, service } = build();

      await expect(service.updateFuncionalidade({ id: 20, titulo: 'Outro', agrupamentoId: 5 })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.funcionalidade.update).not.toHaveBeenCalled();
    });
  });
});
