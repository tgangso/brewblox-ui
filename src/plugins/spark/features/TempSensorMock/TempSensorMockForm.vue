<script lang="ts">
import { Unit } from '@/helpers/units';
import BlockForm from '@/plugins/spark/components/BlockForm';
import Component from 'vue-class-component';

@Component
export default class TempSensorMockForm extends BlockForm {
  defaultData() {
    return {
      value: new Unit(20, 'degC'),
      connected: true,
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
        <q-field label="Value">
          <UnitPopupEdit
            :field="block.data.value"
            :disabled="!block.data.connected"
            :change="callAndSaveBlock(v => block.data.value = v)"
            label="Value"
          />
        </q-field>
        <q-field label="Connected">
          <q-toggle
            :value="block.data.connected"
            @input="v => { block.data.connected = v; saveBlock(); }"
          />
        </q-field>
      </div>
    </q-collapsible>

    <q-collapsible group="modal" class="col-12" icon="mdi-cube" label="Block Settings">
      <BlockSettings v-bind="$props" :presets-data="presets()"/>
    </q-collapsible>
  </div>
</template>
