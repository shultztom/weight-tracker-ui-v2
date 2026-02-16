<template>
  <v-app-bar flat border color="surface">
    <v-app-bar-title>
      <router-link to="/profile" style="text-decoration: none; color: inherit; cursor: pointer;">
        Weight Tracker
      </router-link>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn
      icon="mdi-account"
      to="/edit/user"
      color="primary"
    ></v-btn>
  </v-app-bar>
</template>

<script setup>
</script>

<style scoped>
</style>
