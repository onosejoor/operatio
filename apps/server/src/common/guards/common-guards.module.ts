import { Module, Global } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { JwtCookieAuthGuard } from './jwt/jwt-cookie-auth.guard';
import { OrganizationMembershipGuard } from './organization-membership.guard';

@Global()
@Module({
  imports: [AuthModule],
  providers: [JwtCookieAuthGuard, OrganizationMembershipGuard],
  exports: [JwtCookieAuthGuard, OrganizationMembershipGuard, AuthModule],
})
export class CommonGuardsModule {}
