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


  <v-container v-else class="pb-8">
    <v-col class="pa-0">
      <v-row justify="center" no-gutters>
        <v-col cols="12" md="10" lg="8">
          <LineChart :chartData="tableData" :options="chartOptions" :height="300"/>
        </v-col>
      </v-row>
      <v-row justify="center" class="mt-2">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-select
                v-model="timeRange"
                :items="timeRangeItems"
                item-title="title"
                item-value="value"
                @update:model-value="updateChart"
                variant="solo-filled"
                class="center-selection"
                item-props
                :menu-props="{ contentClass: 'centered-menu-items' }"
                hide-details
                density="compact">
          </v-select>
        </v-col>
      </v-row>

      <v-row justify="center" class="mt-4">
        <div class="text-center">
          <div class="text-h3 font-weight-bold">{{ lastWeight }} lbs</div>
          <div class="text-h5 mt-1" :class="weightDiffColor">
            <template v-if="weightDiffForTimePeriodUpDownOrFlat === 'down'">↓</template>
            <template v-else-if="weightDiffForTimePeriodUpDownOrFlat === 'up'">↑</template>
            {{ weightDiffForTimePeriod }} lbs
          </div>
        </div>
      </v-row>

      <v-row justify="center" class="mt-6">
        <v-col cols="12" sm="10" md="8">
          <v-card variant="outlined" class="rounded-lg">
            <v-row no-gutters class="text-center py-2">
              <v-col cols="4">
                <div class="text-caption text-uppercase font-weight-bold">BMR</div>
                <div class="text-h6">{{ stats?.BMR }}</div>
              </v-col>
              <v-col cols="4" class="border-s border-e">
                <div class="text-caption text-uppercase font-weight-bold">
                  TDEE
                  <v-icon
                    icon="mdi-information-outline"
                    size="x-small"
                    class="cursor-pointer"
                    @click="handleTdeeOptionsDialogModel"
                  ></v-icon>
                </div>
                <div class="text-h6">{{ stats?.TDEE }}</div>
              </v-col>
              <v-col cols="4">
                <div class="text-caption text-uppercase font-weight-bold">BMI</div>
                <div class="text-h6">{{ stats?.BMI }}</div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="hasGoal" justify="center" class="mt-4">
        <v-col cols="12" sm="10" md="8">
          <v-card variant="outlined" class="rounded-lg">
            <v-row no-gutters class="text-center py-2">
              <v-col cols="4">
                <div class="text-caption text-uppercase font-weight-bold">Days Left</div>
                <div class="text-h6">{{ goalInfo?.daysUntilGoal }}</div>
              </v-col>
              <v-col cols="4" class="border-s border-e">
                <div class="text-caption text-uppercase font-weight-bold">Weight Left</div>
                <div class="text-h6">{{ convertKgsToLbs(goalInfo?.weightDiff).toFixed(1) }}</div>
              </v-col>
              <v-col cols="4">
                <div class="text-caption text-uppercase font-weight-bold">Calorie Goal</div>
                <div class="text-h6">{{ goalInfo?.todayCalorieGoal?.toFixed(0) }}</div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <v-row justify="center" class="mt-6">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          rounded="pill"
          @click="handleAddWeight"
        >
          Add Weight
        </v-btn>
      </v-row>
    </v-col>
  </v-container>

  <v-dialog
      v-model="weightEnterDialogModel"
      max-width="400"
  >
    <v-card class="rounded-lg">
      <v-card-title class="text-center pt-4">Add Weight Entry</v-card-title>
      <v-card-text>
        <v-date-picker v-model="dateEntry" color="primary" width="100%" hide-header></v-date-picker>

        <v-text-field
            v-model="weightEntry"
            type="number"
            class="mt-4"
            variant="outlined"
            clearable
            label="Weight (lbs)"
            prepend-inner-icon="mdi-weight-pound"
        ></v-text-field>
      </v-card-text>

      <v-card-actions class="pb-4 px-6">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="weightEnterDialogModel = false">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" @click="saveWeight" :disabled="!weightEntry">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="tdeeOptionsDialogModel"
    max-width="350">
      <v-card class="rounded-lg">
        <v-card-title class="text-center pt-4">TDEE Options</v-card-title>
        <v-list>
          <v-list-item v-for="(option, index) in tdeeOptions" :key="index">
            <v-list-item-title class="text-body-2">{{ option }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-card-actions class="pb-4 px-6">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="tdeeOptionsDialogModel = false">Close</v-btn>
        </v-card-actions>
      </v-card>
  </v-dialog>

  <v-snackbar
      v-model="snackbar"
      :timeout=5000
  >
    {{ snackbarText }}

    <template v-slot:actions>
      <v-btn
          color="red"
          variant="text"
          @click="snackbar = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style>
.centered-menu-items .v-list-item-title {
  text-align: center;
  width: 100%;
}

.center-selection .v-field__input {
  text-align: center !important;
}

.center-selection .v-select__selection {
  margin: auto !important;
}
</style>

<script setup>
import {computed, onMounted, ref} from "vue";

import {LineChart} from 'vue-chart-3';
import {Chart, registerables} from "chart.js";

Chart.register(...registerables);

import {useUserStore} from "../stores/user.js";
import router from "../router.js";
import axios from "axios";

const URL = 'https://weight-tracker-api.shultzlab.com';
//const URL = 'http://localhost:8080';

const userStore = useUserStore();

const loading = ref(true);
const loadingChart = ref(true);
const timeRange = ref(7);
const timeRangeItems = [
  {title: 'Week', value: 7},
  {title: 'Month', value: 30},
  {title: '3 Month', value: 90},
  {title: '6 Month', value: 180},
  {title: 'Year', value: 365},
  {title: 'All', value: -1},
];

const lastWeight = ref(null);
const stats = ref({});
const tableData = ref({});
const chartOptions = {
  plugins: {
    legend: {
      display: false,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
};

const weightEnterDialogModel = ref(false);
const weightEntry = ref(null);
const dateEntry = ref(new Date());

const snackbar = ref(false);
const snackbarText = ref("");

const weightDiffForTimePeriod = ref(null);
const weightDiffForTimePeriodUpDownOrFlat = ref("");

const tdeeOptionsDialogModel = ref(false);
const tdeeOptions = ref([]);

const goalInfo = ref(null)
const hasGoal = ref(false)

const weightDiffColor = computed(() => {
  if (weightDiffForTimePeriodUpDownOrFlat.value === 'down') return 'text-success';
  if (weightDiffForTimePeriodUpDownOrFlat.value === 'up') return 'text-error';
  return 'text-medium-emphasis';
})

onMounted(() => {
  determineIfUserIsLoggedIn();
  getWeightInfo();
  getTdeeOptions();
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

const convertLbsToKgs = (weight) => {
  return weight / 2.20462;
}

const handleNetworkError = async (e, message) => {
  console.log(e.message);
  if (e?.response?.status === 403 || e?.response?.status === 401) {
    await router.push("/login");
    return;
  }

  snackbarText.value = message;
  snackbar.value = true;
}

const getWeightInfo = async () => {
  const LAST_WEIGHT_INFO_ROUTE = `${URL}/entry/username/${userStore.user}/last`;
  const STATS_ROUTE = `${URL}/stats/all/${userStore.user}`;
  const GOAL_ROUTE = `${URL}/goals/${userStore.user}/goal/calorieBreakdown`;

  try {
    // Last Weight
    const lastWeightResponse = await axios({
      url: LAST_WEIGHT_INFO_ROUTE,
      headers: {'x-auth-token': userStore.getToken}
    });

    lastWeight.value = convertKgsToLbs(lastWeightResponse.data?.weight).toFixed(1);

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

    // Goals
    const goalResponse = await axios({
      url: GOAL_ROUTE,
      headers: {'x-auth-token': userStore.getToken}
    });

    goalInfo.value = goalResponse.data;
    if(goalResponse.data?.todayCalorieGoal !== 0){
      hasGoal.value = true;
    }

    // Chart Data
    await updateChart();

    loading.value = false;
  } catch (e) {
    await handleNetworkError(e, "Unable to get weight info!");
  }

}

const updateChart = async () => {
  loadingChart.value = true;

  const TABLE_DATA_ROUTE = `${URL}/entry/username/${userStore.user}?time=${timeRange.value}`;

  // Table Data
  let tableDataResponse;
  try {
    tableDataResponse = await axios({
      url: TABLE_DATA_ROUTE,
      headers: {'x-auth-token': userStore.getToken}
    });
  } catch (e) {
    await handleNetworkError(e, "Unable to update chart data!");
  }

  const userTableData = {
    labels: [],
    datasets: [
      {
        label: 'Weight',
        backgroundColor: '#ADD8E6',
        data: [],
        fill: true,
      },
    ],
  }

  for (const data of tableDataResponse.data) {
    // Format for Chart.js
    userTableData.labels.push(data.entryDate);
    userTableData.datasets[0].data.push(convertKgsToLbs(data.weight));
  }

  // Get first and last for diff
  const weightArray = tableDataResponse.data.map(x => x.weight);

  const max = weightArray[0];
  const min = weightArray[weightArray.length - 1];

  let diff = max - min;

  if (diff > 0) {
    weightDiffForTimePeriodUpDownOrFlat.value = 'down';
  } else if (diff < 0) {
    weightDiffForTimePeriodUpDownOrFlat.value = 'up';
  } else {
    weightDiffForTimePeriodUpDownOrFlat.value = 'flat';
  }

  diff = Math.abs(diff);

  weightDiffForTimePeriod.value = convertKgsToLbs(diff).toFixed(1);

  tableData.value = userTableData;

  loadingChart.value = false;
}

const handleAddWeight = () => {
  weightEnterDialogModel.value = true;
}

const saveWeight = async () => {
  const axiosSubmitConfig = {
    method: "POST",
    url: `${URL}/entry`,
    headers: {
      'x-auth-token': userStore.getToken
    },
    data: {
      username: userStore.getUser,
      weight: convertLbsToKgs(weightEntry.value),
      entryDate: dateEntry.value
    }
  }

  try {
    const response = await axios(axiosSubmitConfig);
  } catch (e) {
    await handleNetworkError(e, "Unable to upload weight!");
  }

  await getWeightInfo();
  weightEnterDialogModel.value = false;
}

const getTdeeOptions = async () => {
  const STATS_TDEE_OPTIONS_ROUTE = `${URL}/stats/tdeeOptions/${userStore.user}`;
  const statsResponse = await axios({
    url: STATS_TDEE_OPTIONS_ROUTE,
    headers: {'x-auth-token': userStore.getToken}
  });

  tdeeOptions.value = [
    `Sedentary:         ${statsResponse.data?.sedentary}`,
    `Lightly Active:    ${statsResponse.data?.lightlyActive}`,
    `Moderately Active: ${statsResponse.data?.moderatelyActive}`,
    `Very Active:       ${statsResponse.data?.veryActive}`,
    `Extra Active:      ${statsResponse.data?.extraActive}`
  ]
}

const handleTdeeOptionsDialogModel = () => {
  tdeeOptionsDialogModel.value = true;
}

</script>