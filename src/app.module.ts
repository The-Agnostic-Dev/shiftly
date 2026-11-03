import { Module } from '@nestjs/common';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { HoursModule } from './hours/hours.module';
import { RotaModule } from './rota/rota.module';
import { ShiftsModule } from './shifts/shifts.module';
import { StaffModule } from './staff/staff.module';
import { StoreModule } from './store/store.module';
import { SwapsModule } from './swaps/swaps.module';

@Module({
  imports: [
    StoreModule,
    ActivityModule,
    AuthModule,
    StaffModule,
    AvailabilityModule,
    ShiftsModule,
    RotaModule,
    SwapsModule,
    HoursModule,
  ],
})
export class AppModule {}
