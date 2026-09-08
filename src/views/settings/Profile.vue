<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "../../stores/user";
import { useThemeStore } from "../../stores/theme";

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

const profile = reactive({
  nickname: userStore.user?.nickname || "",
});

function saveProfile() {
  userStore.updateProfile({ nickname: profile.nickname });
  ElMessage.success("资料已更新");
}

const pwd = reactive({ old: "", new1: "", new2: "" });
const pwdRef = ref();
const pwdRules = {
  new1: [{ min: 6, message: "密码至少 6 位", trigger: "blur" }],
  new2: [
    {
      validator: (r, v, cb) => (v === pwd.new1 ? cb() : cb(new Error("两次输入不一致"))),
      trigger: "blur",
    },
  ],
};
function savePwd() {
  pwdRef.value.validate((ok) => {
    if (!ok) return;
    ElMessage.success("密码已修改");
    pwd.old = pwd.new1 = pwd.new2 = "";
  });
}
</script>

<template>
  <div class="page profile-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">个人设置</h2>
        <p class="page-sub">你的一隅，由你定义</p>
      </div>
    </div>

    <div class="profile-grid">
      <!-- 账号信息 -->
      <div class="yiyu-card p-card">
        <h3 class="p-title">账号信息</h3>
        <div class="avatar-row">
          <span class="big-avatar">{{ userStore.user?.nickname?.[0] || "一" }}</span>
          <div>
            <span class="username">{{ userStore.user?.username }}</span>
            <span class="role-tip">空间成员 · 已加入 126 天</span>
          </div>
        </div>
        <el-form label-position="top">
          <el-form-item label="昵称">
            <el-input v-model="profile.nickname" maxlength="12" />
          </el-form-item>
          <el-button type="primary" plain @click="saveProfile">保存资料</el-button>
        </el-form>
      </div>

      <!-- 外观 -->
      <div class="yiyu-card p-card">
        <h3 class="p-title">外观</h3>
        <div class="theme-row">
          <button class="theme-opt" :class="{ active: !themeStore.isDark }" @click="themeStore.isDark = false">
            <span class="theme-preview light-pv"></span>
            <span>浅色</span>
          </button>
          <button class="theme-opt" :class="{ active: themeStore.isDark }" @click="themeStore.isDark = true">
            <span class="theme-preview dark-pv"></span>
            <span>深色</span>
          </button>
        </div>
        <p class="p-tip">深色模式下数字与图表会使用提亮配色，夜间使用更舒适。</p>
      </div>

      <!-- 修改密码 -->
      <div class="yiyu-card p-card">
        <h3 class="p-title">修改密码</h3>
        <el-form ref="pwdRef" :model="pwd" :rules="pwdRules" label-position="top">
          <el-form-item label="当前密码">
            <el-input v-model="pwd.old" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="new1">
            <el-input v-model="pwd.new1" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认新密码" prop="new2">
            <el-input v-model="pwd.new2" type="password" show-password />
          </el-form-item>
          <el-button type="primary" plain @click="savePwd">修改密码</el-button>
        </el-form>
      </div>

      <!-- 退出 -->
      <div class="yiyu-card p-card">
        <h3 class="p-title">会话</h3>
        <p class="p-tip">当前登录态保存在本地。退出后需要重新登录。</p>
        <el-button
          type="danger"
          plain
          @click="userStore.logout(); router.push('/auth/login')"
        >退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 18px; }

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(320px, 480px));
  gap: var(--gap-module);
  justify-content: start;
}

.p-card { padding: var(--gap-card); }
.p-title { font-size: var(--fs-card-title); font-weight: 600; margin-bottom: 16px; }

.avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.big-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--app-ledger), var(--app-notes));
  color: #fff;
  font-size: 22px;
  display: grid;
  place-items: center;
}
.username { font-size: 15px; font-weight: 600; display: block; }
.role-tip { font-size: var(--fs-caption); color: var(--text-secondary); }

.theme-row { display: flex; gap: 12px; margin-bottom: 12px; }
.theme-opt {
  border: 2px solid var(--border-color);
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-regular);
  transition: all var(--dur-base) ease;
}
.theme-opt.active { border-color: var(--color-primary); }
.theme-preview {
  width: 120px;
  height: 66px;
  border-radius: 7px;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}
.light-pv { background: #f7f8fa; }
.light-pv::after { content: ""; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 28px; background: #fff; border: 1px solid #ebedf0; border-radius: 4px; }
.dark-pv { background: #131417; }
.dark-pv::after { content: ""; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 28px; background: #1b1d22; border: 1px solid #2a2d34; border-radius: 4px; }

.p-tip { font-size: var(--fs-caption); color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; }

@media (max-width: 768px) {
  .profile-grid { grid-template-columns: 1fr; }
}
</style>
