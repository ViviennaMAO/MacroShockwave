import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBetDto {
  @ApiProperty({
    description: '事件ID',
    example: 'clx1234567890',
  })
  @IsString()
  eventId: string;

  @ApiProperty({
    description: '选项ID',
    example: 'clx0987654321',
  })
  @IsString()
  optionId: string;

  @ApiProperty({
    description: '下注金额（USDT）',
    example: 100,
    minimum: 10,
    maximum: 10000,
  })
  @IsNumber()
  @Min(10, { message: '最小下注金额为 10 USDT' })
  @Max(10000, { message: '最大下注金额为 10,000 USDT' })
  amount: number;
}
