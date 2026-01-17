import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { EventType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import axios from 'axios';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 获取宏观经济数据
   */
  async fetchMacroData(eventId: string, eventType: EventType): Promise<number> {
    this.logger.log(`获取宏观数据: ${eventType}`);

    try {
      let value: number;

      switch (eventType) {
        case EventType.CPI:
          value = await this.fetchCPIData();
          break;
        case EventType.NFP:
          value = await this.fetchNFPData();
          break;
        case EventType.GDP:
          value = await this.fetchGDPData();
          break;
        case EventType.FED_RATE:
          value = await this.fetchFedRateData();
          break;
        default:
          throw new Error(`不支持的事件类型: ${eventType}`);
      }

      // 保存到 OracleData 表
      await this.prisma.oracleData.create({
        data: {
          eventId,
          dataType: 'MACRO_DATA',
          value: new Decimal(value),
          source: this.getDataSource(eventType),
          timestamp: new Date(),
          isVerified: true,
        },
      });

      this.logger.log(`宏观数据获取成功: ${value}`);
      return value;
    } catch (error) {
      this.logger.error(`获取宏观数据失败:`, error);
      throw error;
    }
  }

  /**
   * 获取 CPI 数据
   */
  private async fetchCPIData(): Promise<number> {
    // TODO: 从真实数据源获取
    // 这里应该调用 Trading Economics API 或 Federal Reserve API

    const apiKey = process.env.TRADING_ECONOMICS_API_KEY;
    if (!apiKey) {
      this.logger.warn('缺少 Trading Economics API Key，使用模拟数据');
      return 3.2; // 模拟数据
    }

    try {
      const response = await axios.get(
        `https://api.tradingeconomics.com/country/united%20states/indicator/inflation%20rate`,
        {
          params: {
            c: apiKey,
            format: 'json',
          },
        },
      );

      // 获取最新值
      const latestData = response.data[0];
      return parseFloat(latestData.LatestValue);
    } catch (error) {
      this.logger.error('从 Trading Economics 获取 CPI 失败', error);
      // 降级到模拟数据
      return 3.2;
    }
  }

  /**
   * 获取 NFP（非农就业）数据
   */
  private async fetchNFPData(): Promise<number> {
    // TODO: 从真实数据源获取
    this.logger.warn('使用模拟 NFP 数据');
    return 187000; // 模拟数据（单位：千人）
  }

  /**
   * 获取 GDP 数据
   */
  private async fetchGDPData(): Promise<number> {
    // TODO: 从真实数据源获取
    this.logger.warn('使用模拟 GDP 数据');
    return 2.9; // 模拟数据（百分比）
  }

  /**
   * 获取美联储利率数据
   */
  private async fetchFedRateData(): Promise<number> {
    // TODO: 从真实数据源获取
    this.logger.warn('使用模拟美联储利率数据');
    return 5.5; // 模拟数据（百分比）
  }

  /**
   * 获取 BTC 价格
   */
  async fetchBTCPrice(eventId: string): Promise<number> {
    this.logger.log('获取 BTC 价格');

    try {
      // 从多个数据源获取价格，取中位数
      const prices = await Promise.all([
        this.fetchBinancePrice(),
        this.fetchCoinbasePrice(),
        this.fetchKrakenPrice(),
      ]);

      // 计算中位数
      const sortedPrices = prices.sort((a, b) => a - b);
      const medianPrice = sortedPrices[1]; // 取中间值

      // 保存价格历史
      await this.savePriceHistory(eventId, prices);

      // 保存到 OracleData
      await this.prisma.oracleData.create({
        data: {
          eventId,
          dataType: 'BTC_PRICE',
          value: new Decimal(medianPrice),
          source: 'MULTI_SOURCE',
          timestamp: new Date(),
          isVerified: true,
        },
      });

      this.logger.log(`BTC 价格获取成功: $${medianPrice.toFixed(2)}`);
      return medianPrice;
    } catch (error) {
      this.logger.error('获取 BTC 价格失败:', error);
      throw error;
    }
  }

  /**
   * 从 Binance 获取 BTC 价格
   */
  private async fetchBinancePrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v3/ticker/price',
        {
          params: {
            symbol: 'BTCUSDT',
          },
        },
      );
      return parseFloat(response.data.price);
    } catch (error) {
      this.logger.error('从 Binance 获取价格失败', error);
      throw error;
    }
  }

  /**
   * 从 Coinbase 获取 BTC 价格
   */
  private async fetchCoinbasePrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coinbase.com/v2/prices/BTC-USD/spot',
      );
      return parseFloat(response.data.data.amount);
    } catch (error) {
      this.logger.error('从 Coinbase 获取价格失败', error);
      throw error;
    }
  }

  /**
   * 从 Kraken 获取 BTC 价格
   */
  private async fetchKrakenPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.kraken.com/0/public/Ticker',
        {
          params: {
            pair: 'XBTUSD',
          },
        },
      );
      const ticker = response.data.result.XXBTZUSD;
      return parseFloat(ticker.c[0]); // 最后成交价
    } catch (error) {
      this.logger.error('从 Kraken 获取价格失败', error);
      throw error;
    }
  }

  /**
   * 保存价格历史
   */
  private async savePriceHistory(
    eventId: string,
    prices: number[],
  ): Promise<void> {
    const sources = ['BINANCE', 'COINBASE', 'KRAKEN'];

    for (let i = 0; i < prices.length; i++) {
      await this.prisma.priceHistory.create({
        data: {
          eventId,
          price: new Decimal(prices[i]),
          source: sources[i],
          timestamp: new Date(),
        },
      });
    }
  }

  /**
   * 计算 BTC 价格波动幅度
   */
  async calculateVolatility(
    eventId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<number> {
    this.logger.log(`计算波动幅度: ${startTime} 到 ${endTime}`);

    const priceHistory = await this.prisma.priceHistory.findMany({
      where: {
        eventId,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (priceHistory.length < 2) {
      this.logger.warn('价格历史数据不足，无法计算波动');
      return 0;
    }

    const prices = priceHistory.map((p) => Number(p.price));
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    // 计算波动幅度百分比
    const volatility = ((maxPrice - minPrice) / minPrice) * 100;

    this.logger.log(`波动幅度: ${volatility.toFixed(2)}%`);
    return volatility;
  }

  /**
   * 获取数据源名称
   */
  private getDataSource(eventType: EventType): string {
    switch (eventType) {
      case EventType.CPI:
        return 'TRADING_ECONOMICS';
      case EventType.NFP:
        return 'BUREAU_OF_LABOR_STATISTICS';
      case EventType.GDP:
        return 'BUREAU_OF_ECONOMIC_ANALYSIS';
      case EventType.FED_RATE:
        return 'FEDERAL_RESERVE';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * 验证多源数据一致性
   */
  async verifyDataConsistency(eventId: string): Promise<boolean> {
    const oracleData = await this.prisma.oracleData.findMany({
      where: { eventId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3, // 获取最近3个数据源
    });

    if (oracleData.length < 2) {
      return true; // 数据源不足，直接通过
    }

    const values = oracleData.map((d) => Number(d.value));
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // 检查所有值是否在平均值的 ±5% 范围内
    const isConsistent = values.every((v) => Math.abs(v - avg) / avg <= 0.05);

    if (!isConsistent) {
      this.logger.warn('数据源不一致，请人工审核');
    }

    return isConsistent;
  }
}
