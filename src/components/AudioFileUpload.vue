<template>
<div>
  <input type="text" :value="serverUrl" size="40">
  <input type="file" @change="onFileChange"/>
  <input type="text" :value="audio_format" size="10">
  <button @click="uploadFile">上传文件</button>
  <br/>
  <textarea :value="audio_text" cols="200" rows="80"/>

</div>
</template>

<script>
import axios from 'axios';

export default {
  name: "AudioFileUpload",
  data() {
    return {
      serverUrl: 'http://192.168.3.7:8080/inference',
      audio_format: 'wav',
      selectedFile: null,
      audio_text: "",
    };
  },
  methods: {
    onFileChange(e) {
      this.selectedFile = e.target.files[0];
    },
    uploadFile() {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('temperature', '0.2');
      formData.append('response-format', 'json');
      formData.append('audio_format', this.wav);

      axios.post(this.serverUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(response => {
          if (response.data.code) {
            let sentences = response.data.data;
            debugger;
            for (let i = 0; i < sentences.length; i++) {
              let sentence = sentences[i].t0 + "-" + sentences[i].t1 + ":" + sentences[i].sentence;
              this.audio_text += (sentence + "\n");
            }

          }

        })
        .catch(error => {
          console.error(error);
        });
    }
  }
}
</script>
