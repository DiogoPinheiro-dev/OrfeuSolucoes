import { SetMetadata } from '@nestjs/common';

export const ALLOW_PASSWORD_CHANGE_SESSION = 'allowPasswordChangeSession';

export const AllowPasswordChangeSession = () =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_SESSION, true);
