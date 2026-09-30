import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth/zerodha')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('login')
  login(
    @Res() response: Response,
  ): void {
    const loginUrl =
      this.authService.getLoginUrl();

    response.redirect(loginUrl);
  }

  @Get('callback')
  async callback(
    @Query('request_token')
    requestToken: string,
    @Res() response: Response,
  ): Promise<void> {
    if (!requestToken) {
      throw new BadRequestException(
        'request_token is missing',
      );
    }

    try {
      const result =
        await this.authService.generateAccessToken(
          requestToken,
        );

      response.send(`
        <html>
          <head>
            <title>Zerodha Authentication</title>
          </head>

          <body>
            <h2>Zerodha authentication successful</h2>

            <p>User ID: ${result.userId ?? 'N/A'}</p>

            <p>
              Access token generated successfully.
            </p>

            <p>
              You can close this window.
            </p>
          </body>
        </html>
      `);
    } catch (error) {
      throw new BadRequestException(
        'Zerodha authentication failed',
      );
    }
  }

  @Get('status')
async status() {
  try {
    const profile =
      await this.authService
        .getKiteClient()
        .getProfile();

    return {
      authenticated: true,
      zerodha: 'REST API working',
      userId: profile.user_id,
      userName: profile.user_name,
    };
  } catch (error) {
    return {
      authenticated: false,
      zerodha: 'REST API failed',
      error: error?.message ?? 'Unknown error',
    };
  }
}
}

