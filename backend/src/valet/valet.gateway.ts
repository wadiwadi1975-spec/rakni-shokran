import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ValetGateway {
  @WebSocketServer() server: Server;

  // Student -> Valet + Admin: new request
  @SubscribeMessage('order:create')
  handleCreate(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.server.emit('order:new', data);
    this.server.emit('parking:update', { occupied: data.spot });
    return { ok: true };
  }

  // Valet -> Student + Admin: accept / progress
  @SubscribeMessage('order:update')
  handleUpdate(@MessageBody() data: any) {
    this.server.emit('order:updated', data);
    if (data.status) this.server.emit('parking:update', data);
    return { ok: true };
  }

  // Admin -> Valet: directive
  @SubscribeMessage('admin:directive')
  handleDirective(@MessageBody() data: any) {
    this.server.emit('valet:directive', data);
    return { ok: true };
  }
}
