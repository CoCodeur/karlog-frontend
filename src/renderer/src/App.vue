<script setup lang="ts">
import LoginPage from './components/LoginPage.vue'
import StatusBar from './components/StatusBar.vue'
</script>

<template>
  <div class="app-container">
    <LoginPage />
    <StatusBar />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background: var(--background);
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif;
}

.app-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 2rem calc(2rem + 32px);
}
</style>
