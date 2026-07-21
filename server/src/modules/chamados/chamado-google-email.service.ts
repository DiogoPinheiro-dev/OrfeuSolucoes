import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoEmailTemplateService } from './chamado-email-template.service';
import { FEATURES } from './constants/chamado.constants';
import { CreateGoogleEmailContaInput, GoogleEmailContaType, UpdateGoogleEmailContaInput } from './dto/chamado-google-email.type';

type OAuthState = {
  contaId: number;
  empresaId: number;
  usuarioId: string;
  exp: number;
};
type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

@Injectable()
export class ChamadoGoogleEmailService {
  private readonly logger = new Logger(ChamadoGoogleEmailService.name);
  private readonly emailTemplate: ChamadoEmailTemplateService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly authorization: ChamadoAuthorizationService
  ) {
    this.emailTemplate = new ChamadoEmailTemplateService(config);
  }

  async contas(user: JwtPayload): Promise<GoogleEmailContaType[]> {
    const empresaId = await this.assertManage(user, 'visualizar');
    const rows = await this.prisma.googleEmailConta.findMany({
      where: { empresaId },
      orderBy: [{ principal: 'desc' }, { ativo: 'desc' }, { nome: 'asc' }]
    });
    return rows.map((row) => this.mapConta(row));
  }

  async createConta(input: CreateGoogleEmailContaInput, user: JwtPayload): Promise<GoogleEmailContaType> {
    const empresaId = await this.assertManage(user, 'incluir');
    const ativo = input.ativo ?? true;
    if (input.principal && !ativo) throw new BadRequestException('A conta principal precisa estar ativa.');

    const row = await this.prisma.$transaction(async (transaction) => {
      const principalExistente = await transaction.googleEmailConta.findFirst({
        where: { empresaId, principal: true }
      });
      const principal = ativo && (input.principal === true || !principalExistente);
      if (principal) {
        await transaction.googleEmailConta.updateMany({
          where: { empresaId, principal: true },
          data: { principal: false }
        });
      }
      return transaction.googleEmailConta.create({
        data: {
          empresaId,
          nome: input.nome.trim(),
          tipo: input.tipo,
          emailGoogle: input.emailGoogle.trim().toLowerCase(),
          criadoPorId: user.sub,
          ativo,
          principal
        }
      });
    });
    return this.mapConta(row);
  }

  async updateConta(input: UpdateGoogleEmailContaInput, user: JwtPayload): Promise<GoogleEmailContaType> {
    const empresaId = await this.assertManage(user, 'alterar');
    const current = await this.ensureConta(input.id, empresaId);
    const ativo = input.ativo ?? current.ativo;
    const principal = ativo && (input.principal ?? current.principal);
    if (input.principal && !ativo) throw new BadRequestException('A conta principal precisa estar ativa.');

    const row = await this.prisma.$transaction(async (transaction) => {
      if (principal) {
        await transaction.googleEmailConta.updateMany({
          where: { empresaId, id: { not: input.id }, principal: true },
          data: { principal: false }
        });
      }
      return transaction.googleEmailConta.update({
        where: { id: input.id },
        data: {
          ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
          ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
          ...(input.emailGoogle !== undefined
            ? {
                emailGoogle: input.emailGoogle.trim().toLowerCase(),
                refreshTokenCriptografado: null,
                conectadoEm: null
              }
            : {}),
          ativo,
          principal
        }
      });
    });
    return this.mapConta(row);
  }

  async deleteConta(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = await this.assertManage(user, 'excluir');
    await this.ensureConta(id, empresaId);
    await this.prisma.googleEmailConta.update({
      where: { id },
      data: { ativo: false, principal: false }
    });
    return true;
  }

  async authUrl(id: number, user: JwtPayload): Promise<string> {
    const empresaId = await this.assertManage(user, 'alterar');
    await this.ensureConta(id, empresaId);
    const clientId = this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID');
    const redirectUri = this.redirectUri();
    const state = this.signState({
      contaId: id,
      empresaId,
      usuarioId: user.sub,
      exp: Date.now() + 10 * 60 * 1000
    });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state
    });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  }

  async oauthCallback(code: string, stateValue: string): Promise<string> {
    const state = this.verifyState(stateValue);
    const conta = await this.ensureConta(state.contaId, state.empresaId);
    const token = await this.exchangeCode(code);
    if (!token.access_token || !token.refresh_token) throw new BadRequestException('A Google nao retornou o token de acesso permanente.');

    const profile = await this.googleJson<{ email?: string }>('https://openidconnect.googleapis.com/v1/userinfo', token.access_token);
    if (profile.email?.toLowerCase() !== conta.emailGoogle.toLowerCase()) {
      throw new BadRequestException('A conta Google autorizada nao corresponde ao email cadastrado.');
    }

    await this.prisma.googleEmailConta.update({
      where: { id: conta.id },
      data: {
        refreshTokenCriptografado: this.encrypt(token.refresh_token),
        conectadoEm: new Date(),
        ativo: true
      }
    });
    return this.config.get<string>('GOOGLE_OAUTH_SUCCESS_URL') || 'http://localhost:5173/hub/controle-de-chamados/emails-solucoes?google=connected';
  }

  async sendChamadoUpdate(chamadoId: string, assunto: string, descricao: string): Promise<void> {
    try {
      const chamado = await this.prisma.chamado.findUnique({
        where: { id: chamadoId },
        include: {
          empresa: true,
          solicitante: true,
          responsavel: true,
          liderAtendimento: true,
          categoria: true,
          solucao: true,
          funcionalidade: true,
          tipoConfiguracao: true,
          prioridadeConfiguracao: true,
          acompanhantes: { where: { ativo: true }, include: { usuario: true } },
          responsavelGrupo: {
            include: { usuarios: { include: { empresas: true } } }
          }
        }
      });
      if (!chamado) return;

      const conta = await this.prisma.googleEmailConta.findFirst({
        where: {
          empresaId: chamado.empresaId,
          ativo: true,
          principal: true,
          refreshTokenCriptografado: { not: null }
        },
        orderBy: { id: 'asc' }
      });
      if (!conta) return;

      const candidatos = [
        chamado.solicitante.email,
        chamado.responsavel?.email,
        chamado.liderAtendimento?.email,
        ...chamado.acompanhantes.map((item) => item.usuario.email),
        ...(chamado.responsavelGrupo?.usuarios || []).filter((usuario) => usuario.empresas.some((empresa) => empresa.empresaId === chamado.empresaId)).map((usuario) => usuario.email)
      ];
      const destinatarios = new Set<string>();
      candidatos.forEach((email) => {
        const normalizado = this.normalizeEmail(email);
        if (normalizado) destinatarios.add(normalizado);
      });
      if (!destinatarios.size) return;

      const remetente = this.normalizeEmail(conta.emailGoogle);
      if (!remetente) return;
      const nomeSolicitante = chamado.solicitante.nome || chamado.solicitante.login || chamado.solicitante.email || 'Solicitante';

      const accessToken = await this.accessToken(conta);
      const content = await this.emailTemplate.render({
        assunto,
        descricaoEvento: descricao,
        chamado
      });
      const raw = this.mimeMessage({
        fromEmail: remetente,
        fromName: nomeSolicitante + ' via Controle de Chamados',
        replyTo: this.normalizeEmail(chamado.solicitante.email),
        recipients: [...destinatarios],
        subject: assunto,
        textBody: content.text,
        htmlBody: content.html
      });
      await this.googleJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', accessToken, {
        method: 'POST',
        body: JSON.stringify({ raw })
      });
    } catch (error) {
      this.logger.error('Falha ao enviar email de atualizacao do chamado ' + chamadoId, error instanceof Error ? error.message : String(error));
    }
  }

  private async accessToken(conta: { refreshTokenCriptografado: string | null }): Promise<string> {
    if (!conta.refreshTokenCriptografado) throw new BadRequestException('Conta Google nao conectada.');
    const params = new URLSearchParams({
      client_id: this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: this.requiredConfig('GOOGLE_OAUTH_CLIENT_SECRET'),
      refresh_token: this.decrypt(conta.refreshTokenCriptografado),
      grant_type: 'refresh_token'
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const token = (await response.json()) as TokenResponse;
    if (!response.ok || !token.access_token) throw new BadRequestException(token.error_description || 'Nao foi possivel renovar o acesso a conta Google.');
    return token.access_token;
  }

  private async exchangeCode(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      code,
      client_id: this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: this.requiredConfig('GOOGLE_OAUTH_CLIENT_SECRET'),
      redirect_uri: this.redirectUri(),
      grant_type: 'authorization_code'
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const token = (await response.json()) as TokenResponse;
    if (!response.ok) throw new BadRequestException(token.error_description || 'Falha ao autorizar a conta Google.');
    return token;
  }

  private async googleJson<T = unknown>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
    });
    const payload = (await response.json()) as T & {
      error?: { message?: string };
    };
    if (!response.ok) throw new BadRequestException(payload.error?.message || 'Erro ao comunicar com a Gmail API.');
    return payload;
  }

  private normalizeEmail(value?: string | null): string | null {
    const email = value?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return email;
  }

  private mimeMessage(input: { fromEmail: string; fromName: string; replyTo?: string | null; recipients: string[]; subject: string; textBody: string; htmlBody: string }): string {
    const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
    const boundary = 'orfeu_' + randomBytes(18).toString('hex');
    const encode = (value: string) =>
      Buffer.from(value)
        .toString('base64')
        .match(/.{1,76}/g)
        ?.join('\r\n') || '';
    const lines = [
      'From: ' + clean(input.fromName) + ' <' + clean(input.fromEmail) + '>',
      'To: ' + clean(input.fromEmail),
      'Bcc: ' + input.recipients.map(clean).join(', '),
      ...(input.replyTo ? ['Reply-To: ' + clean(input.replyTo)] : []),
      'Subject: =?UTF-8?B?' + Buffer.from(input.subject).toString('base64') + '?=',
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary=' + boundary,
      '',
      '--' + boundary,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encode(input.textBody),
      '--' + boundary,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encode(input.htmlBody),
      '--' + boundary + '--'
    ];
    return Buffer.from(lines.join('\r\n')).toString('base64url');
  }

  private signState(state: OAuthState): string {
    const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
    const signature = createHmac('sha256', this.secret()).update(payload).digest('base64url');
    return payload + '.' + signature;
  }

  private verifyState(value: string): OAuthState {
    const [payload, signature] = value.split('.');
    if (!payload || !signature) throw new BadRequestException('Estado OAuth invalido.');
    const expected = createHmac('sha256', this.secret()).update(payload).digest();
    const received = Buffer.from(signature, 'base64url');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new BadRequestException('Estado OAuth invalido.');
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthState;
    if (state.exp < Date.now()) throw new BadRequestException('A autorizacao Google expirou. Tente novamente.');
    return state;
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
  }

  private decrypt(value: string): string {
    const parts = value.split('.');
    if (parts.length !== 3 || parts.some((part) => !part)) throw new BadRequestException('Token Google armazenado em formato invalido.');
    const iv = Buffer.from(parts[0]!, 'base64url');
    const tag = Buffer.from(parts[1]!, 'base64url');
    const encrypted = Buffer.from(parts[2]!, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private encryptionKey(): Buffer {
    return createHash('sha256')
      .update(this.config.get<string>('GOOGLE_TOKEN_ENCRYPTION_KEY') || this.secret())
      .digest();
  }
  private secret(): string {
    return this.requiredConfig('JWT_SECRET');
  }
  private redirectUri(): string {
    return this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3001/chamados/google-email/oauth/callback';
  }
  private requiredConfig(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) throw new BadRequestException('Configure a variavel ' + key + ' para usar a integracao Google.');
    return value;
  }
  private async assertManage(user: JwtPayload, action: string): Promise<number> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.emailsSolucoes, action);
    return empresaId;
  }
  private async ensureConta(id: number, empresaId: number) {
    const conta = await this.prisma.googleEmailConta.findFirst({
      where: { id, empresaId }
    });
    if (!conta) throw new NotFoundException('Conta Google nao encontrada.');
    return conta;
  }
  private mapConta(row: { id: number; nome: string; tipo: string; emailGoogle: string; refreshTokenCriptografado: string | null; conectadoEm: Date | null; ativo: boolean; principal: boolean }): GoogleEmailContaType {
    return {
      id: row.id,
      nome: row.nome,
      tipo: row.tipo,
      emailGoogle: row.emailGoogle,
      conectado: !!row.refreshTokenCriptografado,
      conectadoEm: row.conectadoEm,
      ativo: row.ativo,
      principal: row.principal
    };
  }
}
