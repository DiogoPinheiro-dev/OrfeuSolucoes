import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmpresasModule } from '../empresas/empresas.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { UsersModule } from '../users/users.module';
import { AuthCookieService } from './auth-cookie.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthResolver } from './auth.resolver';
import { AuthSessionService } from './auth-session.service';
import { AuthService } from './auth.service';
import { AuthTokenValidationService } from './auth-token-validation.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { RestAuthGuard } from './guards/rest-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const issuer = configService.get<string>('JWT_ISSUER');
        const audience = configService.get<string>('JWT_AUDIENCE');

        if (!secret || !issuer || !audience) {
          throw new Error('JWT_SECRET, JWT_ISSUER and JWT_AUDIENCE are required.');
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get<number>('JWT_EXPIRES_IN') ?? 8 * 60 * 60,
            issuer,
            audience,
            algorithm: 'HS256'
          }
        };
      }
    }),
    UsersModule,
    EmpresasModule,
    SolucoesModule
  ],
  providers: [
    AuthService,
    AuthCookieService,
    AuthCredentialsService,
    AuthRateLimitService,
    AuthSessionService,
    AuthTokenValidationService,
    AuthResolver,
    GqlAuthGuard,
    RestAuthGuard,
    JwtStrategy
  ],
  exports: [AuthService, GqlAuthGuard, RestAuthGuard]
})
export class AuthModule {}
