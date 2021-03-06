<script lang="ts">
import FormBase from '@/components/Widget/FormBase';
import { Block } from '@/plugins/spark/state';
import { createBlock } from '@/plugins/spark/store/actions';
import { blockIds, blockValues } from '@/plugins/spark/store/getters';
import { formById } from '@/store/features/getters';
import { serviceValues } from '@/store/services/getters';
import { Service } from '@/store/services/state';
import WizardBase, { NavAction } from '@/components/Widget/WizardBase';
import Component from 'vue-class-component';

@Component
export default class BlockWizard extends WizardBase {
  $q: any;
  currentStep: string = '';
  blockAction: 'create' | 'existing' | null = null;

  widgetId: string = '';
  blockId: string = '';
  service: Service | null = null;
  block: Block | null = null;

  get stepper(): any {
    return this.$refs.stepper;
  }

  get navigation(): { [id: string]: NavAction[] } {
    return {
      start: [
        {
          label: 'Cancel',
          click: () => this.cancel(),
          enabled: () => true,
        },
        {
          label: 'Create new block',
          click: () => {
            this.blockAction = 'create';
            this.blockId = this.widgetId;
            this.stepper.goToStep('create');
          },
          enabled: () => !this.widgetIdError && this.service !== null,
        },
        {
          label: 'Use existing block',
          click: () => {
            this.blockAction = 'existing';
            this.stepper.goToStep('existing');
          },
          enabled: () => !this.widgetIdError && this.service !== null,
        },
      ],
      create: [
        {
          label: 'Back',
          click: () => this.resetStepper(),
          enabled: () => true,
        },
        {
          label: 'Configure block',
          click: () => {
            this.block = this.placeholderBlock();
            this.stepper.goToStep('config');
          },
          enabled: () => !this.blockIdError,
        },
      ],
      existing: [
        {
          label: 'Back',
          click: () => this.resetStepper(),
          enabled: () => true,
        },
        {
          label: 'Configure block',
          click: () => this.stepper.goToStep('config'),
          enabled: () => this.block !== null,
        },
      ],
      config: [
        {
          label: 'Back',
          click: () => this.stepper.previous(),
          enabled: () => true,
        },
        {
          label: 'Finish',
          click: () => this.createWidget(),
          enabled: () => true,
        },
      ],
    };
  }

  get widgetIdError() {
    if (!this.widgetId) {
      return 'Name must not be empty';
    }
    if (this.itemAlreadyExists(this.widgetId)) {
      return 'Name must be unique';
    }
    return null;
  }

  get blockIdError() {
    if (!this.blockId) {
      return 'Name must not be empty';
    }
    const serviceId = this.service ? this.service.id : '';
    if (blockIds(this.$store, serviceId).includes(this.blockId)) {
      return 'Name must be unique';
    }
    return null;
  }

  get serviceOpts() {
    return serviceValues(this.$store)
      .filter(service => service.type === 'Spark')
      .map(service => ({
        label: service.title,
        value: service,
      }));
  }

  get blockOpts() {
    if (this.service) {
      return blockValues(this.$store, this.service.id)
        .filter(block => block.type === this.typeId)
        .map(block => ({
          label: block.id,
          value: block,
        }));
    }
    return [];
  }

  get blockForm() {
    return this.block
      ? formById(this.$store, this.block.type)
      : '';
  }

  get blockFormComponent() {
    return this.$refs.form as FormBase;
  }

  placeholderBlock(): Block {
    return {
      id: this.blockId,
      serviceId: (this.service as Service).id,
      type: this.typeId,
      groups: [0],
      data: null,
    };
  }

  async createWidget() {
    const service = this.service as Service;
    const block = this.block as Block;

    if (!blockIds(this.$store, service.id).includes(block.id)) {
      await createBlock(this.$store, service.id, block);
    }

    this.createItem({
      id: this.widgetId,
      feature: this.typeId,
      config: {
        serviceId: service.id,
        blockId: block.id,
      },
      ...this.defaultWidgetSize,
    });
  }

  async changeBlockId(newId: string) {
    this.blockId = newId;
    await this.$nextTick();
    if (this.blockIdError) {
      this.$q.notify(this.blockIdError);
      return;
    }
    (this.block as Block).id = newId;
  }

  resetStepper() {
    this.stepper.reset();
    this.blockAction = null;
  }

  mounted() {
    this.widgetId = '';
    this.blockId = '';
    this.service = null;
    this.block = null;
    this.resetStepper();

    if (this.serviceOpts.length === 1) {
      this.service = this.serviceOpts[0].value;
    }
  }
}
</script>

<template>
  <q-stepper ref="stepper" v-model="currentStep">
    <!-- start -->
    <q-step default name="start" title="Widget info">
      <q-field label="Widget name" icon="create" orientation="vertical">
        <q-input
          v-model="widgetId"
          :error="widgetIdError !== null"
          :suffix="widgetIdError"
          placeholder="Enter a widget Name"
        />
      </q-field>
      <q-field label="Service" icon="create" orientation="vertical">
        <q-option-group
          v-model="service"
          :options="serviceOpts"
          dark
          type="radio"
          @input="() => block = null"
        />
      </q-field>
    </q-step>
    <!-- create -->
    <q-step v-if="blockAction === 'create'" name="create" title="Create block">
      <q-field label="Block name" icon="create" orientation="vertical">
        <q-input
          v-model="blockId"
          :error="blockIdError !== null"
          :suffix="blockIdError"
          placeholder="Enter a block name"
        />
      </q-field>
    </q-step>
    <!-- select -->
    <q-step v-else-if="blockAction === 'existing'" name="existing" title="Select block">
      <q-field label="Service" icon="create" orientation="vertical">
        <q-option-group v-model="block" :options="blockOpts" dark type="radio"/>
      </q-field>
    </q-step>
    <!-- placeholder -->
    <q-step v-else name="placeholder" title="Create or select block"/>
    <!-- configure -->
    <q-step name="config" title="Configure block">
      <component
        v-if="block"
        ref="form"
        :is="blockForm"
        :type="block.type"
        :field="block"
        :on-change-field="v => block = v"
        :id="widgetId"
        :on-change-id="v => widgetId = v"
        :on-change-block-id="changeBlockId"
        embedded
      />
    </q-step>
    <q-stepper-navigation>
      <q-btn
        v-for="action in navigation[currentStep]"
        :key="action.label"
        :label="action.label"
        :disabled="!action.enabled()"
        flat
        @click="action.click"
      />
    </q-stepper-navigation>
  </q-stepper>
</template>
