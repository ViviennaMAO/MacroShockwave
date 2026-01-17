import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Modules
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { EventsModule } from './modules/events/events.module';
import { BetsModule } from './modules/bets/bets.module';
import { UsersModule } from './modules/users/users.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { OracleModule } from './modules/oracle/oracle.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // Bull 队列模块
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),

    // 公共模块
    PrismaModule,
    RedisModule,

    // 功能模块
    EventsModule,
    BetsModule,
    UsersModule,
    SettlementModule,
    OracleModule,
  ],
})
export class AppModule {}
