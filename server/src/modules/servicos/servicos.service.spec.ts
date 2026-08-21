import { ForbiddenException } from '@nestjs/common';
import { ServicosService } from './servicos.service';

describe('ServicosService authorization', () => {
  function buildService() {
    const catalog = {
      findAll: jest.fn().mockResolvedValue([])
    };
    return {
      catalog,
      service: new ServicosService(catalog as never)
    };
  }

  it('nao permite consultar o catalogo global com usuario comum', () => {
    const { service, catalog } = buildService();

    expect(() => service.findAllAsAdmin({
      sub: 'usuario',
      email: 'usuario@teste.com',
      padraoSistema: false
    })).toThrow(ForbiddenException);
    expect(catalog.findAll).not.toHaveBeenCalled();
  });

  it('permite o catalogo ao administrador inicial', async () => {
    const { service, catalog } = buildService();

    await service.findAllAsAdmin({
      sub: 'admin',
      email: 'admin@teste.com',
      padraoSistema: true
    });
    expect(catalog.findAll).toHaveBeenCalled();
  });
});
