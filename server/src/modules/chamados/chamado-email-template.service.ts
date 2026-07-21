import { ConfigService } from "@nestjs/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type ChamadoEmailTemplateData = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  slaStatus: string;
  criadoEm: Date;
  atualizadoEm: Date;
  primeiraRespostaLimiteEm?: Date | null;
  resolucaoLimiteEm?: Date | null;
  empresa?: { nome?: string | null } | null;
  solicitante: {
    nome?: string | null;
    login?: string | null;
    email?: string | null;
  };
  responsavel?: {
    nome?: string | null;
    login?: string | null;
    email?: string | null;
  } | null;
  liderAtendimento?: {
    nome?: string | null;
    login?: string | null;
    email?: string | null;
  } | null;
  responsavelGrupo?: { nome: string } | null;
  categoria?: { nome: string } | null;
  solucao?: { nome: string } | null;
  funcionalidade?: { titulo: string } | null;
  tipoConfiguracao?: { nome: string; cor?: string | null } | null;
  prioridadeConfiguracao?: { nome: string; cor?: string | null } | null;
};

export type RenderChamadoEmailInput = {
  assunto: string;
  descricaoEvento: string;
  chamado: ChamadoEmailTemplateData;
};

export class ChamadoEmailTemplateService {
  constructor(private readonly config: ConfigService) {}

  async render(
    input: RenderChamadoEmailInput,
  ): Promise<{ html: string; text: string }> {
    const template = await readFile(await this.templatePath(), "utf8");
    const tokens = this.tokens(input);
    const html = template.replace(
      /{{\s*([A-Z0-9_]+)\s*}}/g,
      (_, token: string) => tokens[token] ?? "",
    );

    return {
      html,
      text: this.textVersion(input),
    };
  }

  private async templatePath(): Promise<string> {
    const configured = this.config
      .get<string>("CHAMADO_EMAIL_TEMPLATE_PATH")
      ?.trim();
    if (configured) return resolve(process.cwd(), configured);

    const candidates = [
      resolve(process.cwd(), "email-templates", "chamado.html"),
      resolve(process.cwd(), "server", "email-templates", "chamado.html"),
      resolve(__dirname, "../../../email-templates/chamado.html"),
    ];

    for (const candidate of candidates) {
      try {
        await readFile(candidate, "utf8");
        return candidate;
      } catch {
        // Tenta o proximo caminho compativel com desenvolvimento e producao.
      }
    }

    throw new Error(
      "Template de e-mail do chamado nao encontrado. Configure CHAMADO_EMAIL_TEMPLATE_PATH.",
    );
  }

  private tokens(input: RenderChamadoEmailInput): Record<string, string> {
    const chamado = input.chamado;
    const tipoCor = this.color(chamado.tipoConfiguracao?.cor, "#e8eef5");
    const prioridadeCor = this.color(
      chamado.prioridadeConfiguracao?.cor,
      "#e8eef5",
    );
    const statusCor = this.statusColor(chamado.status);
    const chamadoUrl = this.chamadoUrl(chamado.id);

    return {
      EVENTO_TITULO: this.escape(input.assunto),
      EVENTO_DESCRICAO: this.escape(input.descricaoEvento),
      CHAMADO_ID: this.escape(chamado.id),
      CHAMADO_NUMERO: String(chamado.numero),
      CHAMADO_TITULO: this.escape(chamado.titulo),
      CHAMADO_DESCRICAO: this.escape(chamado.descricao),
      CHAMADO_STATUS: this.escape(this.label(chamado.status)),
      CHAMADO_STATUS_COR: statusCor,
      CHAMADO_STATUS_TEXTO_COR: this.contrastColor(statusCor),
      CHAMADO_URL: this.escape(chamadoUrl),
      EMPRESA_NOME: this.value(chamado.empresa?.nome),
      SOLICITANTE_NOME: this.value(this.userName(chamado.solicitante)),
      SOLICITANTE_EMAIL: this.value(chamado.solicitante.email),
      RESPONSAVEL_NOME: this.value(this.userName(chamado.responsavel)),
      RESPONSAVEL_EMAIL: this.value(chamado.responsavel?.email),
      LIDER_ATENDIMENTO_NOME: this.value(
        this.userName(chamado.liderAtendimento),
      ),
      GRUPO_RESPONSAVEL_NOME: this.value(chamado.responsavelGrupo?.nome),
      CATEGORIA_NOME: this.value(chamado.categoria?.nome),
      SOLUCAO_NOME: this.value(chamado.solucao?.nome),
      FUNCIONALIDADE_NOME: this.value(chamado.funcionalidade?.titulo),
      TIPO_NOME: this.value(chamado.tipoConfiguracao?.nome),
      TIPO_COR: tipoCor,
      TIPO_TEXTO_COR: this.contrastColor(tipoCor),
      PRIORIDADE_NOME: this.value(chamado.prioridadeConfiguracao?.nome),
      PRIORIDADE_COR: prioridadeCor,
      PRIORIDADE_TEXTO_COR: this.contrastColor(prioridadeCor),
      SLA_STATUS: this.escape(this.label(chamado.slaStatus)),
      CRIADO_EM: this.escape(this.date(chamado.criadoEm)),
      ATUALIZADO_EM: this.escape(this.date(chamado.atualizadoEm)),
      PRIMEIRA_RESPOSTA_LIMITE_EM: this.value(
        this.date(chamado.primeiraRespostaLimiteEm),
      ),
      RESOLUCAO_LIMITE_EM: this.value(this.date(chamado.resolucaoLimiteEm)),
    };
  }

  private textVersion(input: RenderChamadoEmailInput): string {
    const chamado = input.chamado;
    return [
      input.assunto,
      input.descricaoEvento,
      "",
      `Chamado #${chamado.numero} - ${chamado.titulo}`,
      chamado.descricao,
      "",
      `Status: ${this.label(chamado.status)}`,
      `Tipo: ${chamado.tipoConfiguracao?.nome || "Nao informado"}`,
      `Prioridade: ${chamado.prioridadeConfiguracao?.nome || "Nao informada"}`,
      `Categoria: ${chamado.categoria?.nome || "Nao informada"}`,
      `Solicitante: ${this.userName(chamado.solicitante) || "Nao informado"}`,
      `Responsavel: ${this.userName(chamado.responsavel) || "Nao informado"}`,
      `Grupo responsavel: ${chamado.responsavelGrupo?.nome || "Nao informado"}`,
      `Solucao: ${chamado.solucao?.nome || "Nao informada"}`,
      `Funcionalidade: ${chamado.funcionalidade?.titulo || "Nao informada"}`,
      `Criado em: ${this.date(chamado.criadoEm)}`,
      `Atualizado em: ${this.date(chamado.atualizadoEm)}`,
      `Primeira resposta limite: ${this.date(chamado.primeiraRespostaLimiteEm) || "Nao informada"}`,
      `Resolucao limite: ${this.date(chamado.resolucaoLimiteEm) || "Nao informada"}`,
      "",
      `Acessar chamado: ${this.chamadoUrl(chamado.id)}`,
    ].join("\n");
  }

  private chamadoUrl(chamadoId: string): string {
    const base = (
      this.config.get<string>("CHAMADO_APP_URL") ||
      "http://localhost:5173/hub/controle-de-chamados/painel-atendimento"
    )
      .trim()
      .replace(/\/$/, "");
    return `${base}/${encodeURIComponent(chamadoId)}`;
  }

  private date(value?: Date | null): string {
    if (!value) return "";
    const timeZone =
      this.config.get<string>("CHAMADO_EMAIL_TIMEZONE") || "America/Sao_Paulo";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone,
      }).format(value);
    } catch {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(value);
    }
  }

  private userName(
    user?: {
      nome?: string | null;
      login?: string | null;
      email?: string | null;
    } | null,
  ): string {
    return user?.nome || user?.login || user?.email || "";
  }

  private value(value?: string | null): string {
    return this.escape(value?.trim() || "Nao informado");
  }

  private label(value: string): string {
    return value
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
  }

  private statusColor(status: string): string {
    return (
      (
        {
          ABERTO: "#2563eb",
          EM_ATENDIMENTO: "#d97706",
          AGUARDANDO_SOLICITANTE: "#7c3aed",
          RESOLVIDO: "#059669",
          ENCERRADO: "#475569",
        } as Record<string, string>
      )[status] || "#475569"
    );
  }

  private color(value: string | null | undefined, fallback: string): string {
    const normalized = value?.trim();
    return normalized && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)
      ? normalized
      : fallback;
  }

  private contrastColor(color: string): string {
    const expanded =
      color.length === 4
        ? color
            .slice(1)
            .split("")
            .map((item) => item + item)
            .join("")
        : color.slice(1);
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 > 155
      ? "#0f2740"
      : "#ffffff";
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
