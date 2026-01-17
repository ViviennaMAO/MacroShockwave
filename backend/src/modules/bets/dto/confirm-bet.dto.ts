import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmBetDto {
  @ApiProperty({
    description: '交易哈希',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: '无效的交易哈希格式',
  })
  txHash: string;
}
