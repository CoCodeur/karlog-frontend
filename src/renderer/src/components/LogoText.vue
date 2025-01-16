<template>
  <h1 class="logo-text">Karlog</h1>
</template>

<script setup lang="ts">
// Le composant est vide car il n'a pas besoin de logique pour le moment
</script>

<style scoped>
@keyframes shine {
  to {
    background-position: 200% center;
  }
}

.logo-text {
  font-size: 42px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(
    120deg,
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
}
</style>
