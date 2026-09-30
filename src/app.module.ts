import { Module } from '@nestjs/common';
import { GrowwModule } from './groww/groww.module';

@Module({
  imports: [
    GrowwModule,
  ],
})
export class AppModule {}