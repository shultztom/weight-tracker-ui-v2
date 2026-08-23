import { createWebHistory, createRouter } from "vue-router";
import Login from "./views/Login.vue";
import Profile from "./views/Profile.vue";
import EditUser from "./views/EditUser.vue";
import EditGoal from "./views/EditGoal.vue";
import ErrorPage from "./views/ErrorPage.vue";
import { useUserStore } from "./stores/user.js";

const routes = [
    {
        path: "/",
        redirect: "/profile",
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
    {
        path: "/error",
        name: "Error",
        component: ErrorPage,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

const publicRoutes = ['/login', '/', '/error'];

router.beforeEach((to) => {
    const isAuthenticated = !!useUserStore().getToken;
    if (!publicRoutes.includes(to.path) && !isAuthenticated) {
        return '/login';
    }
});

export default router;
