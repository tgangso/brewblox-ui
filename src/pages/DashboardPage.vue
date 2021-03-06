<script lang="ts">
import { objectSorter } from '@/helpers/functional';
import {
  createDashboardItem,
  removeDashboardItem,
  saveDashboard,
  saveDashboardItem,
  updateDashboardItemConfig,
  updateDashboardItemId,
  updateDashboardItemOrder,
  updateDashboardItemSize,
  appendDashboardItem,
} from '@/store/dashboards/actions';
import {
  allDashboards,
  dashboardById,
  dashboardItemsByDashboardId,
  itemCopyName,
  dashboardItemValues,
} from '@/store/dashboards/getters';
import { DashboardItem } from '@/store/dashboards/state';
import {
  deletersById,
  displayNameById,
  validatorById,
  widgetById,
  widgetSizeById,
} from '@/store/features/getters';
import { Notify } from 'quasar';
import shortid from 'shortid';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';

interface VueOrdered extends Vue {
  id: string;
}

interface ValidatedItem {
  item: DashboardItem;
  component: string;
  error?: Error;
}

@Component
export default class DashboardPage extends Vue {
  $q: any;
  widgetEditable: boolean = false;
  menuModalOpen: boolean = false;
  wizardModalOpen: boolean = false;

  get dashboardId(): string {
    return this.$route.params.id;
  }

  @Watch('dashboardId')
  onChangeDashboard() {
    this.widgetEditable = false;
    this.widgetEditable = false;
  }

  get dashboard() {
    return dashboardById(this.$store, this.dashboardId);
  }

  get allDashboards() {
    return allDashboards(this.$store);
  }

  get allItems() {
    return dashboardItemValues(this.$store);
  }

  get items() {
    return dashboardItemsByDashboardId(this.$store, this.dashboardId)
      .sort(objectSorter('order'));
  }

  get validatedItems(): ValidatedItem[] {
    return this.items
      .map((item) => {
        try {
          const component = widgetById(this.$store, item.feature, item.config);
          if (!component) {
            throw new Error(`No widget found for ${item.feature}`);
          }
          const validator = validatorById(this.$store, item.feature);
          if (!validator(this.$store, item.config)) {
            throw new Error(`${item.feature} validation failed`);
          }
          return {
            item,
            component,
          };
        } catch (e) {
          return {
            item,
            component: 'InvalidWidget',
            error: e.toString(),
          };
        }
      });
  }

  onChangeDashboardTitle(title: string) {
    saveDashboard(this.$store, { ...this.dashboard, title });
  }

  async onChangeOrder(order: VueOrdered[]) {
    const newOrder = order.map(item => item.id);
    try {
      await updateDashboardItemOrder(this.$store, newOrder);
    } catch (e) {
      throw e;
    }
  }

  onChangeSize(id: string, cols: number, rows: number) {
    updateDashboardItemSize(this.$store, { id, cols, rows });
  }

  onChangeItemConfig(id: string, config: any) {
    updateDashboardItemConfig(this.$store, { id, config });
  }

  onChangeItemId(id: string, newId: string) {
    updateDashboardItemId(this.$store, { id, newId })
      .catch(e => this.$q.notify(`Failed to rename ${id}: ${e}`));
  }

  defaultItem(): DashboardItem {
    return {
      id: shortid.generate(),
      feature: 'Unknown',
      dashboard: this.dashboardId,
      order: this.items.length + 1,
      config: {},
      ...widgetSizeById(this.$store, 'Unknown'),
    };
  }

  async onCreateItem(partial: Partial<DashboardItem>) {
    try {
      const item: DashboardItem = { ...this.defaultItem(), ...partial };
      await appendDashboardItem(this.$store, item);
      Notify.create({
        type: 'positive',
        message: `Added ${displayNameById(this.$store, item.feature)} "${item.id}"`,
      });
    } catch (e) {
      Notify.create(`Failed to add widget: ${e.toString()}`);
    }
  }

  onDeleteItem(item: DashboardItem) {
    const deleteItem = () => removeDashboardItem(this.$store, item);

    // Quasar dialog can't handle objects as value - they will be returned as null
    // As workaround, we use array index as value, and add the "action" key to each option
    const opts = [
      {
        label: 'Remove widget from this dashboard',
        action: deleteItem,
      },
      ...deletersById(this.$store, item.feature)
        .map(del => ({ label: del.description, action: del.action })),
    ].map((opt, idx) => ({ ...opt, value: idx }));

    this.$q.dialog({
      title: 'Delete widget',
      message: `How do you want to delete widget ${item.id}?`,
      options: {
        type: 'checkbox',
        model: [0], // pre-check the default action
        items: opts,
      },
      cancel: true,
    })
      .then((selected: number[]) =>
        selected.forEach(idx => opts[idx].action(this.$store, item.config)))
      .catch(() => { });
  }

  onCopyItem(item: DashboardItem) {
    const id = itemCopyName(this.$store, item.id);
    this.$q.dialog({
      title: 'Copy widget',
      message: `To which dashboard do you want to copy widget ${item.id}?`,
      options: {
        type: 'radio',
        model: null,
        items: this.allDashboards
          .map(dashboard => ({ label: dashboard.title, value: dashboard.id })),
      },
      cancel: true,
    })
      .then((dashboard: string) =>
        dashboard && appendDashboardItem(this.$store, { ...item, id, dashboard }))
      .catch(() => { });
  }

  onMoveItem(item: DashboardItem) {
    this.$q.dialog({
      title: 'Move widget',
      message: `To which dashboard do you want to move widget ${item.id}?`,
      options: {
        type: 'radio',
        model: null,
        items: this.allDashboards
          .filter(dashboard => dashboard.id !== this.dashboardId)
          .map(dashboard => ({ label: dashboard.title, value: dashboard.id })),
      },
      cancel: true,
    })
      .then((dashboard: string) =>
        dashboard && saveDashboardItem(this.$store, { ...item, dashboard }))
      .catch(() => { });
  }
}
</script>

<template>
  <q-page padding>
    <q-inner-loading v-if="!dashboard">
      <q-spinner size="50px" color="primary"/>
    </q-inner-loading>
    <template v-else>
      <portal to="toolbar-title">
        <div :class="widgetEditable ? 'editable': ''">
          <span>{{ dashboard.title }}</span>
          <q-popup-edit
            :disable="!widgetEditable"
            v-model="dashboard.title"
            title="Set dashboard title to:"
            @save="onChangeDashboardTitle"
          >
            <q-input v-model="dashboard.title"/>
          </q-popup-edit>
        </div>
      </portal>
      <portal to="toolbar-buttons">
        <q-btn
          :icon="widgetEditable ? 'check' : 'mode edit'"
          :color="widgetEditable ? 'positive' : 'primary'"
          :label="widgetEditable ? 'Stop editing' : 'Edit Dashboard'"
          @click="widgetEditable = !widgetEditable"
        />
        <q-btn color="primary" icon="add" label="New Widget" @click="() => wizardModalOpen = true"/>
      </portal>
      <q-modal v-model="wizardModalOpen">
        <NewWidgetWizard v-if="wizardModalOpen" :on-create="onCreateItem"/>
      </q-modal>
      <GridContainer
        :editable="widgetEditable"
        :on-change-order="onChangeOrder"
        :on-change-size="onChangeSize"
      >
        <component
          v-for="val in validatedItems"
          :disabled="widgetEditable"
          :is="val.component"
          :error="val.error"
          :key="val.item.id"
          :id="val.item.id"
          :type="val.item.feature"
          :cols="val.item.cols"
          :rows="val.item.rows"
          :config="val.item.config"
          :on-change-config="onChangeItemConfig"
          :on-change-id="v => onChangeItemId(val.item.id, v)"
          :on-delete="() => onDeleteItem(val.item)"
          :on-copy="() => onCopyItem(val.item)"
          :on-move="() => onMoveItem(val.item)"
          class="dashboard-item"
        />
      </GridContainer>
    </template>
  </q-page>
</template>

<style lang="stylus" scoped>
@import '../css/app.styl';

.dashboard-item {
  background: $block-background;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
