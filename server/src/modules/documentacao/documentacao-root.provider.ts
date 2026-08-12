import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOCUMENTACAO_ROOT } from './documentacao.constants';

export const documentacaoRootProvider = {
  provide: DOCUMENTACAO_ROOT,
  useFactory: (): string => {
    const configuredRoot = process.env.DOCUMENTACAO_ROOT?.trim();
    if (configuredRoot) return resolve(configuredRoot);

    const candidates = [
      resolve(process.cwd(), '../docs'),
      resolve(process.cwd(), 'docs'),
      resolve(__dirname, '../../../../docs')
    ];

    return candidates.find((candidate) => existsSync(resolve(candidate, 'generated/documentacao-manifest.json')))
      ?? resolve(process.cwd(), '../docs');
  }
};
