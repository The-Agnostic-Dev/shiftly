import { Global, Module } from '@nestjs/common';
import { OpenShiftsService } from './open-shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';

@Global()
@Module({
  controllers: [ShiftsController],
  providers: [ShiftsService, OpenShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
