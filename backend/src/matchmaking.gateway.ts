import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserInfo {
  id: string; // Socket ID or generated ID
  socketId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchmakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private waitingQueue: UserInfo[] = [];
  private activeMatches: Map<string, string> = new Map(); // socketId -> partnerSocketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removeFromQueue(client.id);
    this.handleMatchDisconnect(client.id);
  }

  @SubscribeMessage('find_partner')
  handleFindPartner(
    @ConnectedSocket() client: Socket,
  ) {
    const user: UserInfo = {
      id: client.id,
      socketId: client.id,
    };

    console.log(`User ${user.id} searching for partner.`);

    if (this.waitingQueue.length > 0) {
      const partner = this.waitingQueue.shift()!;
      this.activeMatches.set(client.id, partner.socketId);
      this.activeMatches.set(partner.socketId, client.id);

      // Notify both clients that they are matched
      const roomId = `room_${client.id}_${partner.socketId}`;
      client.join(roomId);
      this.server.sockets.sockets.get(partner.socketId)?.join(roomId);

      this.server.to(roomId).emit('match_found', {
        roomId,
      });
      console.log(`Matched ${user.id} with ${partner.id}`);
    } else {
      this.waitingQueue.push(user);
    }
  }

  @SubscribeMessage('cancel_search')
  handleCancelSearch(@ConnectedSocket() client: Socket) {
    this.removeFromQueue(client.id);
  }

  // WebRTC Signaling
  @SubscribeMessage('webrtc_offer')
  handleWebRTCOffer(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const partnerId = this.activeMatches.get(client.id);
    if (partnerId) {
      this.server.to(partnerId).emit('webrtc_offer', data);
    }
  }

  @SubscribeMessage('webrtc_answer')
  handleWebRTCAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const partnerId = this.activeMatches.get(client.id);
    if (partnerId) {
      this.server.to(partnerId).emit('webrtc_answer', data);
    }
  }

  @SubscribeMessage('webrtc_ice_candidate')
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const partnerId = this.activeMatches.get(client.id);
    if (partnerId) {
      this.server.to(partnerId).emit('webrtc_ice_candidate', data);
    }
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(@ConnectedSocket() client: Socket) {
    this.handleMatchDisconnect(client.id);
  }

  private removeFromQueue(socketId: string) {
    this.waitingQueue = this.waitingQueue.filter((u) => u.socketId !== socketId);
  }

  private handleMatchDisconnect(socketId: string) {
    const partnerId = this.activeMatches.get(socketId);
    if (partnerId) {
      this.server.to(partnerId).emit('partner_left');
      this.activeMatches.delete(partnerId);
      this.activeMatches.delete(socketId);
    }
  }
}
