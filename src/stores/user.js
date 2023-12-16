import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useUserStore = defineStore('user', {
    state: () => {
        return {
            user: useStorage('user', null),
            token: useStorage('token', null)
        }
    },
    getters: {
        getUser(state) {
            return state.user
        },
        getToken(state) {
            return state.token
        }
    },
    actions: {
        setUser(user) {
            this.user = user;
        },
        setToken(token){
            this.token = token;
        },
        reset(){
            this.user = null;
            this.token = null;
        }
    },
})