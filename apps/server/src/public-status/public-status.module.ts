import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/database.module';
import { PublicStatusService } from './public-status.service';
import { PublicStatusController } from './public-status.controller';

@Module({
  imports: [PrismaModule],
  providers: [PublicStatusService],
  controllers: [PublicStatusController],
})
export class PublicStatusModule {}
