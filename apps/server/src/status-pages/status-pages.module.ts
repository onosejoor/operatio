import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/database.module';
import { StatusPagesService } from './status-pages.service';
import { StatusPagesController } from './status-pages.controller';

@Module({
  imports: [PrismaModule],
  providers: [StatusPagesService],
  controllers: [StatusPagesController],
})
export class StatusPagesModule {}
