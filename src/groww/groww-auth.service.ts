import {
  Injectable,
  Logger,
} from '@nestjs/common';

import * as crypto from 'crypto';

@Injectable()
export class GrowwAuthService {
  private readonly logger =
    new Logger(GrowwAuthService.name);

  private readonly baseUrl =
    'https://api.groww.in';

  private accessToken: string | null = null;

  async generateAccessToken(): Promise<string> {
    const apiKey =
      process.env.GROWW_API_KEY;

    const apiSecret =
      process.env.GROWW_API_SECRET;

    if (!apiKey) {
      throw new Error(
        'GROWW_API_KEY is missing',
      );
    }

    if (!apiSecret) {
      throw new Error(
        'GROWW_API_SECRET is missing',
      );
    }

    // Current epoch timestamp in seconds
    const timestamp =
      Math.floor(
        Date.now() / 1000,
      ).toString();

    // Groww checksum:
    // SHA256(apiSecret + timestamp)
    const checksum =
      crypto
        .createHash('sha256')
        .update(
          apiSecret + timestamp,
        )
        .digest('hex');

    const response =
      await fetch(
        `${this.baseUrl}/v1/token/api/access`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            key_type: 'approval',
            checksum,
            timestamp,
          }),
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      this.logger.error(
        `Groww authentication failed: ${response.status}`,
      );

      throw new Error(
        data?.message ||
          data?.error ||
          'Groww authentication failed',
      );
    }

    if (
      !data?.token
    ) {
      throw new Error(
        'Groww did not return an access token',
      );
    }

    this.accessToken =
      data.token;

    this.logger.log(
      'Groww access token generated successfully',
    );

    return data.token;
  }

  getAccessToken():
    string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}