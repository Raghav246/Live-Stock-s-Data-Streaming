import { Module } from '@nestjs/common';

import { GrowwService } from './groww.service';
import { GrowwGateway } from './groww.gateway';
import { GrowwAuthService } from './groww-auth.service';
import { GrowwAuthController } from './groww-auth.controller';

@Module({
  controllers:[GrowwAuthController],
  providers: [
    GrowwService,
    GrowwGateway,
    GrowwAuthService,
  ],
  exports: [
    GrowwService,
    GrowwAuthService,
  ],
})
export class GrowwModule {}