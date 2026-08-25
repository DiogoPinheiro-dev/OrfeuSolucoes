import { assertRegistroAtivoParaDesativacao } from './chamado-desativacao.util';

describe('assertRegistroAtivoParaDesativacao', () => {
  it('permite desativar um registro ativo', () => {
    expect(() => assertRegistroAtivoParaDesativacao({ ativo: true })).not.toThrow();
  });

  it('rejeita claramente uma segunda desativação', () => {
    expect(() => assertRegistroAtivoParaDesativacao({ ativo: false }))
      .toThrow('Este registro já está inativo.');
  });
});
