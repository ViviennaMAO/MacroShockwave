import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { EventStatus, OrderStatus, GameMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 结算事件
   */
  async settleEvent(eventId: string) {
    this.logger.log(`开始结算事件: ${eventId}`);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        pools: {
          include: {
            options: {
              include: {
                orders: {
                  where: {
                    status: OrderStatus.CONFIRMED,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('事件不存在');
    }

    if (event.status !== EventStatus.LOCKED) {
      throw new Error('事件状态不允许结算');
    }

    if (!event.publishedValue) {
      throw new Error('事件缺少公布值，无法结算');
    }

    // 更新事件状态为结算中
    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.SETTLING },
    });

    try {
      // 结算每个玩法的奖金池
      for (const pool of event.pools) {
        await this.settlePool(event, pool);
      }

      // 更新事件状态为已结算
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          status: EventStatus.SETTLED,
          settledAt: new Date(),
        },
      });

      // 清除缓存
      await this.redis.del(`events:list`);
      await this.redis.del(`event:${eventId}`);

      this.logger.log(`事件结算完成: ${eventId}`);
    } catch (error) {
      this.logger.error(`事件结算失败: ${eventId}`, error);
      // 回滚状态
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.LOCKED },
      });
      throw error;
    }
  }

  /**
   * 结算单个奖金池
   */
  private async settlePool(event: any, pool: any) {
    this.logger.log(`结算奖金池: ${pool.id}, 玩法: ${pool.gameMode}`);

    let winningOptions: any[] = [];

    // 根据玩法确定获胜选项
    switch (pool.gameMode) {
      case GameMode.DATA_SNIPER:
        winningOptions = this.getDataSniperWinners(event, pool);
        break;
      case GameMode.VOLATILITY_HUNTER:
        winningOptions = this.getVolatilityHunterWinners(event, pool);
        break;
      case GameMode.JACKPOT:
        winningOptions = this.getJackpotWinners(event, pool);
        break;
    }

    this.logger.log(
      `获胜选项: ${winningOptions.map((o) => o.name).join(', ')}`,
    );

    // 计算总奖金池（扣除3%手续费）
    const totalPool = Number(pool.totalAmount) * 0.97;

    // 计算获胜选项的总下注额
    const winningTotalAmount = winningOptions.reduce(
      (sum, option) => sum + Number(option.totalAmount),
      0,
    );

    if (winningTotalAmount === 0) {
      // 无人中奖，退还所有下注
      await this.refundAllOrders(pool);
      return;
    }

    // 分配奖金给获胜订单
    for (const winningOption of winningOptions) {
      await this.distributeWinnings(
        winningOption,
        totalPool,
        winningTotalAmount,
      );
    }

    // 标记失败订单
    await this.markLosingOrders(pool, winningOptions);
  }

  /**
   * 数据狙击手 - 确定获胜选项
   */
  private getDataSniperWinners(event: any, pool: any): any[] {
    const publishedValue = Number(event.publishedValue);
    const consensusValue = Number(event.consensusValue);
    const tolerance = Number(event.tolerance || 0);

    const diff = publishedValue - consensusValue;

    let winningType: string;

    if (Math.abs(diff) <= tolerance) {
      winningType = 'NEUTRAL'; // 中性
    } else if (diff > 0) {
      winningType = 'HAWKISH'; // 鹰派（数据高于预期）
    } else {
      winningType = 'DOVISH'; // 鸽派（数据低于预期）
    }

    return pool.options.filter((option: any) => option.type === winningType);
  }

  /**
   * 波动猎人 - 确定获胜选项
   * 需要获取BTC价格波动数据
   */
  private getVolatilityHunterWinners(event: any, pool: any): any[] {
    // TODO: 从 PriceHistory 获取BTC价格波动
    // 这里需要计算发布后15分钟的最大波动幅度

    // 临时实现：使用随机值模拟
    const volatilityPercent = 2.5; // 实际应该从价格历史计算

    let winningType: string;

    if (volatilityPercent >= 5) {
      winningType = 'STORM'; // 暴风（≥5%）
    } else if (volatilityPercent >= 2) {
      winningType = 'MODERATE'; // 中等（2-5%）
    } else {
      winningType = 'CALM'; // 风平浪静（<2%）
    }

    return pool.options.filter((option: any) => option.type === winningType);
  }

  /**
   * 精准点位 - 确定获胜选项
   * 需要获取BTC精确价格
   */
  private getJackpotWinners(event: any, pool: any): any[] {
    // TODO: 从 PriceHistory 获取发布后30秒的BTC价格

    // 临时实现：使用随机值模拟
    const btcPrice = 45250; // 实际应该从价格历史获取

    // 选项类型格式: "RANGE_45000_45500" (表示 $45,000-$45,500)
    const winningOptions = pool.options.filter((option: any) => {
      const match = option.type.match(/RANGE_(\d+)_(\d+)/);
      if (match) {
        const [, min, max] = match;
        return btcPrice >= parseInt(min) && btcPrice < parseInt(max);
      }
      return false;
    });

    return winningOptions;
  }

  /**
   * 分配奖金给获胜订单
   */
  private async distributeWinnings(
    winningOption: any,
    totalPool: number,
    winningTotalAmount: number,
  ) {
    const orders = winningOption.orders;

    for (const order of orders) {
      // 计算该订单的奖金
      const orderAmount = Number(order.amount);
      const winnings = (orderAmount / winningTotalAmount) * totalPool;

      // 更新订单状态和奖金
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.WON,
          winnings: new Decimal(winnings),
          settledAt: new Date(),
        },
      });

      // 更新用户统计
      await this.updateUserStatsForWin(order.userId, winnings);

      this.logger.log(
        `订单 ${order.id} 获胜，奖金: ${winnings.toFixed(2)} USDT`,
      );
    }
  }

  /**
   * 标记失败订单
   */
  private async markLosingOrders(pool: any, winningOptions: any[]) {
    const winningOptionIds = winningOptions.map((o) => o.id);

    const losingOrders = pool.options
      .filter((option: any) => !winningOptionIds.includes(option.id))
      .flatMap((option: any) => option.orders);

    for (const order of losingOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.LOST,
          settledAt: new Date(),
        },
      });

      // 更新用户统计
      await this.updateUserStatsForLoss(order.userId);

      this.logger.log(`订单 ${order.id} 失败`);
    }
  }

  /**
   * 退还所有订单（无人中奖）
   */
  private async refundAllOrders(pool: any) {
    this.logger.log(`无人中奖，退还所有下注`);

    const allOrders = pool.options.flatMap((option: any) => option.orders);

    for (const order of allOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REFUNDED,
          winnings: order.amount, // 退还原金额
          settledAt: new Date(),
        },
      });

      this.logger.log(
        `订单 ${order.id} 已退款: ${Number(order.amount).toFixed(2)} USDT`,
      );
    }
  }

  /**
   * 更新用户统计（获胜）
   */
  private async updateUserStatsForWin(userId: string, winnings: number) {
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (userStats) {
      const totalWins = userStats.totalWins + 1;
      const totalBets = userStats.totalBets;
      const totalWinningsAmount = Number(userStats.totalWinnings) + winnings;
      const winRate = (totalWins / totalBets) * 100;

      await this.prisma.userStats.update({
        where: { userId },
        data: {
          totalWins,
          totalWinnings: new Decimal(totalWinningsAmount),
          winRate: new Decimal(winRate),
        },
      });

      // 清除用户缓存
      await this.redis.del(`user:${userId}:stats`);
      await this.redis.del(`user:${userId}:portfolio`);
    }
  }

  /**
   * 更新用户统计（失败）
   */
  private async updateUserStatsForLoss(userId: string) {
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (userStats) {
      const totalLosses = userStats.totalLosses + 1;
      const totalBets = userStats.totalBets;
      const totalWins = userStats.totalWins;
      const winRate = (totalWins / totalBets) * 100;

      await this.prisma.userStats.update({
        where: { userId },
        data: {
          totalLosses,
          winRate: new Decimal(winRate),
        },
      });

      // 清除用户缓存
      await this.redis.del(`user:${userId}:stats`);
      await this.redis.del(`user:${userId}:portfolio`);
    }
  }

  /**
   * 批量结算待结算事件
   */
  async settlePendingEvents() {
    const now = new Date();

    // 查找已锁定且已过发布时间的事件
    const pendingEvents = await this.prisma.event.findMany({
      where: {
        status: EventStatus.LOCKED,
        releaseTime: {
          lte: now,
        },
        publishedValue: {
          not: null,
        },
      },
    });

    this.logger.log(`找到 ${pendingEvents.length} 个待结算事件`);

    for (const event of pendingEvents) {
      try {
        await this.settleEvent(event.id);
      } catch (error) {
        this.logger.error(`结算事件 ${event.id} 失败:`, error);
      }
    }
  }
}
