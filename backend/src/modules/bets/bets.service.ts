import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { PlaceBetDto, ConfirmBetDto } from './dto';
import { EventStatus, OrderStatus, GameMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 创建下注订单
   */
  async placeBet(userId: string, dto: PlaceBetDto) {
    const { eventId, optionId, amount } = dto;

    // 1. 验证事件存在且可以下注
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
      throw new NotFoundException('事件不存在');
    }

    // 2. 检查事件状态
    if (event.status !== EventStatus.BETTING) {
      throw new BadRequestException('该事件当前不接受下注');
    }

    // 3. 检查是否在下注时间窗口内（发布前5分钟锁定）
    const now = new Date();
    const lockTime = new Date(event.releaseTime.getTime() - 5 * 60 * 1000);
    if (now >= lockTime) {
      throw new BadRequestException('下注已截止');
    }

    // 4. 验证选项存在
    const option = await this.prisma.option.findUnique({
      where: { id: optionId },
      include: { pool: true },
    });

    if (!option) {
      throw new NotFoundException('选项不存在');
    }

    if (option.pool.eventId !== eventId) {
      throw new BadRequestException('选项不属于该事件');
    }

    // 5. 检查用户在该事件的总下注额限制（50,000 USDT）
    const userTotalBets = await this.prisma.order.aggregate({
      where: {
        userId,
        eventId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
        },
      },
      _sum: {
        amount: true,
      },
    });

    const currentTotal = Number(userTotalBets._sum.amount || 0);
    if (currentTotal + amount > 50000) {
      throw new BadRequestException(
        `超过单事件下注限额（50,000 USDT），当前已下注 ${currentTotal} USDT`,
      );
    }

    // 6. 创建订单
    const order = await this.prisma.order.create({
      data: {
        userId,
        eventId,
        optionId,
        gameMode: option.pool.gameMode,
        amount: new Decimal(amount),
        status: OrderStatus.PENDING,
      },
      include: {
        event: true,
        option: {
          include: {
            pool: true,
          },
        },
      },
    });

    // 7. 清除相关缓存
    await this.redis.del(`events:list`);
    await this.redis.del(`event:${eventId}`);

    return {
      orderId: order.id,
      eventName: order.event.name,
      optionName: order.option.name,
      gameMode: order.gameMode,
      amount: Number(order.amount),
      status: order.status,
      createdAt: order.createdAt,
    };
  }

  /**
   * 确认订单（提交交易哈希）
   */
  async confirmBet(orderId: string, userId: string, dto: ConfirmBetDto) {
    const { txHash } = dto;

    // 1. 查找订单
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        option: {
          include: {
            pool: true,
          },
        },
        event: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 2. 验证订单所有权
    if (order.userId !== userId) {
      throw new BadRequestException('无权操作该订单');
    }

    // 3. 验证订单状态
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许确认');
    }

    // 4. 检查交易哈希是否已被使用
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        txHash,
        status: OrderStatus.CONFIRMED,
      },
    });

    if (existingOrder) {
      throw new BadRequestException('该交易哈希已被使用');
    }

    // 5. TODO: 验证链上交易（这里需要调用区块链服务验证）
    // const isValid = await this.blockchainService.verifyTransaction(txHash, order.amount);
    // if (!isValid) {
    //   throw new BadRequestException('交易验证失败');
    // }

    // 6. 使用事务更新订单和奖金池
    const result = await this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          txHash,
          confirmedAt: new Date(),
        },
      });

      // 更新选项总下注额
      await tx.option.update({
        where: { id: order.optionId },
        data: {
          totalAmount: {
            increment: order.amount,
          },
        },
      });

      // 更新奖金池总额
      await tx.pool.update({
        where: { id: order.option.poolId },
        data: {
          totalAmount: {
            increment: order.amount,
          },
        },
      });

      // 更新用户统计
      const userStats = await tx.userStats.findUnique({
        where: { userId },
      });

      if (userStats) {
        await tx.userStats.update({
          where: { userId },
          data: {
            totalBets: { increment: 1 },
            totalAmount: { increment: order.amount },
          },
        });
      } else {
        await tx.userStats.create({
          data: {
            userId,
            totalBets: 1,
            totalAmount: order.amount,
          },
        });
      }

      return updatedOrder;
    });

    // 7. 清除缓存
    await this.redis.del(`events:list`);
    await this.redis.del(`event:${order.eventId}`);
    await this.redis.del(`user:${userId}:orders`);

    // 8. TODO: 发送 WebSocket 更新通知
    // await this.wsGateway.notifyOddsUpdate(order.eventId);

    return {
      orderId: result.id,
      status: result.status,
      txHash: result.txHash,
      confirmedAt: result.confirmedAt,
    };
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        option: {
          include: {
            pool: true,
          },
        },
        user: {
          select: {
            id: true,
            address: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 验证所有权（管理员可以查看所有订单）
    if (order.userId !== userId) {
      throw new BadRequestException('无权查看该订单');
    }

    // 计算当前赔率
    const totalPool = Number(order.option.pool.totalAmount) * 0.97;
    const optionTotal = Number(order.option.totalAmount);
    const currentOdds = optionTotal > 0 ? totalPool / optionTotal : 0;

    // 计算预估收益
    const estimatedWinnings =
      order.status === OrderStatus.CONFIRMED
        ? Number(order.amount) * currentOdds
        : 0;

    return {
      id: order.id,
      eventId: order.eventId,
      eventName: order.event.name,
      eventType: order.event.type,
      releaseTime: order.event.releaseTime,
      gameMode: order.gameMode,
      optionId: order.optionId,
      optionName: order.option.name,
      optionType: order.option.type,
      amount: Number(order.amount),
      currentOdds: Number(currentOdds.toFixed(2)),
      estimatedWinnings: Number(estimatedWinnings.toFixed(2)),
      actualWinnings: Number(order.winnings),
      status: order.status,
      txHash: order.txHash,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      settledAt: order.settledAt,
      user: order.user,
    };
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          event: true,
          option: {
            include: {
              pool: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const ordersWithOdds = orders.map((order) => {
      const totalPool = Number(order.option.pool.totalAmount) * 0.97;
      const optionTotal = Number(order.option.totalAmount);
      const currentOdds = optionTotal > 0 ? totalPool / optionTotal : 0;

      return {
        id: order.id,
        eventId: order.eventId,
        eventName: order.event.name,
        eventType: order.event.type,
        releaseTime: order.event.releaseTime,
        gameMode: order.gameMode,
        optionName: order.option.name,
        amount: Number(order.amount),
        currentOdds: Number(currentOdds.toFixed(2)),
        winnings: Number(order.winnings),
        status: order.status,
        createdAt: order.createdAt,
        settledAt: order.settledAt,
      };
    });

    return {
      orders: ordersWithOdds,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 取消待确认订单
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('无权操作该订单');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只能取消待确认的订单');
    }

    // 删除订单
    await this.prisma.order.delete({
      where: { id: orderId },
    });

    return {
      success: true,
      message: '订单已取消',
    };
  }
}
