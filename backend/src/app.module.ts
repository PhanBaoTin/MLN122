import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from './admin/admin.module';
import { ChallengeModule } from './challenge/challenge.module';
import { QuestionModule } from './question/question.module';
import { SessionModule } from './session/session.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { UploadModule } from './upload/upload.module';
import { GatewayModule } from './gateway/gateway.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/sliding-puzzle-game',
    ),
    AdminModule,
    ChallengeModule,
    QuestionModule,
    SessionModule,
    LeaderboardModule,
    UploadModule,
    GatewayModule,
    ChatModule,
  ],
})
export class AppModule {}
