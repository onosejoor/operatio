import type {
  DomainProvider,
  DomainProviderName,
} from '@operatio/domain-providers';

export interface DomainProviderRegistryContract {
  active: DomainProvider;
  get(name: DomainProviderName): DomainProvider | undefined;
}

export const DOMAIN_PROVIDER = Symbol('DOMAIN_PROVIDER');
