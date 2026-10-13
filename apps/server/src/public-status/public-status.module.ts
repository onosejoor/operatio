import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/database.module';
import { PublicStatusService } from './public-status.service';
import { PublicStatusController } from './public-status.controller';
import { StatusPagesModule } from '../status-pages/status-pages.module';

@Module({
  imports: [PrismaModule, StatusPagesModule],
  providers: [PublicStatusService],
  controllers: [PublicStatusController],
})
export class PublicStatusModule {}
