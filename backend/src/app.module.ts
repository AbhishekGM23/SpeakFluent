import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchmakingGateway } from './matchmaking.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, MatchmakingGateway],
})
export class AppModule {}
