import { defineStore } from "pinia";
import { ref } from "vue";

const USER_KEY = "yiyu-user";

export const useUserStore = defineStore("user", () => {
  const user = ref(normalize(JSON.parse(localStorage.getItem(USER_KEY) || "null")));

  function normalize(u) {
    // 旧登录态无 id，补默认 u1（mock 成员安）
    return u && !u.id ? { ...u, id: "u1" } : u;
  }

  function login({ username, nickname }) {
    user.value = { id: "u1", username, nickname: nickname || username };
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
  }
  function logout() {
    user.value = null;
    localStorage.removeItem(USER_KEY);
  }
  function updateProfile(patch) {
    user.value = { ...user.value, ...patch };
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
  }

  return { user, login, logout, updateProfile };
});
