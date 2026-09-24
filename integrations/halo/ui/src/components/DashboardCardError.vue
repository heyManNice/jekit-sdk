<script setup lang="ts">
import IconErrorWarningLine from '~icons/ri/error-warning-line'
</script>

<template>
  <div class="card-error-state" role="alert">
    <IconErrorWarningLine aria-hidden="true" />
    <strong>读取失败</strong>
    <span>暂时无法读取数据，请稍后重试。</span>
  </div>
</template>
