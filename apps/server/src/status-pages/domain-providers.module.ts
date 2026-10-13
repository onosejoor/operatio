import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DOMAIN_PROVIDER } from './domain-provider.token';
import { DomainProviderRegistry } from './domain-provider.registry';

@Module({
  imports: [ConfigModule],
  providers: [
    DomainProviderRegistry,
    { provide: DOMAIN_PROVIDER, useExisting: DomainProviderRegistry },
  ],
  exports: [DOMAIN_PROVIDER],
})
export class DomainProvidersModule {}
