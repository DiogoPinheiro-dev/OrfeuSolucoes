import { resolveDefaultSolutions } from './user.mapper';

describe('resolveDefaultSolutions', () => {
  it('preserva a flag legada acessoHoras sem anunciar a solução aposentada', () => {
    const solutions = resolveDefaultSolutions({
      id: 'usuario-1',
      nome: 'Usuário',
      email: 'usuario@orfeu.test',
      grupo: {
        id: 2,
        nome: 'Operação',
        acessoEcommerce: false,
        acessoProjetos: true,
        acessoHoras: true,
        acessoConfigurador: false
      }
    } as never);

    expect(solutions).toEqual(['projetos']);
  });

  it('não devolve horas nem para um grupo com acesso legado total', () => {
    const solutions = resolveDefaultSolutions({
      id: 'usuario-2',
      nome: 'Administrador',
      email: 'admin@orfeu.test',
      padraoSistema: true,
      grupo: {
        id: 1,
        nome: 'Administradores',
        acessoEcommerce: true,
        acessoProjetos: true,
        acessoHoras: true,
        acessoConfigurador: true
      }
    } as never);

    expect(solutions).toEqual(['ecommerce', 'projetos', 'configurador']);
  });
});
