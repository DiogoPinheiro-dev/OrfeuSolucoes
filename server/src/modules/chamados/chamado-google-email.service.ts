import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import {
  ChamadoSolucaoEmailType, CreateChamadoSolucaoEmailInput, CreateGoogleEmailContaInput,
  GoogleEmailContaType, GoogleSendAsType, UpdateChamadoSolucaoEmailInput, UpdateGoogleEmailContaInput
} from './dto/chamado-google-email.type';

type OAuthState = { contaId: number; empresaId: number; usuarioId: string; exp: number };
type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };

@Injectable()
export class ChamadoGoogleEmailService {
  private readonly logger = new Logger(ChamadoGoogleEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async contas(user: JwtPayload): Promise<GoogleEmailContaType[]> {
    const empresaId = await this.assertManage(user, 'visualizar');
    const rows = await this.prisma.googleEmailConta.findMany({ where: { empresaId }, orderBy: [{ ativo: 'desc' }, { nome: 'asc' }] });
    return rows.map((row) => this.mapConta(row));
  }

  async createConta(input: CreateGoogleEmailContaInput, user: JwtPayload): Promise<GoogleEmailContaType> {
    const empresaId = await this.assertManage(user, 'incluir');
    const row = await this.prisma.googleEmailConta.create({
      data: {
        empresaId, nome: input.nome.trim(), tipo: input.tipo,
        emailGoogle: input.emailGoogle.trim().toLowerCase(), criadoPorId: user.sub, ativo: input.ativo ?? true
      }
    });
    return this.mapConta(row);
  }

  async updateConta(input: UpdateGoogleEmailContaInput, user: JwtPayload): Promise<GoogleEmailContaType> {
    const empresaId = await this.assertManage(user, 'alterar');
    await this.ensureConta(input.id, empresaId);
    const row = await this.prisma.googleEmailConta.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.emailGoogle !== undefined ? { emailGoogle: input.emailGoogle.trim().toLowerCase(), refreshTokenCriptografado: null, conectadoEm: null } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {})
      }
    });
    return this.mapConta(row);
  }

  async deleteConta(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = await this.assertManage(user, 'excluir');
    await this.ensureConta(id, empresaId);
    await this.prisma.googleEmailConta.update({ where: { id }, data: { ativo: false } });
    return true;
  }

  async authUrl(id: number, user: JwtPayload): Promise<string> {
    const empresaId = await this.assertManage(user, 'alterar');
    await this.ensureConta(id, empresaId);
    const clientId = this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID');
    const redirectUri = this.redirectUri();
    const state = this.signState({ contaId: id, empresaId, usuarioId: user.sub, exp: Date.now() + 10 * 60 * 1000 });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.settings.basic https://www.googleapis.com/auth/gmail.readonly',
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

    const profile = await this.googleJson<{ emailAddress?: string }>('https://gmail.googleapis.com/gmail/v1/users/me/profile', token.access_token);
    if (profile.emailAddress?.toLowerCase() !== conta.emailGoogle.toLowerCase()) {
      throw new BadRequestException('A conta Google autorizada nao corresponde ao email cadastrado.');
    }

    await this.prisma.googleEmailConta.update({
      where: { id: conta.id },
      data: { refreshTokenCriptografado: this.encrypt(token.refresh_token), conectadoEm: new Date(), ativo: true }
    });
    return this.config.get<string>('GOOGLE_OAUTH_SUCCESS_URL') || 'http://localhost:5173/hub/controle-de-chamados/emails-solucoes?google=connected';
  }

  async sendAs(contaId: number, user: JwtPayload): Promise<GoogleSendAsType[]> {
    const empresaId = await this.assertManage(user, 'visualizar');
    const conta = await this.ensureConta(contaId, empresaId);
    const accessToken = await this.accessToken(conta);
    const response = await this.googleJson<{ sendAs?: Array<{ sendAsEmail: string; displayName?: string; isPrimary?: boolean; verificationStatus?: string }> }>(
      'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs', accessToken
    );
    return (response.sendAs || []).map((item) => ({
      email: item.sendAsEmail, nome: item.displayName || null, padrao: !!item.isPrimary,
      verificado: item.verificationStatus === 'accepted'
    }));
  }

  async solucoesEmails(user: JwtPayload): Promise<ChamadoSolucaoEmailType[]> {
    const empresaId = await this.assertManage(user, 'visualizar');
    const rows = await this.prisma.chamadoSolucaoEmail.findMany({
      where: { empresaId }, include: { solucao: true, googleConta: true }, orderBy: { solucao: { nome: 'asc' } }
    });
    return rows.map((row) => this.mapSolucaoEmail(row));
  }

  async createSolucaoEmail(input: CreateChamadoSolucaoEmailInput, user: JwtPayload): Promise<ChamadoSolucaoEmailType> {
    const empresaId = await this.assertManage(user, 'incluir');
    await this.validateSolucaoEmail(empresaId, input.solucaoId, input.googleContaId, input.remetenteEmail);
    const row = await this.prisma.chamadoSolucaoEmail.create({
      data: {
        empresaId, solucaoId: input.solucaoId, googleContaId: input.googleContaId,
        remetenteEmail: input.remetenteEmail.toLowerCase(), remetenteNome: input.remetenteNome?.trim() || null,
        responderParaEmail: input.responderParaEmail?.toLowerCase() || null, ativo: input.ativo ?? true
      },
      include: { solucao: true, googleConta: true }
    });
    return this.mapSolucaoEmail(row);
  }

  async updateSolucaoEmail(input: UpdateChamadoSolucaoEmailInput, user: JwtPayload): Promise<ChamadoSolucaoEmailType> {
    const empresaId = await this.assertManage(user, 'alterar');
    const current = await this.prisma.chamadoSolucaoEmail.findFirst({ where: { id: input.id, empresaId } });
    if (!current) throw new NotFoundException('Configuracao de email da solucao nao encontrada.');
    const solucaoId = input.solucaoId ?? current.solucaoId;
    const googleContaId = input.googleContaId ?? current.googleContaId;
    const remetenteEmail = input.remetenteEmail ?? current.remetenteEmail;
    await this.validateSolucaoEmail(empresaId, solucaoId, googleContaId, remetenteEmail);
    const row = await this.prisma.chamadoSolucaoEmail.update({
      where: { id: input.id },
      data: {
        solucaoId, googleContaId, remetenteEmail: remetenteEmail.toLowerCase(),
        ...(input.remetenteNome !== undefined ? { remetenteNome: input.remetenteNome?.trim() || null } : {}),
        ...(input.responderParaEmail !== undefined ? { responderParaEmail: input.responderParaEmail?.toLowerCase() || null } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {})
      },
      include: { solucao: true, googleConta: true }
    });
    return this.mapSolucaoEmail(row);
  }

  async deleteSolucaoEmail(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = await this.assertManage(user, 'excluir');
    const current = await this.prisma.chamadoSolucaoEmail.findFirst({ where: { id, empresaId } });
    if (!current) throw new NotFoundException('Configuracao de email da solucao nao encontrada.');
    await this.prisma.chamadoSolucaoEmail.update({ where: { id }, data: { ativo: false } });
    return true;
  }

  async sendChamadoUpdate(chamadoId: string, assunto: string, descricao: string): Promise<void> {
    try {
      const chamado = await this.prisma.chamado.findUnique({
        where: { id: chamadoId },
        include: {
          solicitante: true, responsavel: true, liderAtendimento: true, solucao: true,
          acompanhantes: { where: { ativo: true }, include: { usuario: true } },
          responsavelGrupo: { include: { usuarios: { include: { empresas: true } } } }
        }
      });
      if (!chamado?.solucaoId) return;
      const config = await this.prisma.chamadoSolucaoEmail.findFirst({
        where: { empresaId: chamado.empresaId, solucaoId: chamado.solucaoId, ativo: true },
        include: { googleConta: true }
      });
      if (!config?.googleConta.ativo || !config.googleConta.refreshTokenCriptografado) return;

      const emails = new Set<string>([
        chamado.solicitante.email, chamado.responsavel?.email, chamado.liderAtendimento?.email,
        ...chamado.acompanhantes.map((item) => item.usuario.email),
        ...(chamado.responsavelGrupo?.usuarios || [])
          .filter((usuario) => usuario.empresas.some((empresa) => empresa.empresaId === chamado.empresaId))
          .map((usuario) => usuario.email)
      ].filter((email): email is string => !!email).map((email) => email.toLowerCase()));
      if (!emails.size) return;

      const accessToken = await this.accessToken(config.googleConta);
      const raw = this.mimeMessage({
        fromEmail: config.remetenteEmail, fromName: config.remetenteNome || chamado.solucao?.nome || 'Controle de Chamados',
        replyTo: config.responderParaEmail, recipients: [...emails],
        subject: assunto,
        body: descricao + '\n\nChamado #' + chamado.numero + ': ' + chamado.titulo
      });
      await this.googleJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', accessToken, {
        method: 'POST', body: JSON.stringify({ raw })
      });
    } catch (error) {
      this.logger.error('Falha ao enviar email de atualizacao do chamado ' + chamadoId, error instanceof Error ? error.message : String(error));
    }
  }

  private async validateSolucaoEmail(empresaId: number, solucaoId: number, contaId: number, remetente: string): Promise<void> {
    const solucao = await this.prisma.empresaSolucao.findFirst({ where: { empresaId, solucaoId } });
    if (!solucao) throw new BadRequestException('A solucao nao esta vinculada a empresa ativa.');
    const conta = await this.ensureConta(contaId, empresaId);
    if (!conta.refreshTokenCriptografado) throw new BadRequestException('Conecte a conta Google antes de selecionar o remetente.');
    const aliases = await this.sendAsInternal(conta);
    if (!aliases.some((item) => item.email.toLowerCase() === remetente.toLowerCase() && item.verificado)) {
      throw new BadRequestException('O remetente nao esta autorizado ou verificado na conta Google.');
    }
  }

  private async sendAsInternal(conta: { refreshTokenCriptografado: string | null }): Promise<GoogleSendAsType[]> {
    const accessToken = await this.accessToken(conta);
    const response = await this.googleJson<{ sendAs?: Array<{ sendAsEmail: string; displayName?: string; isPrimary?: boolean; verificationStatus?: string }> }>(
      'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs', accessToken
    );
    return (response.sendAs || []).map((item) => ({
      email: item.sendAsEmail, nome: item.displayName || null, padrao: !!item.isPrimary, verificado: item.verificationStatus === 'accepted'
    }));
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
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    });
    const token = await response.json() as TokenResponse;
    if (!response.ok || !token.access_token) throw new BadRequestException(token.error_description || 'Nao foi possivel renovar o acesso a conta Google.');
    return token.access_token;
  }

  private async exchangeCode(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      code, client_id: this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: this.requiredConfig('GOOGLE_OAUTH_CLIENT_SECRET'),
      redirect_uri: this.redirectUri(), grant_type: 'authorization_code'
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    });
    const token = await response.json() as TokenResponse;
    if (!response.ok) throw new BadRequestException(token.error_description || 'Falha ao autorizar a conta Google.');
    return token;
  }

  private async googleJson<T = unknown>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init, headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json', ...(init.headers || {}) }
    });
    const payload = await response.json() as T & { error?: { message?: string } };
    if (!response.ok) throw new BadRequestException(payload.error?.message || 'Erro ao comunicar com a Gmail API.');
    return payload;
  }

  private mimeMessage(input: { fromEmail: string; fromName: string; replyTo?: string | null; recipients: string[]; subject: string; body: string }): string {
    const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
    const lines = [
      'From: ' + clean(input.fromName) + ' <' + clean(input.fromEmail) + '>',
      'To: ' + clean(input.fromEmail),
      'Bcc: ' + input.recipients.map(clean).join(', '),
      ...(input.replyTo ? ['Reply-To: ' + clean(input.replyTo)] : []),
      'Subject: =?UTF-8?B?' + Buffer.from(input.subject).toString('base64') + '?=',
      'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
      Buffer.from(input.body).toString('base64')
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
    return createHash('sha256').update(this.config.get<string>('GOOGLE_TOKEN_ENCRYPTION_KEY') || this.secret()).digest();
  }
  private secret(): string { return this.requiredConfig('JWT_SECRET'); }
  private redirectUri(): string { return this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3001/chamados/google-email/oauth/callback'; }
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
    const conta = await this.prisma.googleEmailConta.findFirst({ where: { id, empresaId } });
    if (!conta) throw new NotFoundException('Conta Google nao encontrada.');
    return conta;
  }
  private mapConta(row: { id: number; nome: string; tipo: string; emailGoogle: string; refreshTokenCriptografado: string | null; conectadoEm: Date | null; ativo: boolean }): GoogleEmailContaType {
    return { id: row.id, nome: row.nome, tipo: row.tipo, emailGoogle: row.emailGoogle, conectado: !!row.refreshTokenCriptografado, conectadoEm: row.conectadoEm, ativo: row.ativo };
  }
  private mapSolucaoEmail(row: { id: number; solucaoId: number; googleContaId: number; remetenteEmail: string; remetenteNome: string | null; responderParaEmail: string | null; ativo: boolean; solucao: { nome: string }; googleConta: { nome: string } }): ChamadoSolucaoEmailType {
    return {
      id: row.id, solucaoId: row.solucaoId, solucaoNome: row.solucao.nome, googleContaId: row.googleContaId,
      googleContaNome: row.googleConta.nome, remetenteEmail: row.remetenteEmail, remetenteNome: row.remetenteNome,
      responderParaEmail: row.responderParaEmail, ativo: row.ativo
    };
  }
}