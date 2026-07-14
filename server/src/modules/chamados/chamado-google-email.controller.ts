import { BadRequestException, Controller, Get, Query, Redirect } from '@nestjs/common';
import { ChamadoGoogleEmailService } from './chamado-google-email.service';

@Controller('chamados/google-email')
export class ChamadoGoogleEmailController {
  constructor(private readonly googleEmail: ChamadoGoogleEmailService) {}

  @Get('oauth/callback')
  @Redirect()
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    if (!code || !state) throw new BadRequestException('Retorno OAuth Google incompleto.');
    const url = await this.googleEmail.oauthCallback(code, state);
    return { url };
  }
}