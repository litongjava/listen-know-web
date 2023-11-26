<template>
<div id="app">
  <file-upload/>
</div>
</template>

<script>
import FileUpload from '../components/AudioFileUpload.vue';

export default {
  name: "UploadAudioView",
  components: {
    FileUpload
  }
};
</script>