import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameSession, GameSessionSchema } from './session.schema';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { ChallengeModule } from '../challenge/challenge.module';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GameSession.name, schema: GameSessionSchema }]),
    ChallengeModule,
    QuestionModule,
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
