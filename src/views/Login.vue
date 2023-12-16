<template>
  <v-sheet rounded>
    <v-card class="mx-auto px-6 py-8" max-width="344">
      <v-form
          v-model="form"
          @submit.prevent="onSubmit"
      >
        <v-text-field
            v-model="username"
            :readonly="loading"
            :rules="[required]"
            class="mb-2"
            clearable
            label="Username"
        ></v-text-field>

        <v-text-field
            v-model="password"
            :readonly="loading"
            :rules="[required]"
            type="password"
            clearable
            label="Password"
            placeholder="Enter your password"
        ></v-text-field>

        <br>

        <v-btn
            :disabled="!form"
            :loading="loading"
            block
            color="success"
            size="large"
            type="submit"
            variant="elevated"
        >
          Sign In
        </v-btn>
      </v-form>
    </v-card>

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
  </v-sheet>
</template>


<script setup>
import {ref} from "vue";
import axios from "axios";

import {useUserStore} from "../stores/user.js";
import router from "../router.js";

const userStore = useUserStore();

const form = ref(false);
const username = ref(null);
const password = ref(null);
const loading = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");

const onSubmit = async () => {
  if (!form.value) return;

  loading.value = true;

  const URL = `https://auth-api-go.shultzlab.com/login`;
  const DATA = {
    "username": username.value,
    "password": password.value
  }

  try {
    const response = await axios.post(URL, DATA);
    if(response.status === 200){
      const token = response?.data?.token;
      userStore.setToken(token);
      userStore.setUser(username.value); // TODO get from token?

      await router.push("/profile");
    }else{
      userStore.reset();
      showLoginError();
    }
  } catch (e) {
    console.log(e.message);
    userStore.reset();
    showLoginError();
  }
};

const required = (v) => {
  return !!v || 'Field is required'
};

const showLoginError = () => {
  snackbarText.value = "Error logging in!";
  snackbar.value = true;
  loading.value = false;
}

</script>