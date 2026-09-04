import { ProjetoEquipeVinculoService } from './projeto-equipe-vinculo.service';

const usuario = { sub: '00000000-0000-4000-8000-000000000001' } as never;

describe('ProjetoEquipeVinculoService', () => {
  it('materializa o recurso da equipe no projeto com origem rastreável', async () => {
    const projetoEquipeId = '00000000-0000-4000-8000-000000000010';
    const projetoId = '00000000-0000-4000-8000-000000000020';
    const recursoId = '00000000-0000-4000-8000-000000000030';
    const projetoRecurso = { id: '00000000-0000-4000-8000-000000000040', projetoId, recursoId, ativo: true, vinculoDireto: false };
    const tx = {
      projetoEquipe: { findMany: jest.fn().mockResolvedValue([{ id: projetoEquipeId, projetoId }]) },
      projetoRecursoEquipe: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), count: jest.fn() },
      projetoRecurso: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(projetoRecurso), update: jest.fn() },
      projeto: { findUnique: jest.fn().mockResolvedValue({ responsavelId: 'outro' }) },
      recurso: { findUnique: jest.fn().mockResolvedValue({ usuarioId: 'membro' }) },
      projetoMembro: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), deleteMany: jest.fn() }
    };
    const auditoria = { registrar: jest.fn() };
    const service = new ProjetoEquipeVinculoService(auditoria as never);

    await service.sincronizar(tx as never, { empresaId: 7, equipeId: 'equipe-1', equipeAtiva: true, recursoIds: [recursoId], usuario });

    expect(tx.projetoRecurso.create).toHaveBeenCalledWith({ data: { empresaId: 7, projetoId, recursoId, ativo: true, vinculoDireto: false } });
    expect(tx.projetoRecursoEquipe.create).toHaveBeenCalledWith({ data: { empresaId: 7, projetoRecursoId: projetoRecurso.id, projetoEquipeId } });
    expect(tx.projetoMembro.create).toHaveBeenCalledWith({ data: { projetoId, usuarioId: 'membro', papel: 'MEMBRO', origem: 'RECURSO' } });
    expect(auditoria.registrar).toHaveBeenCalledWith(tx, expect.objectContaining({ evento: 'ALOCADO_POR_EQUIPE' }));
  });

  it('preserva vínculo direto ao retirar a origem da equipe', async () => {
    const projetoRecurso = { id: 'projeto-recurso-1', projetoId: 'projeto-1', recursoId: 'recurso-1', ativo: true, vinculoDireto: true };
    const origem = { id: 'origem-1', projetoEquipeId: 'projeto-equipe-1', projetoRecursoId: projetoRecurso.id, projetoRecurso, projetoEquipe: { projetoId: projetoRecurso.projetoId } };
    const tx = {
      projetoEquipe: { findMany: jest.fn().mockResolvedValue([]) },
      projetoRecursoEquipe: { findMany: jest.fn().mockResolvedValue([origem]), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      projetoRecurso: { update: jest.fn() },
      recurso: { findUnique: jest.fn() },
      projetoMembro: { deleteMany: jest.fn() }
    };
    const service = new ProjetoEquipeVinculoService({ registrar: jest.fn() } as never);

    await service.sincronizar(tx as never, { empresaId: 7, equipeId: 'equipe-1', equipeAtiva: false, recursoIds: [], usuario });

    expect(tx.projetoRecursoEquipe.delete).toHaveBeenCalledWith({ where: { id: origem.id } });
    expect(tx.projetoRecurso.update).not.toHaveBeenCalled();
    expect(tx.projetoMembro.deleteMany).not.toHaveBeenCalled();
  });

  it('desativa vínculo exclusivamente derivado quando acaba a última origem', async () => {
    const projetoRecurso = { id: 'projeto-recurso-1', projetoId: 'projeto-1', recursoId: 'recurso-1', ativo: true, vinculoDireto: false };
    const origem = { id: 'origem-1', projetoEquipeId: 'projeto-equipe-1', projetoRecursoId: projetoRecurso.id, projetoRecurso, projetoEquipe: { projetoId: projetoRecurso.projetoId } };
    const tx = {
      projetoEquipe: { findMany: jest.fn().mockResolvedValue([]) },
      projetoRecursoEquipe: { findMany: jest.fn().mockResolvedValue([origem]), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      projetoRecurso: { update: jest.fn() },
      recurso: { findUnique: jest.fn().mockResolvedValue({ usuarioId: 'membro' }) },
      projetoMembro: { deleteMany: jest.fn() }
    };
    const service = new ProjetoEquipeVinculoService({ registrar: jest.fn() } as never);

    await service.sincronizar(tx as never, { empresaId: 7, equipeId: 'equipe-1', equipeAtiva: false, recursoIds: [], usuario });

    expect(tx.projetoRecurso.update).toHaveBeenCalledWith({ where: { id: projetoRecurso.id }, data: { ativo: false, versao: { increment: 1 } } });
    expect(tx.projetoMembro.deleteMany).toHaveBeenCalledWith({ where: { projetoId: projetoRecurso.projetoId, usuarioId: 'membro', origem: 'RECURSO' } });
  });
});
