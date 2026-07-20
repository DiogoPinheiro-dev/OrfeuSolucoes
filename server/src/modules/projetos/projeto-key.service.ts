import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjetoKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async sugerir(nome: string, empresaId: number): Promise<string> {
    const base = this.buildBase(nome);
    let candidate = base;
    let suffix = 2;

    while (await this.exists(empresaId, candidate)) {
      const suffixText = String(suffix++);
      candidate = `${base.slice(0, 10 - suffixText.length)}${suffixText}`;
    }

    return candidate;
  }

  buildBase(nome: string): string {
    const normalized = (nome ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim();
    const words = normalized.split(/\s+/).filter(Boolean);

    if (!words.length) {
      return 'PRJ';
    }

    const compact = words.join('');
    const initials = words.length > 1 ? words.map((word) => word[0]).join('') : compact;
    let base = (initials.length >= 2 ? initials : compact).slice(0, 10);

    if (!/^[A-Z]/.test(base)) {
      base = `P${base}`.slice(0, 10);
    }

    return base.length >= 2 ? base : `${base}P`.slice(0, 10);
  }

  private async exists(empresaId: number, chave: string): Promise<boolean> {
    return !!await this.prisma.projeto.findUnique({
      where: { empresaId_chave: { empresaId, chave } },
      select: { id: true }
    });
  }
}
