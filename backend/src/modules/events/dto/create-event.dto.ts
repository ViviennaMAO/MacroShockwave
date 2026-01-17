import { IsString, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ description: '事件名称', example: 'CPI 2026-02-14' })
  @IsString()
  name: string;

  @ApiProperty({ description: '事件类型', enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    description: '数据发布时间',
    example: '2026-02-14T21:30:00Z',
  })
  @IsDateString()
  releaseTime: string;

  @ApiProperty({ description: '预期值', example: 3.2 })
  @IsNumber()
  consensusValue: number;

  @ApiProperty({ description: '容差', example: 0.1 })
  @IsNumber()
  tolerance: number;
}
