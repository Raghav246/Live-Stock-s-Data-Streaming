import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { GrowwAuthService } from './groww-auth.service';

@Controller('auth/groww')
export class GrowwAuthController {
  constructor(
    private readonly authService:
      GrowwAuthService,
  ) {}

  @Get('login')
  async login() {
    try {
      const accessToken =
        await this.authService
          .generateAccessToken();

      return {
        success: true,
        message:
          'Groww access token generated successfully',
        authenticated: true,
        accessTokenGenerated: !!accessToken,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          authenticated: false,
          error:
            error?.message ||
            'Groww authentication failed',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('status')
  status() {
    return {
      authenticated:
        this.authService
          .isAuthenticated(),
    };
  }
}