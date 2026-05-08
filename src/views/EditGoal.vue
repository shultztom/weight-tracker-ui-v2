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
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="rounded-lg pa-4">
            <v-card-title class="text-h5 mb-4">{{ editMode ? 'Edit Goal' : 'Set Goal' }}</v-card-title>
            <v-form v-model="formValid" @submit.prevent="saveGoal">
              <v-text-field
                v-model="goalWeightLbs"
                label="Goal Weight (lbs)"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-weight-pound"
                :rules="weightRules"
                required
              ></v-text-field>

              <v-menu
                v-model="goalDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="goalDateString"
                    label="Goal Date"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    variant="outlined"
                    :rules="dateRules"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="goalDatePicker"
                  @update:model-value="onGoalDateChange"
                ></v-date-picker>
              </v-menu>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="onCancel">Cancel</v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  type="submit"
                  :loading="saving"
                  :disabled="!formValid"
                >
                  Save Goal
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>

  <v-snackbar v-model="snackbar" :timeout="5000">
    {{ snackbarText }}
    <template v-slot:actions>
      <v-btn color="red" variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>

  <v-dialog v-model="confirmCancelDialog" max-width="400">
    <v-card class="rounded-lg">
      <v-card-title>Discard changes?</v-card-title>
      <v-card-text>You have unsaved changes. Are you sure you want to leave?</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="confirmCancelDialog = false">Stay</v-btn>
        <v-btn color="error" variant="elevated" @click="router.push('/profile')">Discard</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useUserStore } from "../stores/user.js";
import router from "../router.js";
import Navbar from "../components/Navbar.vue";
import api from "../utils/api.js";
import { convertKgsToLbs, convertLbsToKgs } from "../utils/units.js";

const userStore = useUserStore();

const loading = ref(true);
const saving = ref(false);
const formValid = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const initialSnapshot = ref(null);
const confirmCancelDialog = ref(false);

const editMode = ref(false);
const goalId = ref(null);
const goalWeightLbs = ref(null);
const goalDateString = ref("");
const goalDatePicker = ref(null);
const goalDateMenu = ref(false);

const weightRules = [
  v => !!v || 'Required',
  v => v > 0 || 'Must be greater than 0',
];

const dateRules = [
  v => !!v || 'Required',
  v => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(v) >= today || 'Goal date must be today or in the future';
  },
];

const isDirty = computed(() => JSON.stringify({
  goalWeightLbs: goalWeightLbs.value,
  goalDateString: goalDateString.value,
}) !== initialSnapshot.value);

onMounted(async () => {
  await loadGoal();
});

const loadGoal = async () => {
  try {
    const response = await api.get(`/goals/${userStore.getUser}`);
    const goals = response.data;
    if (goals && goals.length > 0) {
      const latest = goals[0];
      editMode.value = true;
      goalId.value = latest.id;
      goalWeightLbs.value = convertKgsToLbs(latest.weight).toFixed(1);
      goalDateString.value = latest.goalDate;
      goalDatePicker.value = new Date(latest.goalDate);
    }
    initialSnapshot.value = JSON.stringify({
      goalWeightLbs: goalWeightLbs.value,
      goalDateString: goalDateString.value,
    });
    loading.value = false;
  } catch (e) {
    handleNetworkError(e, "Unable to load goal!");
  }
};

const onGoalDateChange = (val) => {
  if (val) {
    goalDateString.value = val.toISOString().split('T')[0];
    goalDateMenu.value = false;
  }
};

const onCancel = () => {
  if (isDirty.value) {
    confirmCancelDialog.value = true;
  } else {
    router.push('/profile');
  }
};

const saveGoal = async () => {
  saving.value = true;
  const payload = {
    weight: convertLbsToKgs(goalWeightLbs.value),
    goalDate: goalDateString.value,
  };

  try {
    if (editMode.value) {
      await api({
        method: 'PUT',
        url: `/goals/${userStore.getUser}/${goalId.value}`,
        data: payload,
      });
    } else {
      await api({
        method: 'POST',
        url: `/goals/${userStore.getUser}`,
        data: payload,
      });
    }
    initialSnapshot.value = JSON.stringify({
      goalWeightLbs: goalWeightLbs.value,
      goalDateString: goalDateString.value,
    });
    snackbarText.value = "Goal saved!";
    snackbar.value = true;
  } catch (e) {
    handleNetworkError(e, "Unable to save goal!");
  } finally {
    saving.value = false;
  }
};

const handleNetworkError = (e, message) => {
  console.error(e);
  snackbarText.value = message;
  snackbar.value = true;
};
</script>
