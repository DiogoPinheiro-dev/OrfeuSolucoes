import { retryBootstrapAfterUniqueConflict } from './bootstrap-concurrency.util';

describe('retryBootstrapAfterUniqueConflict', () => {
  it('repete o bootstrap quando outra execucao vence a criacao unica', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockResolvedValueOnce(undefined);

    await expect(retryBootstrapAfterUniqueConflict(operation)).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('nao repete erros que nao sejam conflito de unicidade', async () => {
    const error = new Error('indisponivel');
    const operation = jest.fn().mockRejectedValue(error);

    await expect(retryBootstrapAfterUniqueConflict(operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
