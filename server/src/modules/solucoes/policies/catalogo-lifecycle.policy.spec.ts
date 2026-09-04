import { ConflictException } from '@nestjs/common';
import { assertCatalogoRevision, assertCatalogoVersionTransition, mergeCatalogoField, publicationBlocked } from './catalogo-lifecycle.policy';

describe('catalogo lifecycle policy', () => {
  it('aceita publicacao e substituicao previstas no ciclo de vida', () => {
    expect(() => assertCatalogoVersionTransition('RASCUNHO', 'PUBLICADA')).not.toThrow();
    expect(() => assertCatalogoVersionTransition('PUBLICADA', 'SUBSTITUIDA')).not.toThrow();
  });

  it('rejeita transicao e revisao obsoleta', () => {
    expect(() => assertCatalogoVersionTransition('DESCARTADA', 'PUBLICADA')).toThrow(ConflictException);
    expect(() => assertCatalogoRevision(2, 3)).toThrow(ConflictException);
  });

  it('aplica atualizacao do produto somente em campo nao customizado', () => {
    expect(mergeCatalogoField('Padrao antigo', 'Padrao antigo', 'Padrao novo')).toEqual({ value: 'Padrao novo', conflict: false });
    expect(mergeCatalogoField('Padrao antigo', 'Nome customizado', 'Padrao antigo')).toEqual({ value: 'Nome customizado', conflict: false });
    expect(mergeCatalogoField('Padrao antigo', 'Nome customizado', 'Padrao novo')).toEqual({ value: 'Nome customizado', conflict: true });
  });

  it('bloqueia publicacao somente quando ha erro', () => {
    expect(publicationBlocked([{ code: 'INFO', message: 'Aviso', severity: 'WARNING' }])).toBe(false);
    expect(publicationBlocked([{ code: 'INVALID', message: 'Erro', severity: 'ERROR' }])).toBe(true);
  });
});
