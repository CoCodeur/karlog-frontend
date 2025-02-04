<template>
  <div class="cards-wrapper">
    <div class="cards-container">
      <div class="cards-grid" :class="gridClasses">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    columns?: number
    gap?: 'sm' | 'md' | 'lg'
  }>(),
  {
    columns: 3,
    gap: 'lg'
  }
)

const gridClasses = computed(() => ({
  [`gap-${props.gap}`]: true,
  [`columns-${props.columns}`]: true
}))
</script>

<style scoped>
.cards-wrapper {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.cards-container {
  width: 100%;
}

.cards-grid {
  display: grid;
  width: 100%;
  margin: 0 auto;
}

.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }

.columns-1 { grid-template-columns: 1fr; }
.columns-2 { grid-template-columns: repeat(2, 1fr); }
.columns-3 { grid-template-columns: repeat(3, 1fr); }
.columns-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: var(--breakpoint-lg)) {
  .columns-3 { grid-template-columns: repeat(2, 1fr); }
  .columns-4 { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: var(--breakpoint-md)) {
  .columns-2, .columns-3, .columns-4 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: var(--breakpoint-sm)) {
  .cards-grid {
    grid-template-columns: 1fr !important;
  }
}
</style> 