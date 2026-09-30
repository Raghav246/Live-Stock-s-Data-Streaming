import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { StockTick } from './groww.types';
import { GrowwAuthService } from './groww-auth.service';

@Injectable()
export class GrowwService
  implements OnModuleInit, OnModuleDestroy
{
constructor(
  private readonly authService:
    GrowwAuthService,
) {}
  private readonly logger =
    new Logger(GrowwService.name);

  private readonly baseUrl =
    'https://api.groww.in/v1';

  private accessToken: string;

  private readonly subscribedSymbols = [
    'NSE_RELIANCE',
    'NSE_TCS',
    'NSE_INFY',
  ];

  private latestPrices =
    new Map<string, StockTick>();

  private tickListeners =
    new Set<(ticks: StockTick[]) => void>();

  private interval?: NodeJS.Timeout;

 async onModuleInit(): Promise<void> {
  const token =
    await this.authService
      .generateAccessToken();

  this.accessToken = token;

  this.logger.log(
    'Groww authentication completed',
  );

  this.startPolling();
}

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private startPolling(): void {
    this.logger.log(
      'Starting Groww live price polling',
    );

    this.fetchPrices();

    this.interval = setInterval(
      () => {
        this.fetchPrices();
      },
      1000,
    );
  }

  private async fetchPrices(): Promise<void> {
    try {
      const url =
        new URL(
          `${this.baseUrl}/live-data/ltp`,
        );

      url.searchParams.set(
        'segment',
        'CASH',
      );

      url.searchParams.set(
        'exchange_symbols',
        this.subscribedSymbols.join(','),
      );

      const response =
        await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Accept:
              'application/json',
            Authorization:
              `Bearer ${this.accessToken}`,
            'X-API-VERSION': '1.0',
          },
        });

      if (!response.ok) {
        const errorText =
          await response.text();

        this.logger.error(
          `Groww API error ${response.status}: ${errorText}`,
        );

        return;
      }

      const data =
        await response.json();

      if (
        data.status !== 'SUCCESS' ||
        !data.payload
      ) {
        this.logger.warn(
          'Groww API returned unsuccessful response',
        );

        return;
      }

      const ticks: StockTick[] = [];

      for (
        const symbol of this.subscribedSymbols
      ) {
        const price =
          data.payload[symbol];

        if (
          typeof price !== 'number'
        ) {
          continue;
        }

        const tradingSymbol =
          symbol.replace(
            'NSE_',
            '',
          );

        const tick: StockTick = {
          exchangeSymbol: symbol,
          tradingSymbol,
          lastPrice: price,
          timestamp:
            new Date().toISOString(),
        };

        this.latestPrices.set(
          symbol,
          tick,
        );

        ticks.push(tick);
      }

      if (ticks.length > 0) {
        this.notifyListeners(ticks);
      }
    } catch (error) {
      this.logger.error(
        'Error fetching Groww prices',
        error,
      );
    }
  }

  private notifyListeners(
    ticks: StockTick[],
  ): void {
    for (
      const listener of this.tickListeners
    ) {
      try {
        listener(ticks);
      } catch (error) {
        this.logger.error(
          'Tick listener error',
          error,
        );
      }
    }
  }

  addTickListener(
    listener: (
      ticks: StockTick[],
    ) => void,
  ): () => void {
    this.tickListeners.add(listener);

    return () => {
      this.tickListeners.delete(
        listener,
      );
    };
  }

  getLatestPrices(): StockTick[] {
    return Array.from(
      this.latestPrices.values(),
    );
  }

  subscribe(
    symbols: string[],
  ): void {
    for (const symbol of symbols) {
      if (
        !this.subscribedSymbols.includes(
          symbol,
        )
      ) {
        this.subscribedSymbols.push(
          symbol,
        );
      }
    }

    this.logger.log(
      `Subscribed symbols: ${symbols.join(', ')}`,
    );
  }

  unsubscribe(
    symbols: string[],
  ): void {
    for (const symbol of symbols) {
      const index =
        this.subscribedSymbols.indexOf(
          symbol,
        );

      if (index !== -1) {
        this.subscribedSymbols.splice(
          index,
          1,
        );

        this.latestPrices.delete(
          symbol,
        );
      }
    }

    this.logger.log(
      `Unsubscribed symbols: ${symbols.join(', ')}`,
    );
  }
}