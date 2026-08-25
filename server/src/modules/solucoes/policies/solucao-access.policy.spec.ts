import { canAccessFeature, canAccessSolution } from './solucao-access.policy';

describe('solucao-access.policy', () => {
  it('exige contrato da empresa mesmo para administrador do sistema', () => {
    expect(canAccessSolution({
      solutionSlug: 'projetos',
      systemAdminOnly: false,
      systemAdmin: true,
      fullAccessGroup: true,
      groupHasSolution: true,
      companyHasSolution: false
    })).toBe(false);

    expect(canAccessFeature({
      systemAdminOnly: false,
      systemAdmin: true,
      fullAccessGroup: true,
      groupCanView: true,
      companyHasFeature: false
    })).toBe(false);
  });

  it('permite ao administrador ignorar o grupo quando a empresa possui contrato', () => {
    expect(canAccessSolution({
      solutionSlug: 'controle-de-chamados',
      systemAdminOnly: false,
      systemAdmin: true,
      fullAccessGroup: false,
      groupHasSolution: false,
      companyHasSolution: true
    })).toBe(true);

    expect(canAccessFeature({
      systemAdminOnly: false,
      systemAdmin: true,
      fullAccessGroup: false,
      groupCanView: false,
      companyHasFeature: true
    })).toBe(true);
  });

  it('preserva as excecoes explicitas de Configurador e Documentacao', () => {
    expect(canAccessSolution({
      solutionSlug: 'configurador',
      systemAdminOnly: true,
      systemAdmin: true,
      fullAccessGroup: false,
      groupHasSolution: false,
      companyHasSolution: false
    })).toBe(true);

    expect(canAccessSolution({
      solutionSlug: 'documentacao',
      systemAdminOnly: false,
      systemAdmin: false,
      fullAccessGroup: false,
      groupHasSolution: false,
      companyHasSolution: false
    })).toBe(true);
  });
});
