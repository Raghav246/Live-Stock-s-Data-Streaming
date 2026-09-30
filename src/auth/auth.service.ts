import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { KiteConnect } from 'kiteconnect';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger =
    new Logger(AuthService.name);

  private kite: any;

  private accessToken: string | null = null;

  constructor() {
    const apiKey =
      process.env.KITE_API_KEY;

    if (!apiKey) {
      throw new Error(
        'KITE_API_KEY is missing',
      );
    }

    this.kite = new KiteConnect({
      api_key: apiKey,
    });
  }

  async onModuleInit(): Promise<void> {
    const accessToken =
      process.env.KITE_ACCESS_TOKEN;

    if (accessToken) {
      this.accessToken =
        accessToken;

      this.kite.setAccessToken(
        accessToken,
      );

      this.logger.log(
        'Zerodha access token loaded from environment',
      );
    } else {
      this.logger.warn(
        'KITE_ACCESS_TOKEN is not configured. Zerodha login is required.',
      );
    }
  }

  getLoginUrl(): string {
    return this.kite.getLoginURL();
  }

  async generateAccessToken(
    requestToken: string,
  ): Promise<{
    accessToken: string;
    userId?: string;
  }> {
    const apiSecret =
      process.env.KITE_API_SECRET;

    if (!apiSecret) {
      throw new Error(
        'KITE_API_SECRET is missing',
      );
    }

    if (!requestToken) {
      throw new Error(
        'request_token is missing',
      );
    }

    const session =
      await this.kite.generateSession(
        requestToken,
        apiSecret,
      );

    this.accessToken =
      session.access_token;

    this.kite.setAccessToken(
      session.access_token,
    );

    this.logger.log(
      `Zerodha authentication successful for user ${session.user_id}`,
    );

    return {
      accessToken:
        session.access_token,
      userId:
        session.user_id,
    };
  }

  getAccessToken():
    string | null {
    return this.accessToken;
  }

  getKiteClient(): any {
    return this.kite;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

