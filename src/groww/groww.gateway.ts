import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  Server,
  Socket,
} from 'socket.io';

import { GrowwService } from './groww.service';

@WebSocketGateway({
  namespace: '/stocks',
  cors: {
    origin: '*',
  },
})
export class GrowwGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly growwService: GrowwService,
  ) {
    this.growwService.addTickListener(
      (ticks) => {
        this.server.emit(
          'stock:tick',
          ticks,
        );
      },
    );
  }

  handleConnection(
    client: Socket,
  ): void {
    console.log(
      `Client connected: ${client.id}`,
    );

    client.emit(
      'stock:snapshot',
      this.growwService
        .getLatestPrices(),
    );
  }

  handleDisconnect(
    client: Socket,
  ): void {
    console.log(
      `Client disconnected: ${client.id}`,
    );
  }

  @SubscribeMessage(
    'stock:subscribe',
  )
  handleSubscribe(
    @MessageBody()
    symbols: string[],
    @ConnectedSocket()
    client: Socket,
  ): void {
    this.growwService.subscribe(
      symbols,
    );

    client.emit(
      'stock:subscription',
      {
        success: true,
        symbols,
      },
    );
  }

  @SubscribeMessage(
    'stock:unsubscribe',
  )
  handleUnsubscribe(
    @MessageBody()
    symbols: string[],
    @ConnectedSocket()
    client: Socket,
  ): void {
    this.growwService.unsubscribe(
      symbols,
    );

    client.emit(
      'stock:unsubscription',
      {
        success: true,
        symbols,
      },
    );
  }
}