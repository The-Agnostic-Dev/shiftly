import { Global, Module } from '@nestjs/common';
import { RotaEvents } from '../common/rota-events';
import { ActivityService } from './activity.service';

@Global()
@Module({
  providers: [ActivityService, RotaEvents],
  exports: [ActivityService, RotaEvents],
})
export class ActivityModule {}
