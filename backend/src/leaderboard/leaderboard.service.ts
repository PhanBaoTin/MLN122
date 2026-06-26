import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaderboardEntry, LeaderboardEntryDocument } from './leaderboard.schema';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(LeaderboardEntry.name)
    private leaderboardModel: Model<LeaderboardEntryDocument>,
  ) {}

  async upsertEntry(data: {
    challengeId: string;
    playerId: string;
    playerName: string;
    totalScore: number;
    correctAnswers: number;
    puzzleSolved: boolean;
    timeSpent: number;
  }): Promise<LeaderboardEntryDocument> {
    // Upsert per-challenge entry
    const entry = await this.leaderboardModel.findOneAndUpdate(
      { challengeId: data.challengeId, playerId: data.playerId },
      {
        ...data,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true },
    ).exec();

    // Update ranks for this challenge
    await this.updateRanks(data.challengeId);

    // Update global leaderboard
    await this.updateGlobalEntry(data.playerId, data.playerName);

    return entry;
  }

  async getChallengeLeaderboard(
    challengeId: string,
    limit: number = 50,
  ): Promise<LeaderboardEntryDocument[]> {
    return this.leaderboardModel
      .find({ challengeId })
      .sort({ totalScore: -1, timeSpent: 1 })
      .limit(limit)
      .exec();
  }

  async getGlobalLeaderboard(limit: number = 50): Promise<LeaderboardEntryDocument[]> {
    return this.leaderboardModel
      .find({ challengeId: null })
      .sort({ totalScore: -1 })
      .limit(limit)
      .exec();
  }

  private async updateRanks(challengeId: string): Promise<void> {
    const entries = await this.leaderboardModel
      .find({ challengeId })
      .sort({ totalScore: -1, timeSpent: 1 })
      .exec();

    const bulkOps = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { rank: index + 1 },
      },
    }));

    if (bulkOps.length > 0) {
      await this.leaderboardModel.bulkWrite(bulkOps);
    }
  }

  private async updateGlobalEntry(
    playerId: string,
    playerName: string,
  ): Promise<void> {
    // Aggregate all challenge scores for this player
    const result = await this.leaderboardModel.aggregate([
      { $match: { playerId, challengeId: { $ne: null } } },
      {
        $group: {
          _id: '$playerId',
          totalScore: { $sum: '$totalScore' },
          correctAnswers: { $sum: '$correctAnswers' },
          totalTimeSpent: { $sum: '$timeSpent' },
          puzzlesSolved: {
            $sum: { $cond: ['$puzzleSolved', 1, 0] },
          },
        },
      },
    ]);

    if (result.length > 0) {
      await this.leaderboardModel.findOneAndUpdate(
        { challengeId: null, playerId },
        {
          playerName,
          totalScore: result[0].totalScore,
          correctAnswers: result[0].correctAnswers,
          timeSpent: result[0].totalTimeSpent,
          puzzleSolved: result[0].puzzlesSolved > 0,
        },
        { upsert: true, new: true },
      ).exec();

      // Update global ranks
      await this.updateGlobalRanks();
    }
  }

  private async updateGlobalRanks(): Promise<void> {
    const entries = await this.leaderboardModel
      .find({ challengeId: null })
      .sort({ totalScore: -1 })
      .exec();

    const bulkOps = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { rank: index + 1 },
      },
    }));

    if (bulkOps.length > 0) {
      await this.leaderboardModel.bulkWrite(bulkOps);
    }
  }
}
