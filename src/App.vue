<script lang="ts">
import { setupApi as setupDashboardsApi } from '@/store/dashboards/actions';
import { setupApi as setupServicesApi } from '@/store/services/actions';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component
export default class App extends Vue {
  async created() {
    await Promise.all([
      setupServicesApi(this.$store),
      setupDashboardsApi(this.$store),
    ]);
  }
}
</script>

<template>
  <div id="q-app">
    <router-view/>
  </div>
</template>

