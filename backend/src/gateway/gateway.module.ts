import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { ChatModule } from '../chat/chat.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [ChatModule, LeaderboardModule, SessionModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
