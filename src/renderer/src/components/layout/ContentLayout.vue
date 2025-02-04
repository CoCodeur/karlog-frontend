<template>
  <div class="content-layout">
    <slot></slot>
  </div>
</template>

<style scoped>
.content-layout {
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (max-width: 40rem) {
  .content-layout {
    padding: 0 1rem;
    gap: 1rem;
  }
}
</style> 