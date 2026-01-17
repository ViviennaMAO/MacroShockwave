import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 获取或创建用户
   */
  async getOrCreateUser(address: string, username?: string, avatar?: string) {
    let user = await this.prisma.user.findUnique({
      where: { address },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          address,
          username,
          avatar,
        },
      });

      // 创建用户统计记录
      await this.prisma.userStats.create({
        data: {
          userId: user.id,
        },
      });
    }

    return user;
  }

  /**
   * 获取用户信息
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      address: user.address,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: user.stats
        ? {
            totalBets: user.stats.totalBets,
            totalWins: user.stats.totalWins,
            totalLosses: user.stats.totalLosses,
            totalAmount: Number(user.stats.totalAmount),
            totalWinnings: Number(user.stats.totalWinnings),
            winRate: Number(user.stats.winRate),
          }
        : null,
    };
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(
    userId: string,
    data: { username?: string; avatar?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: updatedUser.id,
      address: updatedUser.address,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
    };
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(userId: string) {
    const cacheKey = `user:${userId}:stats`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取用户订单统计
    const [activeOrders, totalProfit, recentOrders] = await Promise.all([
      // 活跃订单数量
      this.prisma.order.count({
        where: {
          userId,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
          },
        },
      }),

      // 总收益（已结算订单的奖金 - 下注金额）
      this.prisma.order.aggregate({
        where: {
          userId,
          status: {
            in: [OrderStatus.WON, OrderStatus.LOST],
          },
        },
        _sum: {
          winnings: true,
          amount: true,
        },
      }),

      // 最近10笔订单
      this.prisma.order.findMany({
        where: { userId },
        include: {
          event: true,
          option: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    const profit =
      Number(totalProfit._sum.winnings || 0) -
      Number(totalProfit._sum.amount || 0);

    const stats = {
      totalBets: user.stats?.totalBets || 0,
      totalWins: user.stats?.totalWins || 0,
      totalLosses: user.stats?.totalLosses || 0,
      totalAmount: Number(user.stats?.totalAmount || 0),
      totalWinnings: Number(user.stats?.totalWinnings || 0),
      winRate: Number(user.stats?.winRate || 0),
      activeOrders,
      profit: Number(profit.toFixed(2)),
      roi:
        Number(user.stats?.totalAmount || 0) > 0
          ? Number(
              ((profit / Number(user.stats.totalAmount)) * 100).toFixed(2),
            )
          : 0,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        eventName: order.event.name,
        optionName: order.option.name,
        amount: Number(order.amount),
        winnings: Number(order.winnings),
        status: order.status,
        createdAt: order.createdAt,
      })),
    };

    // 缓存10秒
    await this.redis.set(cacheKey, JSON.stringify(stats), 10);

    return stats;
  }

  /**
   * 获取用户投资组合
   */
  async getUserPortfolio(userId: string) {
    const cacheKey = `user:${userId}:portfolio`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // 获取用户的活跃订单
    const activeOrders = await this.prisma.order.findMany({
      where: {
        userId,
        status: OrderStatus.CONFIRMED,
      },
      include: {
        event: true,
        option: {
          include: {
            pool: true,
          },
        },
      },
      orderBy: {
        event: {
          releaseTime: 'asc',
        },
      },
    });

    // 按事件分组
    const eventMap = new Map<string, any>();

    activeOrders.forEach((order) => {
      if (!eventMap.has(order.eventId)) {
        eventMap.set(order.eventId, {
          eventId: order.eventId,
          eventName: order.event.name,
          eventType: order.event.type,
          releaseTime: order.event.releaseTime,
          status: order.event.status,
          totalInvested: 0,
          orders: [],
        });
      }

      const event = eventMap.get(order.eventId);
      event.totalInvested += Number(order.amount);

      // 计算当前赔率和预估收益
      const totalPool = Number(order.option.pool.totalAmount) * 0.97;
      const optionTotal = Number(order.option.totalAmount);
      const currentOdds = optionTotal > 0 ? totalPool / optionTotal : 0;
      const estimatedWinnings = Number(order.amount) * currentOdds;

      event.orders.push({
        orderId: order.id,
        gameMode: order.gameMode,
        optionName: order.option.name,
        amount: Number(order.amount),
        currentOdds: Number(currentOdds.toFixed(2)),
        estimatedWinnings: Number(estimatedWinnings.toFixed(2)),
      });
    });

    const portfolio = {
      totalActiveEvents: eventMap.size,
      totalInvested: activeOrders.reduce(
        (sum, order) => sum + Number(order.amount),
        0,
      ),
      events: Array.from(eventMap.values()),
    };

    // 缓存10秒
    await this.redis.set(cacheKey, JSON.stringify(portfolio), 10);

    return portfolio;
  }

  /**
   * 获取用户排行榜信息
   */
  async getUserRanking(userId: string) {
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      return {
        rank: null,
        totalWinnings: 0,
        winRate: 0,
      };
    }

    // 计算用户在总收益排行榜中的排名
    const higherRankCount = await this.prisma.userStats.count({
      where: {
        totalWinnings: {
          gt: userStats.totalWinnings,
        },
      },
    });

    return {
      rank: higherRankCount + 1,
      totalWinnings: Number(userStats.totalWinnings),
      winRate: Number(userStats.winRate),
    };
  }

  /**
   * 获取排行榜（Top 100）
   */
  async getLeaderboard(type: 'winnings' | 'winRate' = 'winnings', limit = 100) {
    const cacheKey = `leaderboard:${type}:${limit}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const orderBy = type === 'winnings' ? 'totalWinnings' : 'winRate';

    const topUsers = await this.prisma.userStats.findMany({
      where: {
        totalBets: {
          gte: 5, // 至少5次下注才进入排行榜
        },
      },
      include: {
        user: {
          select: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        [orderBy]: 'desc',
      },
      take: limit,
    });

    const leaderboard = topUsers.map((stats, index) => ({
      rank: index + 1,
      userId: stats.user.id,
      address: stats.user.address,
      username: stats.user.username,
      avatar: stats.user.avatar,
      totalBets: stats.totalBets,
      totalWins: stats.totalWins,
      totalWinnings: Number(stats.totalWinnings),
      winRate: Number(stats.winRate),
    }));

    // 缓存30秒
    await this.redis.set(cacheKey, JSON.stringify(leaderboard), 30);

    return leaderboard;
  }
}
