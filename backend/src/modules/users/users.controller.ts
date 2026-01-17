import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clx1234567890',
          address: '0x1234...abcdef',
          username: 'MacroHunter',
          avatar: 'https://example.com/avatar.jpg',
          createdAt: '2026-01-01T00:00:00.000Z',
          stats: {
            totalBets: 50,
            totalWins: 30,
            totalLosses: 20,
            totalAmount: 5000,
            totalWinnings: 8000,
            winRate: 60,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserProfile(
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.usersService.getUserProfile(userId);
    return { success: true, data };
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clx1234567890',
          address: '0x1234...abcdef',
          username: 'MacroHunter',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  async updateUserProfile(
    @Body() data: { username?: string; avatar?: string },
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const result = await this.usersService.updateUserProfile(userId, data);
    return { success: true, data: result };
  }

  @Get('me/stats')
  @ApiOperation({ summary: '获取用户统计数据' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          totalBets: 50,
          totalWins: 30,
          totalLosses: 20,
          totalAmount: 5000,
          totalWinnings: 8000,
          winRate: 60,
          activeOrders: 5,
          profit: 3000,
          roi: 60,
          recentOrders: [
            {
              id: 'clx1234567890',
              eventName: 'CPI 2026-02-14',
              optionName: '鸽派',
              amount: 100,
              winnings: 250,
              status: 'WON',
              createdAt: '2026-01-17T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  async getUserStats(
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.usersService.getUserStats(userId);
    return { success: true, data };
  }

  @Get('me/portfolio')
  @ApiOperation({ summary: '获取用户投资组合' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          totalActiveEvents: 3,
          totalInvested: 500,
          events: [
            {
              eventId: 'clx1234567890',
              eventName: 'CPI 2026-02-14',
              eventType: 'CPI',
              releaseTime: '2026-02-14T13:30:00.000Z',
              status: 'BETTING',
              totalInvested: 200,
              orders: [
                {
                  orderId: 'clx1111111111',
                  gameMode: 'DATA_SNIPER',
                  optionName: '鸽派',
                  amount: 100,
                  currentOdds: 2.5,
                  estimatedWinnings: 250,
                },
              ],
            },
          ],
        },
      },
    },
  })
  async getUserPortfolio(
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.usersService.getUserPortfolio(userId);
    return { success: true, data };
  }

  @Get('me/ranking')
  @ApiOperation({ summary: '获取用户排行榜信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          rank: 15,
          totalWinnings: 8000,
          winRate: 60,
        },
      },
    },
  })
  async getUserRanking(
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.usersService.getUserRanking(userId);
    return { success: true, data };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: '获取排行榜' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '排行榜类型',
    enum: ['winnings', 'winRate'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '返回数量',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: [
          {
            rank: 1,
            userId: 'clx1234567890',
            address: '0x1234...abcdef',
            username: 'MacroKing',
            avatar: 'https://example.com/avatar.jpg',
            totalBets: 100,
            totalWins: 70,
            totalWinnings: 50000,
            winRate: 70,
          },
        ],
      },
    },
  })
  async getLeaderboard(
    @Query('type') type?: 'winnings' | 'winRate',
    @Query('limit') limit?: number,
  ) {
    const data = await this.usersService.getLeaderboard(
      type || 'winnings',
      limit || 100,
    );
    return { success: true, data };
  }
}
