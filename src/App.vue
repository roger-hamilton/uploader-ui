<template>
  <div class="m-10">
    <mpu-uploader />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MpuUploader from "./components/MpuUploader.vue";

export default defineComponent({
  name: "App",
  components: { MpuUploader },
});
</script>