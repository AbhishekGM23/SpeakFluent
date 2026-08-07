"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let MatchmakingGateway = class MatchmakingGateway {
    server;
    waitingQueue = [];
    activeMatches = new Map();
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.removeFromQueue(client.id);
        this.handleMatchDisconnect(client.id);
    }
    handleFindPartner(client) {
        const user = {
            id: client.id,
            socketId: client.id,
        };
        console.log(`User ${user.id} searching for partner.`);
        if (this.waitingQueue.length > 0) {
            const partner = this.waitingQueue.shift();
            this.activeMatches.set(client.id, partner.socketId);
            this.activeMatches.set(partner.socketId, client.id);
            const roomId = `room_${client.id}_${partner.socketId}`;
            client.join(roomId);
            this.server.sockets.sockets.get(partner.socketId)?.join(roomId);
            this.server.to(roomId).emit('match_found', {
                roomId,
            });
            console.log(`Matched ${user.id} with ${partner.id}`);
        }
        else {
            this.waitingQueue.push(user);
        }
    }
    handleCancelSearch(client) {
        this.removeFromQueue(client.id);
    }
    handleWebRTCOffer(client, data) {
        const partnerId = this.activeMatches.get(client.id);
        if (partnerId) {
            this.server.to(partnerId).emit('webrtc_offer', data);
        }
    }
    handleWebRTCAnswer(client, data) {
        const partnerId = this.activeMatches.get(client.id);
        if (partnerId) {
            this.server.to(partnerId).emit('webrtc_answer', data);
        }
    }
    handleIceCandidate(client, data) {
        const partnerId = this.activeMatches.get(client.id);
        if (partnerId) {
            this.server.to(partnerId).emit('webrtc_ice_candidate', data);
        }
    }
    handleLeaveChat(client) {
        this.handleMatchDisconnect(client.id);
    }
    removeFromQueue(socketId) {
        this.waitingQueue = this.waitingQueue.filter((u) => u.socketId !== socketId);
    }
    handleMatchDisconnect(socketId) {
        const partnerId = this.activeMatches.get(socketId);
        if (partnerId) {
            this.server.to(partnerId).emit('partner_left');
            this.activeMatches.delete(partnerId);
            this.activeMatches.delete(socketId);
        }
    }
};
exports.MatchmakingGateway = MatchmakingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchmakingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('find_partner'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleFindPartner", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cancel_search'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleCancelSearch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleWebRTCOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleWebRTCAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_ice_candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleLeaveChat", null);
exports.MatchmakingGateway = MatchmakingGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], MatchmakingGateway);
//# sourceMappingURL=matchmaking.gateway.js.map