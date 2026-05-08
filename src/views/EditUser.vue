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
            <v-card-title class="text-h5 mb-4">Edit User Profile</v-card-title>
            <v-form v-model="formValid" @submit.prevent="saveUser">
              <v-text-field
                v-model="user.username"
                label="Username"
                readonly
                variant="outlined"
                prepend-inner-icon="mdi-account"
                disabled
              ></v-text-field>

              <v-text-field
                v-model="user.height"
                label="Height (cm)"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-human-male-height"
                required
              ></v-text-field>

              <v-menu
                v-model="birthdayMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="user.birthday"
                    label="Birthday"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    variant="outlined"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="birthdayDate"
                  @update:model-value="onBirthdayChange"
                ></v-date-picker>
              </v-menu>

              <v-select
                v-model="user.activityLevel"
                :items="activityLevels"
                label="Activity Level"
                variant="outlined"
                prepend-inner-icon="mdi-run"
              ></v-select>

              <v-select
                v-model="user.gender"
                :items="genders"
                label="Gender"
                variant="outlined"
                prepend-inner-icon="mdi-gender-male-female"
              ></v-select>

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
                  Save Changes
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>

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
import {computed, onMounted, ref} from "vue";
import {useUserStore} from "../stores/user.js";
import router from "../router.js";
import Navbar from "../components/Navbar.vue";
import api from "../utils/api.js";

const userStore = useUserStore();

const loading = ref(true);
const saving = ref(false);
const formValid = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const initialSnapshot = ref(null);
const confirmCancelDialog = ref(false);

const user = ref({
  username: "",
  height: 0,
  birthday: "",
  activityLevel: "",
  gender: ""
});

const birthdayDate = ref(null);
const birthdayMenu = ref(false);

const activityLevels = [
  { title: 'Sedentary', value: 'sedentary' },
  { title: 'Lightly Active', value: 'lightlyActive' },
  { title: 'Moderately Active', value: 'moderatelyActive' },
  { title: 'Very Active', value: 'veryActive' },
  { title: 'Extra Active', value: 'extraActive' }
];

const genders = [
  { title: 'Male', value: 'male' },
  { title: 'Female', value: 'female' }
];

const isDirty = computed(() => JSON.stringify(user.value) !== initialSnapshot.value);

onMounted(() => {
  getUserInfo();
});

const getUserInfo = async () => {
  try {
    const response = await api.get(`/user/${userStore.getUser}`);
    user.value = response.data;
    if (user.value.birthday) {
        birthdayDate.value = new Date(user.value.birthday);
    }
    initialSnapshot.value = JSON.stringify(user.value);
    loading.value = false;
  } catch (e) {
    handleNetworkError(e, "Unable to get user info!");
  }
};

const onBirthdayChange = (val) => {
  if (val) {
    user.value.birthday = val.toISOString().split('T')[0];
    birthdayMenu.value = false;
  }
};

const onCancel = () => {
  if (isDirty.value) {
    confirmCancelDialog.value = true;
  } else {
    router.push('/profile');
  }
};

const saveUser = async () => {
  saving.value = true;
  try {
    await api({
      method: 'PUT',
      url: `/user/${user.value.id}`,
      data: user.value
    });
    initialSnapshot.value = JSON.stringify(user.value);
    snackbarText.value = "Profile updated successfully!";
    snackbar.value = true;
  } catch (e) {
    handleNetworkError(e, "Unable to update profile!");
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
