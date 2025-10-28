<script setup>
import { ref } from 'vue'
defineProps(['texto'])
const count = ref(0)
</script>

<template>
  <button @click="count++">{{texto}} {{ count }}</button>
</template>