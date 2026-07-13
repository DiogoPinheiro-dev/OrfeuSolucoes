import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmpresasModule } from '../empresas/empresas.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { UsersModule } from '../users/users.module';
import { AuthCookieService } from './auth-cookie.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthResolver } from './auth.resolver';
import { AuthSessionService } from './auth-session.service';
import { AuthService } from './auth.service';
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

        if (!secret) {
          throw new Error('JWT_SECRET was not provided.');
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get<number>('JWT_EXPIRES_IN') ?? 8 * 60 * 60
          }
        };
      }
    }),
    UsersModule,
    EmpresasModule,
    SolucoesModule
  ],
  providers: [AuthService, AuthCookieService, AuthCredentialsService, AuthSessionService, AuthResolver, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
