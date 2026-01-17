import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { EventStatus, GameMode } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  /**
   * 获取即将发布的事件列表
   */
  async getUpcomingEvents() {
    // 先尝试从缓存获取
    const cacheKey = 'events:upcoming';
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // 从数据库查询
    const events = await this.prisma.event.findMany({
      where: {
        releaseTime: { gte: new Date() },
        status: { in: [EventStatus.OPEN, EventStatus.BETTING] },
      },
      orderBy: { releaseTime: 'asc' },
      include: {
        pools: {
          include: {
            options: true,
          },
        },
      },
    });

    // 为每个事件计算实时赔率
    const eventsWithOdds = events.map((event) => ({
      ...event,
      odds: this.calculateOdds(event.pools),
    }));

    // 缓存30秒
    await this.redis.set(
      cacheKey,
      JSON.stringify(eventsWithOdds),
      'EX',
      30
    );

    return eventsWithOdds;
  }

  /**
   * 获取事件详情
   */
  async getEventDetail(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        pools: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // 计算实时赔率
    const odds = this.calculateOdds(event.pools);

    // 计算倒计时
    const now = new Date();
    const countdown = Math.max(
      0,
      Math.floor(
        (event.releaseTime.getTime() - now.getTime()) / 1000
      )
    );

    return {
      ...event,
      odds,
      countdown,
    };
  }

  /**
   * 计算赔率（Pari-mutuel 模式）
   */
  private calculateOdds(pools: any[]): Record<string, Record<string, number>> {
    const oddsMap: Record<string, Record<string, number>> = {};

    pools.forEach((pool) => {
      const totalPool = Number(pool.totalAmount) * 0.97; // 扣除3%手续费
      const gameModeKey = pool.gameMode;

      oddsMap[gameModeKey] = {};

      pool.options.forEach((option) => {
        const optionTotal = Number(option.totalAmount);

        if (optionTotal > 0) {
          // 赔率 = 总奖金池 / 该选项下注总额
          oddsMap[gameModeKey][option.id] = totalPool / optionTotal;
        } else {
          oddsMap[gameModeKey][option.id] = 0;
        }
      });
    });

    return oddsMap;
  }

  /**
   * 创建事件（管理员功能）
   */
  async createEvent(data: {
    name: string;
    type: string;
    releaseTime: Date;
    consensusValue: number;
    tolerance: number;
  }) {
    // 创建事件
    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        type: data.type as any,
        releaseTime: data.releaseTime,
        consensusValue: data.consensusValue,
        tolerance: data.tolerance,
        status: EventStatus.OPEN,
      },
    });

    // 为每个玩法创建奖金池和选项
    await this.createPoolsForEvent(event.id);

    return event;
  }

  /**
   * 为事件创建奖金池
   */
  private async createPoolsForEvent(eventId: string) {
    const gameModes = [
      GameMode.DATA_SNIPER,
      GameMode.VOLATILITY_HUNTER,
      GameMode.JACKPOT,
    ];

    for (const gameMode of gameModes) {
      const pool = await this.prisma.pool.create({
        data: {
          eventId,
          gameMode,
          totalAmount: 0,
        },
      });

      // 根据玩法类型创建选项
      await this.createOptionsForPool(pool.id, gameMode);
    }
  }

  /**
   * 为奖金池创建选项
   */
  private async createOptionsForPool(poolId: string, gameMode: GameMode) {
    if (gameMode === GameMode.DATA_SNIPER) {
      // 数据狙击手：三个选项
      const options = [
        { name: '鸽派', type: 'DOVISH' },
        { name: '中性', type: 'NEUTRAL' },
        { name: '鹰派', type: 'HAWKISH' },
      ];

      for (const option of options) {
        await this.prisma.option.create({
          data: { poolId, ...option },
        });
      }
    } else if (gameMode === GameMode.VOLATILITY_HUNTER) {
      // 波动猎人：两个选项
      const options = [
        { name: '风平浪静', type: 'CALM' },
        { name: '惊涛骇浪', type: 'STORM' },
      ];

      for (const option of options) {
        await this.prisma.option.create({
          data: { poolId, ...option },
        });
      }
    } else if (gameMode === GameMode.JACKPOT) {
      // 精准点位：7个价格区间（动态生成）
      // 这里暂时创建占位符，实际价格区间在下注开放时动态生成
      const options = [
        { name: '区间 1', type: 'RANGE_1' },
        { name: '区间 2', type: 'RANGE_2' },
        { name: '区间 3', type: 'RANGE_3' },
        { name: '区间 4', type: 'RANGE_4' },
        { name: '区间 5', type: 'RANGE_5' },
        { name: '区间 6', type: 'RANGE_6' },
        { name: '区间 7', type: 'RANGE_7' },
      ];

      for (const option of options) {
        await this.prisma.option.create({
          data: { poolId, ...option },
        });
      }
    }
  }

  /**
   * 更新事件状态
   */
  async updateEventStatus(eventId: string, status: EventStatus) {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    // 清除缓存
    await this.redis.deletePattern('events:*');
  }

  /**
   * 检查事件是否可以下注
   */
  async canBet(eventId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return false;

    // 检查状态
    if (event.status !== EventStatus.BETTING) return false;

    // 检查时间（数据发布前5分钟截止）
    const now = new Date();
    const lockTime = new Date(event.releaseTime.getTime() - 5 * 60 * 1000);

    return now < lockTime;
  }
}
