import { assertProjetoDependenciaSemCiclo } from './projeto-dependencia.policy';

describe('ProjetoDependenciaPolicy', () => {
  it('aceita uma dependencia que nao fecha ciclo', () => {
    expect(() => assertProjetoDependenciaSemCiclo(
      [{ bloqueadorId: 'A', bloqueadoId: 'B' }],
      'B',
      'C'
    )).not.toThrow();
  });

  it('rejeita um ciclo direto', () => {
    expect(() => assertProjetoDependenciaSemCiclo(
      [{ bloqueadorId: 'A', bloqueadoId: 'B' }],
      'B',
      'A'
    )).toThrow('ciclo no cronograma');
  });

  it('rejeita um ciclo transitivo', () => {
    expect(() => assertProjetoDependenciaSemCiclo(
      [
        { bloqueadorId: 'A', bloqueadoId: 'B' },
        { bloqueadorId: 'B', bloqueadoId: 'C' }
      ],
      'C',
      'A'
    )).toThrow('ciclo no cronograma');
  });
});
