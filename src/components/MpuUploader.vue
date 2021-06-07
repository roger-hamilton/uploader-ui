<template>
  <div class="m-10">
    <file-picker @change="setFile" />
    <template v-if="file">
      <button
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
        :disabled="uploading"
        @click="handleUpload"
      >
        Upload
      </button>
      <progress-bar
        :percent="
          overallProgress
            ? (100 * overallProgress.loaded) / overallProgress.total
            : 0
        "
      />
      <div class="flex flex-row flex-wrap">
        <div
          class="w-full lg:w-1/2 xl:w-1/4 p-3"
          v-for="(progress, i) in progress"
          :key="i"
        >
          <div class="font-bold">Chunk #{{ i + 1 }}</div>
          <progress-bar :percent="(100 * progress.loaded) / progress.total" />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import axios from "axios";
import FilePicker from "./FilePicker.vue";
import { asyncQueue } from "../asyncQueue";
import ProgressBar from "./ProgressBar.vue";

const UPLOADER_HOST = (import.meta.env.UPLOADER_HOST ??
  "https://localhost:5001") as string;

const uploadClient = axios.create({
  baseURL: UPLOADER_HOST,
});

interface CreateUploadResponse {
  uploadId: string;
  partUrls: string[];
  completeUrl: string;
  abortUrl: string;
  minimumChunkSize: number;
}

interface CompletedUpload {
  bucketName: string;
  key: string;
}

interface UploadItem {
  url: string;
  index: number;
  data: Blob;
}

// remove default header since it interferes with signed urls
delete uploadClient.defaults.headers.put["Content-Type"];

interface Progress {
  loaded: number;
  total: number;
}

export default defineComponent({
  components: { FilePicker, ProgressBar },
  data: () => ({
    file: undefined as File | undefined,
    uploading: false,
    progress: [] as Progress[],
    result: undefined as CompletedUpload | undefined,
  }),
  computed: {
    overallProgress(): Progress {
      return this.progress.length
        ? this.progress.reduce(({ loaded, total }, progress) => ({
            loaded: loaded + progress.loaded,
            total: total + progress.total,
          }))
        : { loaded: 0, total: 100 };
    },
  },

  methods: {
    setFile(file: File) {
      console.log(file);
      this.file = file;
    },
    async handleUpload() {
      if (!this.file) throw new Error("Upload Initiated without file");
      if (this.uploading) return;
      try {
        this.uploading = true;
        const upload = await this.createUpload(this.file);
        try {
          const etags = await this.uploadParts(this.file, upload);

          this.result = await this.completeUpload(
            upload.completeUrl,
            this.file.name,
            etags
          );
        } catch (err) {
          await uploadClient.delete(upload.abortUrl);
        }
      } finally {
        this.uploading = false;
      }
    },
    async createUpload(file: File): Promise<CreateUploadResponse> {
      console.dir(file);
      const res = await uploadClient.post<CreateUploadResponse>("/uploads", {
        name: file.name,
        fileSize: file.size,
      });
      return res.data;
    },
    async uploadParts(
      file: File,
      { partUrls, minimumChunkSize: partSize }: CreateUploadResponse
    ) {
      const dataForIndex = (index: number) =>
        file.slice(partSize * index, partSize * (index + 1));
      const parts: UploadItem[] = partUrls.map((url, index) => ({
        url,
        index,
        data: dataForIndex(index),
      }));

      this.progress = parts.map(({ data }) => ({
        loaded: 0,
        total: data.size,
      }));

      return await asyncQueue(this.uploadSinglePart, parts, 5);
    },
    async uploadSinglePart(item: UploadItem): Promise<string> {
      const res = await uploadClient.put(item.url, item.data, {
        onUploadProgress: ({ loaded, total }) => {
          this.progress[item.index].loaded = loaded;
          this.progress[item.index].total = total;
        },
      });
      this.progress[item.index].loaded = this.progress[item.index].total;
      return res.headers.etag;
    },
    async completeUpload(
      url: string,
      name: string,
      etags: string[]
    ): Promise<CompletedUpload> {
      const res = await uploadClient.post<CompletedUpload>(url, {
        name,
        etags,
      });

      return res.data;
    },
  },
});
</script>
