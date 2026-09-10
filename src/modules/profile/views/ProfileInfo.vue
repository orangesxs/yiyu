<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useProfileStore } from '../stores/profile'
import { mockToday } from '@/shared/types/common'
import { avatarOptions } from '../types'
import type { Gender } from '../types'

const profileStore = useProfileStore()

/* 已加入天数:从档案 joinedAt 到 mock 基准日(含首尾) */
const joinedDays = computed(() => {
  const start = new Date(profileStore.profile.joinedAt + 'T00:00:00')
  return Math.max(1, Math.floor((mockToday.getTime() - start.getTime()) / 86400000) + 1)
})

/* 编辑表单(头像宫格 + 各字段),保存写回 store */
const form = reactive({
  nickname: profileStore.profile.nickname,
  avatar: profileStore.profile.avatar,
  bio: profileStore.profile.bio,
  gender: profileStore.profile.gender as Gender,
  birthday: profileStore.profile.birthday || null,
  region: profileStore.profile.region,
})

function saveProfile() {
  if (!form.nickname.trim()) return ElMessage.warning('昵称不能为空')
  profileStore.updateProfile({
    nickname: form.nickname.trim(),
    avatar: form.avatar,
    bio: form.bio.trim(),
    gender: form.gender,
    birthday: form.birthday ?? '',
    region: form.region.trim(),
  })
  ElMessage.success('资料已更新')
}

/* 修改密码(mock:仅提示) */
const pwd = reactive({ old: '', new1: '', new2: '' })
const pwdRef = ref<FormInstance>()
const pwdRules: FormRules = {
  new1: [{ min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  new2: [
    {
      validator: (_r, v: string, cb: (err?: Error) => void) => (v === pwd.new1 ? cb() : cb(new Error('两次输入不一致'))),
      trigger: 'blur',
    },
  ],
}
function savePwd() {
  pwdRef.value?.validate((ok) => {
    if (!ok) return
    ElMessage.success('密码已修改')
    pwd.old = pwd.new1 = pwd.new2 = ''
  })
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">基本信息</h2>
        <p class="page-sub">我是谁,与谁同行</p>
      </div>
    </div>

    <!-- 名片头卡 -->
    <div class="yiyu-card head-card">
      <span class="big-avatar">{{ profileStore.profile.avatar }}</span>
      <div class="head-info">
        <span class="nickname">{{ profileStore.profile.nickname }}</span>
        <span class="bio">{{ profileStore.profile.bio || '还没有签名' }}</span>
      </div>
      <div class="head-stats num">
        <div class="stat"><span class="v">{{ joinedDays }}</span><span class="k">已加入/天</span></div>
      </div>
    </div>

    <div class="info-grid">
      <!-- 资料编辑 -->
      <div class="yiyu-card edit-card">
        <h3 class="card-title">资料编辑</h3>
        <el-form label-position="top">
          <el-form-item label="头像">
            <div class="avatar-row">
              <button
                v-for="a in avatarOptions"
                :key="a"
                type="button"
                class="avatar-pick"
                :class="{ active: form.avatar === a }"
                @click="form.avatar = a"
              >{{ a }}</button>
            </div>
          </el-form-item>
          <el-form-item label="昵称" required>
            <el-input v-model="form.nickname" maxlength="12" show-word-limit placeholder="全站展示名" />
          </el-form-item>
          <el-form-item label="个性签名">
            <el-input v-model="form.bio" type="textarea" :rows="2" maxlength="30" show-word-limit placeholder="一句话介绍自己(可选)" />
          </el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="form.gender">
              <el-radio-button value="secret">保密</el-radio-button>
              <el-radio-button value="male">男</el-radio-button>
              <el-radio-button value="female">女</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="生日">
            <el-date-picker
              v-model="form.birthday"
              type="date"
              placeholder="选择日期(可选)"
              value-format="YYYY-MM-DD"
              clearable
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="所在地区">
            <el-input v-model="form.region" maxlength="20" placeholder="如:四川·成都(可选)" />
          </el-form-item>
          <el-button type="primary" plain @click="saveProfile">保存资料</el-button>
        </el-form>
      </div>

      <!-- 账号只读 + 修改密码 -->
      <div class="col-stack">
        <div class="yiyu-card readonly-card">
          <h3 class="card-title">账号信息</h3>
          <div class="ro-row">
            <span class="ro-label">用户名</span>
            <span class="ro-value num">{{ profileStore.profile.username }}</span>
          </div>
          <div class="ro-row">
            <span class="ro-label">用户 ID</span>
            <span class="ro-value num">{{ profileStore.profile.id }}</span>
          </div>
          <p class="ro-tip">注册后不可修改</p>
        </div>

        <div class="yiyu-card pwd-card">
          <h3 class="card-title">修改密码</h3>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.head-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: var(--gap-card);
  margin-bottom: var(--gap-module);
}

.big-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--app-ledger), var(--app-admin));
  font-size: 26px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.head-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.nickname { font-size: 16px; font-weight: 600; }
.bio { font-size: var(--fs-caption); color: var(--text-secondary); }

.head-stats { display: flex; gap: 28px; margin-left: auto; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat .v { font-size: 19px; font-weight: 600; }
.stat .k { font-size: var(--fs-caption); color: var(--text-secondary); }

.info-grid {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(260px, 360px);
  gap: var(--gap-module);
  align-items: start;
}

.col-stack { display: flex; flex-direction: column; gap: var(--gap-module); }
.edit-card, .readonly-card, .pwd-card { padding: var(--gap-card); }
.card-title { font-size: var(--fs-card-title); font-weight: 600; margin-bottom: 16px; }

.avatar-row { display: flex; gap: 8px; flex-wrap: wrap; }
.avatar-pick {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  font-size: 20px;
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.avatar-pick:hover { border-color: var(--card-border-on-hover); }
.avatar-pick.active {
  border: 2px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.ro-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color);
}
.ro-label { color: var(--text-secondary); font-size: 13px; }
.ro-value { font-size: 13px; color: var(--text-regular); }
.ro-tip { margin-top: 10px; font-size: var(--fs-caption); color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .head-stats { display: none; }
}
</style>
