<template>
  <div class="flex flex-row my-2">
    <label
      class="
        border border-blue-500
        bg-blue-500
        text-white
        hover:text-blue-500
        hover:bg-transparent
        rounded-lg
        cursor-pointer
        p-3
        mr-2
        transition
      "
    >
      Select a File
      <input class="hidden" type="file" @change="handleFileChange" />
    </label>
    <div class="flex flex-col" v-if="file">
      <div class="font-bold text-lg">{{ file.name }}</div>
      <div class="">{{ fileSize }}</div>
    </div>
    <div v-else>None Selected</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import filesize from "filesize";

export default defineComponent({
  data: () => ({
    file: undefined as File | undefined,
  }),
  computed: {
    fileSize(): string {
      return this.file ? filesize(this.file.size) : "Uknown Size";
    },
  },
  methods: {
    handleFileChange(evt: Event) {
      evt.stopPropagation();
      const { files } = evt.target as HTMLInputElement;
      this.file = files?.[0];
      console.log(this.file);
      this.$emit("change", this.file);
    },
  },
});
</script>