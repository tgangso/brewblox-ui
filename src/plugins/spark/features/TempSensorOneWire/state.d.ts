import { Unit } from '@/helpers/units';
import { Block } from '@/plugins/spark/state';

export interface TempSensorOneWireBlock extends Block {
  data: {
    value: Unit,
    offset: Unit,
    address: string,
  };
}
