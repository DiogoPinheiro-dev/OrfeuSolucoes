import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

type AttemptBucket = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
  lastSeenAt: number;
};

@Injectable()
export class AuthRateLimitService {
  private readonly attempts = new Map<string, AttemptBucket>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockMs: number;
  private readonly maxBuckets: number;
  private readonly registrationMaxAttempts: number;
  private readonly registrationWindowMs: number;

  constructor(configService: ConfigService) {
    this.maxAttempts = configService.get<number>('AUTH_RATE_LIMIT_MAX_ATTEMPTS') ?? 5;
    this.windowMs = (configService.get<number>('AUTH_RATE_LIMIT_WINDOW_SECONDS') ?? 15 * 60) * 1000;
    this.blockMs = (configService.get<number>('AUTH_RATE_LIMIT_BLOCK_SECONDS') ?? 15 * 60) * 1000;
    this.maxBuckets = configService.get<number>('AUTH_RATE_LIMIT_MAX_BUCKETS') ?? 10_000;
    this.registrationMaxAttempts = configService.get<number>('AUTH_REGISTRATION_MAX_ATTEMPTS') ?? 3;
    this.registrationWindowMs =
      (configService.get<number>('AUTH_REGISTRATION_WINDOW_SECONDS') ?? 60 * 60) * 1000;
  }

  assertAllowed(identity: string, clientAddress?: string | null): void {
    const now = Date.now();
    this.pruneExpired(now);

    for (const key of this.keys(identity, clientAddress)) {
      const attempt = this.attempts.get(key);

      if (attempt && attempt.blockedUntil > now) {
        throw new HttpException(
          'Muitas tentativas de autenticacao. Aguarde antes de tentar novamente.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }
  }

  recordFailure(identity: string, clientAddress?: string | null): void {
    const now = Date.now();
    const [identityKey, ipKey] = this.keys(identity, clientAddress);

    this.recordFailureForKey(identityKey, this.maxAttempts, now);
    this.recordFailureForKey(ipKey, this.maxAttempts * 5, now);
  }

  recordSuccess(identity: string, clientAddress?: string | null): void {
    this.attempts.delete(this.identityIpKey(identity, clientAddress));
  }

  consumeRegistrationAttempt(clientAddress?: string | null): void {
    const now = Date.now();
    const key = this.hashKey('registration-ip', clientAddress?.trim() || 'unknown');
    const current = this.attempts.get(key);
    const outsideWindow = !current || now - current.windowStartedAt >= this.registrationWindowMs;

    if (!outsideWindow && current.failures >= this.registrationMaxAttempts) {
      throw new HttpException(
        'Muitas tentativas de cadastro. Aguarde antes de tentar novamente.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (!current) {
      this.ensureCapacity(now);
    }

    this.attempts.set(key, {
      failures: outsideWindow ? 1 : current.failures + 1,
      windowStartedAt: outsideWindow ? now : current.windowStartedAt,
      blockedUntil: 0,
      lastSeenAt: now
    });
  }

  private recordFailureForKey(key: string, maxAttempts: number, now: number): void {
    const current = this.attempts.get(key);
    const outsideWindow = !current || now - current.windowStartedAt >= this.windowMs;
    const failures = outsideWindow ? 1 : current.failures + 1;

    if (!current) {
      this.ensureCapacity(now);
    }

    this.attempts.set(key, {
      failures,
      windowStartedAt: outsideWindow ? now : current.windowStartedAt,
      blockedUntil: failures >= maxAttempts ? now + this.blockMs : 0,
      lastSeenAt: now
    });
  }

  private keys(identity: string, clientAddress?: string | null): [string, string] {
    return [
      this.identityIpKey(identity, clientAddress),
      this.hashKey('ip', this.normalizeClientAddress(clientAddress))
    ];
  }

  private identityIpKey(identity: string, clientAddress?: string | null): string {
    return this.hashKey(
      'identity-ip',
      `${identity.trim().toLowerCase()}\u0000${this.normalizeClientAddress(clientAddress)}`
    );
  }

  private normalizeClientAddress(clientAddress?: string | null): string {
    return clientAddress?.trim() || 'unknown';
  }

  private hashKey(scope: string, value: string): string {
    return `${scope}:${createHash('sha256').update(value).digest('hex')}`;
  }

  private pruneExpired(now: number): void {
    if (this.attempts.size < this.maxBuckets) {
      return;
    }

    const retentionMs = Math.max(this.windowMs, this.blockMs, this.registrationWindowMs);

    for (const [key, attempt] of this.attempts) {
      if (now - attempt.lastSeenAt >= retentionMs && attempt.blockedUntil <= now) {
        this.attempts.delete(key);
      }
    }
  }

  private ensureCapacity(now: number): void {
    this.pruneExpired(now);

    while (this.attempts.size >= this.maxBuckets) {
      const identityEntry = this.oldestEntry('identity-ip:');
      const oldestEntry = identityEntry ?? this.oldestEntry();

      if (!oldestEntry) {
        return;
      }

      this.attempts.delete(oldestEntry[0]);
    }
  }

  private oldestEntry(prefix?: string): [string, AttemptBucket] | undefined {
    let oldest: [string, AttemptBucket] | undefined;

    for (const entry of this.attempts) {
      if (prefix && !entry[0].startsWith(prefix)) {
        continue;
      }

      if (!oldest || entry[1].lastSeenAt < oldest[1].lastSeenAt) {
        oldest = entry;
      }
    }

    return oldest;
  }
}
