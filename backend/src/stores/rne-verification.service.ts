import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class RneVerificationService {
  async verifyRegistrationCode(_code: string): Promise<{ verified: true }> {
    throw new ServiceUnavailableException(
      'La vérification auprès du RNE tunisien n’est pas encore configurée. La création de boutique est temporairement indisponible.',
    );
  }
}
