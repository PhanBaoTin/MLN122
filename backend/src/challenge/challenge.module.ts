import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Challenge, ChallengeSchema } from './challenge.schema';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { AdminModule } from '../admin/admin.module';
import { SessionModule } from '../session/session.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Challenge.name, schema: ChallengeSchema }]),
    AdminModule,
    forwardRef(() => SessionModule),
    GatewayModule,
  ],
  providers: [ChallengeService],
  controllers: [ChallengeController],
  exports: [ChallengeService],
})
export class ChallengeModule {}
