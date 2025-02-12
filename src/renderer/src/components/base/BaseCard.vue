<template>
  <div class="base-card" :class="classes">
    <div class="card-header" v-if="$slots.header || title || icon">
      <div class="icon-wrapper" v-if="icon">
        <i :class="['fas', icon]"></i>
      </div>
      <h2 v-if="title" class="card-title">{{ title }}</h2>
      <slot name="header"></slot>
    </div>
    
    <div class="card-content">
      <slot></slot>
    </div>

    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  icon?: string
  classes?: string | string[] | Record<string, boolean>
}>()
</script>

<style scoped>
.base-card {
  background: var(--bg-overlay-light);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  flex-shrink: 0;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-sm);
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.icon-wrapper i {
  font-size: var(--font-size-md);
  color: var(--color-primary);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 0;
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--text-primary) 30%,
    var(--color-primary) 50%,
    var(--text-primary) 70%,
    var(--text-primary) 100%
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shine 4s linear infinite;
  letter-spacing: -0.02em;
}

.card-content {
  padding: var(--spacing-lg);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-footer {
  padding: var(--spacing-lg);
  flex-shrink: 0;
}

@keyframes shine {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

@media (max-width: var(--breakpoint-sm)) {
  .card-header,
  .card-content,
  .card-footer {
    padding: var(--spacing-md);
  }

  .card-title {
    font-size: var(--font-size-lg);
  }
}
</style> 