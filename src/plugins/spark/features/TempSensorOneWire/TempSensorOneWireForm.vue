<script lang="ts">
import { Unit } from '@/helpers/units';
import BlockForm from '@/plugins/spark/components/BlockForm';
import Component from 'vue-class-component';

@Component
export default class TempSensorOneWireForm extends BlockForm {
  defaultData() {
    return {
      value: new Unit(null, 'degC'),
      offset: new Unit(0, 'delta_degC'),
      address: '',
    };
  }

  presets() {
    return [];
  }
}
</script>

<template>
  <div class="widget-modal column">
    <BlockWidgetSettings v-if="!$props.embedded" v-bind="$props" :block="block"/>
    <q-collapsible opened group="modal" class="col-12" icon="settings" label="Settings">
      <div>
        <q-field label="Address">
          <InputPopupEdit
            :field="block.data.address"
            :change="callAndSaveBlock(v => block.data.address = v)"
            label="Address"
          />
        </q-field>
        <q-field label="Offset">
          <UnitPopupEdit
            :field="block.data.offset"
            :change="callAndSaveBlock(v => block.data.offset = v)"
            label="Offset"
          />
        </q-field>
      </div>
    </q-collapsible>

    <q-collapsible group="modal" class="col-12" icon="mdi-cube" label="Block Settings">
      <BlockSettings v-bind="$props" :presets-data="presets()"/>
    </q-collapsible>
  </div>
</template>
