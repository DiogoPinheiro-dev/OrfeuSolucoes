import { ChamadoCategoriaService } from './chamado-categoria.service';
describe('ChamadoCategoriaService', () => {
  it('valida empresa/permissao e registra a alteracao no historico', async () => {
    const chamado={id:'c1',empresaId:4,categoriaId:1,categoria:{nome:'Acesso'}};
    const authorization={assertCompanyContext:jest.fn().mockReturnValue(4),assertFeatureAction:jest.fn().mockResolvedValue(undefined)};
    const query={findChamadoRecordOrThrow:jest.fn().mockResolvedValue(chamado)};
    const configuracao={ensureCategoria:jest.fn().mockResolvedValue({id:2,nome:'Financeiro'})};
    const history={updateChamadoWithHistory:jest.fn().mockResolvedValue(undefined)};
    const service=new ChamadoCategoriaService(authorization as any,query as any,configuracao as any,history as any);
    await expect(service.alterarCategoriaChamado({chamadoId:'c1',categoriaId:2},{sub:'u1',empresaId:4} as any)).resolves.toBe('c1');
    expect(authorization.assertFeatureAction).toHaveBeenCalledWith(expect.anything(),'painel-atendimento','alterar_categoria');
    expect(history.updateChamadoWithHistory).toHaveBeenCalledWith(chamado,expect.anything(),expect.objectContaining({categoriaId:2}),[expect.objectContaining({evento:'ALTERACAO_CATEGORIA',valorAnterior:'Acesso',valorNovo:'Financeiro'})]);
  });
  it('permite remover a categoria', async () => {
    const chamado={id:'c1',empresaId:4,categoriaId:1,categoria:{nome:'Acesso'}}; const history={updateChamadoWithHistory:jest.fn()};
    const service=new ChamadoCategoriaService({assertCompanyContext:()=>4,assertFeatureAction:jest.fn()} as any,{findChamadoRecordOrThrow:jest.fn().mockResolvedValue(chamado)} as any,{ensureCategoria:jest.fn()} as any,history as any);
    await service.alterarCategoriaChamado({chamadoId:'c1',categoriaId:null},{sub:'u1'} as any);
    expect(history.updateChamadoWithHistory).toHaveBeenCalledWith(chamado,expect.anything(),expect.objectContaining({categoriaId:null}),[expect.objectContaining({valorNovo:'Sem categoria'})]);
  });
});