<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="rounded-lg pa-6 text-center">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="64"></v-icon>
          <v-card-title class="text-h5 justify-center mt-2">Something went wrong</v-card-title>
          <v-card-text class="text-medium-emphasis">
            The weight tracker is unavailable right now. Please try again.
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn color="primary" variant="elevated" @click="tryAgain">
              Try Again
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import router from "../router.js";
import { resetApiErrorStreak } from "../utils/api.js";

const tryAgain = async () => {
  resetApiErrorStreak();
  await router.push('/profile');
};
</script>
