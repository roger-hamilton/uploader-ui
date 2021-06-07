<template>
  <div class="relative pt-1">
    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
      <div
        :style="{ width: `${percent}%` }"
        class="
          shadow-none
          flex flex-col
          text-center
          whitespace-nowrap
          text-white
          justify-center
          bg-green-500
        "
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    percent: {
      type: Number,
      required: true,
    },
  },
});
</script>
