import { ForbiddenException } from '@nestjs/common';
import { ServicosService } from './servicos.service';

describe('ServicosService', () => {
  const admin = { sub: 'admin', padraoSistema: true } as never;
  const input = { id: 1 } as never;
  const result = { id: 1 };
  const catalog = { create: jest.fn(), findAll: jest.fn(), update: jest.fn(), remove: jest.fn() };
  const service = new ServicosService(catalog as never);
  beforeEach(() => { jest.clearAllMocks(); Object.values(catalog).forEach((mock) => mock.mockReturnValue(result)); });

  it.each([
    ['create', 'create', [input]], ['findAll', 'findAll', []], ['update', 'update', [input]], ['remove', 'remove', [1]]
  ] as const)('delega %s ao catálogo', (method, target, args) => {
    expect((service[method] as never as (...values: unknown[]) => unknown)(...args)).toBe(result);
    expect(catalog[target]).toHaveBeenCalledWith(...args);
  });

  it.each([
    ['createAsAdmin', 'create', [input]], ['findAllAsAdmin', 'findAll', []],
    ['updateAsAdmin', 'update', [input]], ['removeAsAdmin', 'remove', [1]]
  ] as const)('autoriza o administrador antes de %s', (method, target, args) => {
    expect((service[method] as never as (...values: unknown[]) => unknown)(...args, admin)).toBe(result);
    expect(catalog[target]).toHaveBeenCalledWith(...args);
    expect(() => (service[method] as never as (...values: unknown[]) => unknown)(...args, { padraoSistema: false }))
      .toThrow(ForbiddenException);
  });
});
