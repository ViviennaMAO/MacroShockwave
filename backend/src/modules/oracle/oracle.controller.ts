import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OracleService } from './oracle.service';

@ApiTags('oracle')
@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Post('events/:id/fetch-macro')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取宏观数据（管理员）' })
  @ApiParam({ name: 'id', description: '事件ID' })
  @ApiResponse({
    status: 200,
    description: '数据获取成功',
    schema: {
      example: {
        success: true,
        data: {
          value: 3.2,
          timestamp: '2026-01-17T10:00:00.000Z',
        },
      },
    },
  })
  async fetchMacroData(@Param('id') eventId: string) {
    // 需要先查询事件类型
    const event = await this.oracleService['prisma'].event.findUnique({
      where: { id: eventId },
    });

    const value = await this.oracleService.fetchMacroData(
      eventId,
      event.type,
    );

    return {
      success: true,
      data: {
        value,
        timestamp: new Date(),
      },
    };
  }

  @Post('events/:id/fetch-btc-price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取 BTC 价格（管理员）' })
  @ApiParam({ name: 'id', description: '事件ID' })
  @ApiResponse({
    status: 200,
    description: '价格获取成功',
    schema: {
      example: {
        success: true,
        data: {
          price: 45250.5,
          timestamp: '2026-01-17T10:00:00.000Z',
        },
      },
    },
  })
  async fetchBTCPrice(@Param('id') eventId: string) {
    const price = await this.oracleService.fetchBTCPrice(eventId);

    return {
      success: true,
      data: {
        price,
        timestamp: new Date(),
      },
    };
  }

  @Post('events/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证数据一致性（管理员）' })
  @ApiParam({ name: 'id', description: '事件ID' })
  @ApiResponse({
    status: 200,
    description: '验证完成',
    schema: {
      example: {
        success: true,
        data: {
          isConsistent: true,
        },
      },
    },
  })
  async verifyDataConsistency(@Param('id') eventId: string) {
    const isConsistent =
      await this.oracleService.verifyDataConsistency(eventId);

    return {
      success: true,
      data: {
        isConsistent,
      },
    };
  }
}
