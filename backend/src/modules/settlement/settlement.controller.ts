import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';

@ApiTags('settlement')
@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('events/:id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '结算事件（管理员）' })
  @ApiParam({ name: 'id', description: '事件ID' })
  @ApiResponse({
    status: 200,
    description: '结算成功',
    schema: {
      example: {
        success: true,
        message: '事件结算完成',
      },
    },
  })
  @ApiResponse({ status: 400, description: '事件状态不允许结算' })
  @ApiResponse({ status: 404, description: '事件不存在' })
  async settleEvent(@Param('id') eventId: string) {
    await this.settlementService.settleEvent(eventId);
    return {
      success: true,
      message: '事件结算完成',
    };
  }

  @Post('settle-pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量结算待结算事件（定时任务）' })
  @ApiResponse({
    status: 200,
    description: '批量结算完成',
    schema: {
      example: {
        success: true,
        message: '批量结算完成',
      },
    },
  })
  async settlePendingEvents() {
    await this.settlementService.settlePendingEvents();
    return {
      success: true,
      message: '批量结算完成',
    };
  }
}
