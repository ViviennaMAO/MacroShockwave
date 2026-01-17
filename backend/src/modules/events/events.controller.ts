import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: '获取即将发布的事件列表' })
  @ApiResponse({ status: 200, description: '成功返回事件列表' })
  async getUpcomingEvents() {
    const events = await this.eventsService.getUpcomingEvents();
    return {
      success: true,
      data: events,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取事件详情' })
  @ApiResponse({ status: 200, description: '成功返回事件详情' })
  @ApiResponse({ status: 404, description: '事件不存在' })
  async getEventDetail(@Param('id') id: string) {
    try {
      const event = await this.eventsService.getEventDetail(id);
      return {
        success: true,
        data: event,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post()
  @ApiOperation({ summary: '创建新事件（管理员）' })
  @ApiResponse({ status: 201, description: '事件创建成功' })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    const event = await this.eventsService.createEvent({
      ...createEventDto,
      releaseTime: new Date(createEventDto.releaseTime),
    });

    return {
      success: true,
      data: event,
    };
  }
}
