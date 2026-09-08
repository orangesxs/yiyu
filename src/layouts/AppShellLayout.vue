<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useThemeStore } from "../stores/theme";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();
const collapsed = ref(false);
const drawer = ref(false); // 窄屏抽屉（与 collapsed 同一个按钮切换）
function toggleSide() {
  collapsed.value = !collapsed.value;
  drawer.value = !drawer.value;
}

const apps = {
  ledger: {
    name: "记账本",
    sub: "把每一笔都记得清楚",
    icon: "💰",
    color: "var(--app-ledger)",
    menus: [
      { path: "/ledger/transactions", label: "流水明细", elIcon: "Tickets" },
      { path: "/ledger/reports", label: "报表统计", elIcon: "TrendCharts" },
      { path: "/ledger/books", label: "账本管理", elIcon: "Notebook" },
    ],
  },
  notes: {
    name: "记事本",
    sub: "随手记下，不再忘记",
    icon: "📝",
    color: "var(--app-notes)",
    menus: [
      { path: "/notes/list", label: "笔记", elIcon: "Document" },
      { path: "/notes/todos", label: "待办提醒", elIcon: "AlarmClock" },
      { path: "/notes/trash", label: "回收站", elIcon: "Delete" },
    ],
  },
  settings: {
    name: "设置",
    sub: "你的个人配置",
    icon: "⚙️",
    color: "var(--text-secondary)",
    menus: [
      { path: "/settings/profile", label: "个人设置", elIcon: "User" },
    ],
  },
};

const app = computed(() => apps[route.meta.app] || apps.ledger);

function onCommand(cmd) {
  if (cmd === "profile") router.push("/settings/profile");
  if (cmd === "logout") {
    userStore.logout();
    router.push("/auth/login");
  }
}
</script>

<template>
  <div class="shell">
    <header class="shell-topbar">
      <div class="shell-left">
        <el-tooltip :content="collapsed ? '展开侧栏' : '收起侧栏'" placement="bottom">
          <button class="icon-btn" @click="toggleSide">
            <el-icon :class="{ flip: collapsed }"><Expand /></el-icon>
          </button>
        </el-tooltip>
        <button class="back-btn" @click="router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
          <span class="back-text">广场</span>
        </button>
        <span class="app-badge" :style="{ background: `color-mix(in srgb, ${app.color} 14%, transparent)`, color: app.color }">{{ app.icon }}</span>
        <div class="app-title">
          <span class="app-name">{{ app.name }}</span>
          <span class="app-sub">{{ app.sub }}</span>
        </div>
      </div>
      <div class="shell-right">
        <el-tooltip :content="themeStore.isDark ? '切到浅色' : '切到深色'" placement="bottom">
          <button class="icon-btn" @click="themeStore.toggle()">
            <el-icon v-if="themeStore.isDark"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </button>
        </el-tooltip>
        <el-dropdown @command="onCommand">
          <span class="avatar-btn">
            <span class="avatar">{{ userStore.user?.nickname?.[0] || "一" }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="shell-body">
      <aside class="shell-aside" :class="{ collapsed, open: drawer }">
        <nav class="shell-nav">
          <router-link
            v-for="m in app.menus"
            :key="m.path"
            :to="m.path"
            class="nav-item"
            :class="{ active: route.path === m.path }"
          >
            <el-icon class="nav-icon"><component :is="m.elIcon" /></el-icon>
            <span v-show="!collapsed" class="nav-label">{{ m.label }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="shell-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shell-topbar {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--sticky-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 20;
}

.shell-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-regular);
  border-radius: 999px;
  padding: 6px 14px 6px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.back-btn:hover {
  color: var(--color-primary);
  border-color: var(--card-border-on-hover);
}

.app-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 17px;
}

.app-title {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.app-name {
  font-size: 15px;
  font-weight: 600;
}
.app-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

.shell-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-regular);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: all var(--dur-base) ease;
}
.icon-btn:hover {
  color: var(--color-primary);
  border-color: var(--card-border-on-hover);
}

.avatar-btn {
  cursor: pointer;
  display: flex;
}
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--app-ledger), var(--app-notes));
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.shell-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.shell-aside {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  border-right: 1px solid var(--border-color);
  background: var(--bg-card);
  overflow-y: auto;
  transition: width var(--dur-sidebar) ease;
}
.shell-aside.collapsed {
  width: 64px;
}

.shell-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-input);
  color: var(--text-regular);
  text-decoration: none;
  font-size: 14px;
  transition: all var(--dur-base) ease;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-weight: 500;
}
.collapsed .nav-item {
  justify-content: center;
}

.icon-btn .flip { transform: rotate(180deg); }

.shell-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.shell-main > * {
  flex: 1;
  width: 100%;
}

@media (max-width: 768px) {
  .shell-topbar { padding: 0 14px; }
  .app-sub, .back-text { display: none; }
  .back-btn { padding: 6px 9px; }

  .shell-aside {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 30;
    width: 200px !important;
    transform: translateX(-100%);
    transition: transform var(--dur-sidebar) ease;
    box-shadow: var(--shadow-hover);
  }
  .shell-aside.open {
    transform: translateX(0);
  }
  .shell-aside.collapsed .nav-item {
    justify-content: flex-start;
  }
}
</style>
