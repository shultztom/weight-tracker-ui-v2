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

  <div v-else>
    <Navbar />
    <v-container class="pb-8">
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

      <v-row justify="center" class="mt-2">
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-target"
          @click="router.push('/edit/goal')"
        >
          {{ hasGoal ? 'Edit Goal' : 'Set Goal' }}
        </v-btn>
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
  </div>

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
        <v-btn color="primary" variant="elevated" @click="saveWeight" :disabled="!weightEntry" :loading="loadingChart">Save</v-btn>
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
      :timeout="5000"
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

import Navbar from "../components/Navbar.vue";
import {useUserStore} from "../stores/user.js";
import router from "../router.js";
import api from "../utils/api.js";
import { convertKgsToLbs, convertLbsToKgs } from "../utils/units.js";

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
  getWeightInfo();
  getTdeeOptions();
})

const handleNetworkError = (e, message) => {
  console.log(e.message);
  snackbarText.value = message;
  snackbar.value = true;
}

const getWeightInfo = async () => {
  try {
    const lastWeightResponse = await api.get(`/entry/username/${userStore.user}/last`);
    lastWeight.value = convertKgsToLbs(lastWeightResponse.data?.weight).toFixed(1);

    const statsResponse = await api.get(`/stats/all/${userStore.user}`);
    stats.value = {
      BMR: statsResponse.data?.BMR.toFixed(0),
      TDEE: statsResponse.data?.TDEE.toFixed(0),
      BMI: statsResponse.data?.BMI.toFixed(1),
    }

    const goalResponse = await api.get(`/goals/${userStore.user}/goal/calorieBreakdown`);
    goalInfo.value = goalResponse.data;
    if(goalResponse.data?.todayCalorieGoal !== 0){
      hasGoal.value = true;
    }

    await updateChart();
    loading.value = false;
  } catch (e) {
    handleNetworkError(e, "Unable to get weight info!");
  }
}

const updateChart = async () => {
  loadingChart.value = true;

  let tableDataResponse;
  try {
    tableDataResponse = await api.get(`/entry/username/${userStore.user}?time=${timeRange.value}`);
  } catch (e) {
    handleNetworkError(e, "Unable to update chart data!");
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
  try {
    await api.post('/entry', {
      username: userStore.getUser,
      weight: convertLbsToKgs(weightEntry.value),
      entryDate: dateEntry.value
    });
  } catch (e) {
    handleNetworkError(e, "Unable to upload weight!");
  }

  await getWeightInfo();
  weightEnterDialogModel.value = false;
}

const getTdeeOptions = async () => {
  try {
    const statsResponse = await api.get(`/stats/tdeeOptions/${userStore.user}`);
    tdeeOptions.value = [
      `Sedentary:         ${statsResponse.data?.sedentary}`,
      `Lightly Active:    ${statsResponse.data?.lightlyActive}`,
      `Moderately Active: ${statsResponse.data?.moderatelyActive}`,
      `Very Active:       ${statsResponse.data?.veryActive}`,
      `Extra Active:      ${statsResponse.data?.extraActive}`
    ];
  } catch (e) {
    snackbarText.value = 'Unable to load TDEE options!';
    snackbar.value = true;
  }
}

const handleTdeeOptionsDialogModel = () => {
  tdeeOptionsDialogModel.value = true;
}

</script>