import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthTokenValidationService } from '../auth-token-validation.service';
import { JwtPayload } from './jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly tokenValidation: AuthTokenValidationService
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    const issuer = configService.get<string>('JWT_ISSUER');
    const audience = configService.get<string>('JWT_AUDIENCE');

    if (!secret || !issuer || !audience) {
      throw new Error('JWT_SECRET, JWT_ISSUER and JWT_AUDIENCE are required.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer,
      audience,
      algorithms: ['HS256']
    });
  }

  validate(payload: JwtPayload): Promise<JwtPayload> {
    return this.tokenValidation.validate(payload);
  }
}
