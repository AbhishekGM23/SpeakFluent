import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class MatchmakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private waitingQueue;
    private activeMatches;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleFindPartner(client: Socket): void;
    handleCancelSearch(client: Socket): void;
    handleWebRTCOffer(client: Socket, data: any): void;
    handleWebRTCAnswer(client: Socket, data: any): void;
    handleIceCandidate(client: Socket, data: any): void;
    handleLeaveChat(client: Socket): void;
    private removeFromQueue;
    private handleMatchDisconnect;
}
