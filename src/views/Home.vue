<template>
  <v-container>
  </v-container>
</template>

<script setup>
import {onMounted} from "vue";
import router from "../router.js";
import {useUserStore} from "../stores/user.js";

const userStore = useUserStore();

onMounted(() =>{
  determineIfUserIsLoggedIn();
})

const determineIfUserIsLoggedIn = () => {
  if(!userStore.getUser){
    router.push("/login");
    return;
  }

  router.push("/profile");
}

</script>
