import { Module } from '@nestjs/common';
import { ValetGateway } from './valet/valet.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [ValetGateway],
})
export class AppModule {}
