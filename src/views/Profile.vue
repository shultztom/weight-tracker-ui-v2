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

      <v-row justify="center" class="pt-1">
        <p class="text-h5" v-if="weightDiffForTimePeriodUpDownOrFlat === 'down'">↓ {{ weightDiffForTimePeriod }} lbs</p>
        <p class="text-h5" v-if="weightDiffForTimePeriodUpDownOrFlat === 'flat'">{{ weightDiffForTimePeriod }} lbs</p>
        <p class="text-h5" v-if="weightDiffForTimePeriodUpDownOrFlat === 'up'">↑ {{ weightDiffForTimePeriod }} lbs</p>
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
            {{ stats?.TDEE }} <span @click="handleTdeeOptionsDialogModel"> ⓘ</span>
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

      <v-row v-if="hasGoal" justify="center" align="center" class="pt-2">
        <v-col xs="6">
          <v-row justify="center">
            <p class="text-p">Days Until Goal</p>
          </v-row>
          <v-row justify="center">
            {{ goalInfo?.daysUntilGoal }}
          </v-row>
        </v-col>
        <v-col xs="6">
          <v-row justify="center">
            <p class="text-p">Eat this much</p>
          </v-row>
          <v-row justify="center">
            {{ goalInfo?.todayCalorieGoal?.toFixed(0) }} cals
          </v-row>
        </v-col>
      </v-row>


      <v-row justify="center" class="pt-2">
        <v-btn @click="handleAddWeight">Add Weight</v-btn>
      </v-row>
    </v-col>
  </v-container>

  <v-dialog
      v-model="weightEnterDialogModel"
      width="auto"
  >
    <v-card>
      <v-date-picker v-model="dateEntry"></v-date-picker>

      <v-text-field
          v-model="weightEntry"
          type="number"
          class="mb-2"
          clearable
          label="Weight (lbs)"
      ></v-text-field>

      <v-card-actions>
        <v-btn color="error" @click="weightEnterDialogModel = false">Close Dialog</v-btn>
        <v-btn color="primary" @click="saveWeight" :disabled="weightEntry === null">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="tdeeOptionsDialogModel"
    width="auto">
      <v-card
          class="mx-auto"
          max-width="300"
      >
        <v-list :items="tdeeOptions"></v-list>
        <v-card-actions>
          <v-btn color="error" @click="tdeeOptionsDialogModel = false">Close Dialog</v-btn>
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


<script setup>
import {onMounted, ref} from "vue";

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
const timeRange = ref("7");

const lastWeight = ref(null);
const stats = ref({});
const tableData = ref({});

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
  console.log('handleTdeeOptionsDialogModel');
  tdeeOptionsDialogModel.value = true;
}

</script>