<template>
<div id="app">
  <file-upload/>
</div>
</template>

<script>
import FileUpload from '../components/RecordAudio.vue';

export default {
  name: "UploadAudioView",
  components: {
    FileUpload
  }
};
</script>
