<template>
  <v-container v-if="loading">
    <v-col>
      <v-row justify="center">
        <v-progress-circular
            :size="70"
            :width="7"
            color="blue"
            indeterminate
        ></v-progress-circular>
      </v-row>
    </v-col>
  </v-container>


  <v-container v-else>
    <v-col>
      <v-row justify="center">
        <LineChart :chartData="tableData"/>
      </v-row>
      <v-row justify="center">
        <v-tabs
            v-model="timeRange"
            @update:model-value="updateChart"
        >
          <v-tab value="7">Week</v-tab>
          <v-tab value="30">Month</v-tab>
          <v-tab value="365">Year</v-tab>
          <v-tab value="-1">All</v-tab>
        </v-tabs>
      </v-row>


      <v-row justify="center" class="pt-2">
        <p class="text-h3">{{ lastWeight }} lbs</p>
      </v-row>


      <v-row justify="center" class="pt-2">
        <v-col xs="4">
          <v-row justify="center">
            <p class="text-h6">BMR</p>
          </v-row>
          <v-row justify="center">
            {{ stats?.BMR }}
          </v-row>
        </v-col>
        <v-col xs="4">
          <v-row justify="center">
            <p class="text-h6">TDEE</p>
          </v-row>
          <v-row justify="center">
            {{ stats?.TDEE }}
          </v-row>
        </v-col>
        <v-col xs="4">
          <v-row justify="center">
            <p class="text-h6">BMI</p>
          </v-row>
          <v-row justify="center">
            {{ stats?.BMI }}
          </v-row>
        </v-col>
      </v-row>


      <v-row justify="center" class="pt-2">
        <v-btn @click="handleAddWeight">Add Weight</v-btn>
      </v-row>
    </v-col>
  </v-container>
</template>


<script setup>
import {onMounted, ref} from "vue";

import {LineChart} from 'vue-chart-3';
import {Chart, registerables} from "chart.js";

Chart.register(...registerables);

import {useUserStore} from "../stores/user.js";
import router from "../router.js";
import axios from "axios";

const URL = 'https://weight-tracker-api.shultzlab.com';

const userStore = useUserStore();

const loading = ref(true);
const loadingChart = ref(true);
const timeRange = ref("7");

const lastWeight = ref(null);
const stats = ref({});
const tableData = ref({});

onMounted(() => {
  determineIfUserIsLoggedIn();
  getWeightInfo();
})

const determineIfUserIsLoggedIn = () => {
  if (!userStore.getUser) {
    router.push("/login");
  }

  // TODO verify token
}

const convertKgsToLbs = (weight) => {
  return weight * 2.20462;
}

const getWeightInfo = async () => {
  const LAST_WEIGHT_INFO_ROUTE = `${URL}/entry/username/${userStore.user}/last`;
  const STATS_ROUTE = `${URL}/stats/all/${userStore.user}`;

  try {
    // Last Weight
    const lastWeightResponse = await axios({
      url: LAST_WEIGHT_INFO_ROUTE,
      headers: {'x-auth-token': userStore.getToken}
    });

    lastWeight.value = convertKgsToLbs(lastWeightResponse.data?.weight);

    // Stats
    const statsResponse = await axios({
      url: STATS_ROUTE,
      headers: {'x-auth-token': userStore.getToken}
    });

    stats.value = {
      BMR: statsResponse.data?.BMR.toFixed(0),
      TDEE: statsResponse.data?.TDEE.toFixed(0),
      BMI: statsResponse.data?.BMI.toFixed(1),
    }

    // Chart Data
    await updateChart();

    loading.value = false;
  } catch (e) {
    console.log(e.message);
    // TODO error handle
  }

}

const updateChart = async () => {
  loadingChart.value = true;

  console.log('Getting chart data');
  const TABLE_DATA_ROUTE = `${URL}/entry/username/${userStore.user}?time=${timeRange.value}`;

  // Table Data
  const tableDataResponse = await axios({
    url: TABLE_DATA_ROUTE,
    headers: {'x-auth-token': userStore.getToken}
  });

  const userTableData = {
    labels: [],
    datasets: [
      {
        label: 'Weight',
        data: [],
        fill: true,
      },
    ],
  }

  for (const data of tableDataResponse.data) {
    userTableData.labels.push(data.entryDate);
    userTableData.datasets[0].data.push(convertKgsToLbs(data.weight));
  }

  tableData.value = userTableData;

  loadingChart.value = false;
}

const handleAddWeight = () => {
  console.log("add weight...")
}

</script>