import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { PlaceBetDto, ConfirmBetDto } from './dto';
import { OrderStatus } from '@prisma/client';

@ApiTags('bets')
@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建下注订单' })
  @ApiResponse({
    status: 201,
    description: '订单创建成功',
    schema: {
      example: {
        success: true,
        data: {
          orderId: 'clx1234567890',
          eventName: 'CPI 2026-02-14',
          optionName: '鸽派',
          gameMode: 'DATA_SNIPER',
          amount: 100,
          status: 'PENDING',
          createdAt: '2026-01-17T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误或不满足下注条件' })
  @ApiResponse({ status: 404, description: '事件或选项不存在' })
  async placeBet(
    @Body() dto: PlaceBetDto,
    // TODO: 添加 JWT 认证后从 token 获取 userId
    // @User() user: UserPayload,
  ) {
    // 临时使用固定 userId，后续需要从 JWT token 获取
    const userId = 'temp-user-id';
    const data = await this.betsService.placeBet(userId, dto);
    return { success: true, data };
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '确认订单（提交交易哈希）' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({
    status: 200,
    description: '订单确认成功',
    schema: {
      example: {
        success: true,
        data: {
          orderId: 'clx1234567890',
          status: 'CONFIRMED',
          txHash: '0x1234...abcdef',
          confirmedAt: '2026-01-17T10:05:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '订单状态不允许确认或交易验证失败' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async confirmBet(
    @Param('id') orderId: string,
    @Body() dto: ConfirmBetDto,
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.betsService.confirmBet(orderId, userId, dto);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clx1234567890',
          eventId: 'clx0987654321',
          eventName: 'CPI 2026-02-14',
          eventType: 'CPI',
          releaseTime: '2026-02-14T13:30:00.000Z',
          gameMode: 'DATA_SNIPER',
          optionId: 'clx1111111111',
          optionName: '鸽派',
          optionType: 'DOVISH',
          amount: 100,
          currentOdds: 2.5,
          estimatedWinnings: 250,
          actualWinnings: 0,
          status: 'CONFIRMED',
          txHash: '0x1234...abcdef',
          createdAt: '2026-01-17T10:00:00.000Z',
          confirmedAt: '2026-01-17T10:05:00.000Z',
          settledAt: null,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async getOrderDetail(
    @Param('id') orderId: string,
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.betsService.getOrderDetail(orderId, userId);
    return { success: true, data };
  }

  @Get('user/orders')
  @ApiOperation({ summary: '获取用户订单列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '订单状态过滤',
    enum: OrderStatus,
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          orders: [
            {
              id: 'clx1234567890',
              eventName: 'CPI 2026-02-14',
              eventType: 'CPI',
              gameMode: 'DATA_SNIPER',
              optionName: '鸽派',
              amount: 100,
              currentOdds: 2.5,
              winnings: 0,
              status: 'CONFIRMED',
              createdAt: '2026-01-17T10:00:00.000Z',
              settledAt: null,
            },
          ],
          pagination: {
            total: 15,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      },
    },
  })
  async getUserOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.betsService.getUserOrders(
      userId,
      page || 1,
      limit || 20,
      status,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消待确认订单' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({
    status: 200,
    description: '订单取消成功',
    schema: {
      example: {
        success: true,
        data: {
          success: true,
          message: '订单已取消',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '只能取消待确认的订单' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async cancelOrder(
    @Param('id') orderId: string,
    // TODO: 添加 JWT 认证
    // @User() user: UserPayload,
  ) {
    const userId = 'temp-user-id';
    const data = await this.betsService.cancelOrder(orderId, userId);
    return { success: true, data };
  }
}
