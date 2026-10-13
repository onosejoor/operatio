import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/database.module';
import { StatusPagesService } from './status-pages.service';
import { StatusPagesController } from './status-pages.controller';
import { CustomDomainService } from './custom-domain.service';
import { DomainProvidersModule } from './domain-providers.module';

@Module({
  imports: [PrismaModule, DomainProvidersModule],
  providers: [StatusPagesService, CustomDomainService],
  controllers: [StatusPagesController],
  exports: [CustomDomainService],
})
export class StatusPagesModule {}
