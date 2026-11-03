import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

/** In-process notifications about rota changes, keyed by branch id. */
@Injectable()
export class RotaEvents {
  private readonly emitter = new EventEmitter();

  shiftsChanged(branchId: string): void {
    this.emitter.emit('shifts-changed', branchId);
  }

  onShiftsChanged(listener: (branchId: string) => void): void {
    this.emitter.on('shifts-changed', listener);
  }
}
