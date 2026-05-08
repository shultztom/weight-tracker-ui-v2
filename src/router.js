import { createWebHistory, createRouter } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Profile from "./views/Profile.vue";
import EditUser from "./views/EditUser.vue";
import EditGoal from "./views/EditGoal.vue";

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home,
    },
    {
        path: "/login",
        name: "Log In",
        component: Login,
    },
    {
        path: "/profile",
        name: "Profile",
        component: Profile,
    },
    {
        path: "/edit/user",
        name: "Edit User",
        component: EditUser,
    },
    {
        path: "/edit/goal",
        name: "Edit Goal",
        component: EditGoal,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

export default router;