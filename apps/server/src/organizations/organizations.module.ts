import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationMembershipGuard } from '../common/guards/organization-membership.guard';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationMembershipGuard],
  exports: [OrganizationMembershipGuard],
})
export class OrganizationsModule {}
