import { SetMetadata } from '@nestjs/common';

export const ALLOW_INITIAL_PASSWORD_CHANGE = 'allowInitialPasswordChange';

export const AllowInitialPasswordChange = () =>
  SetMetadata(ALLOW_INITIAL_PASSWORD_CHANGE, true);
