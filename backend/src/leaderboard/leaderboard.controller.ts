import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  async getGlobalLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getGlobalLeaderboard(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':challengeId')
  async getChallengeLeaderboard(
    @Param('challengeId') challengeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getChallengeLeaderboard(
      challengeId,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
