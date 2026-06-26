import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardEntry, LeaderboardEntrySchema } from './leaderboard.schema';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaderboardEntry.name, schema: LeaderboardEntrySchema },
    ]),
  ],
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
