<template>
<div>
  <input type="text" :value="serverUrl" size="40">
  <input type="file" @change="onFileChange"/>
  <input type="text" :value="audioFormat" size="10">
  <button @click="uploadFile">上传文件</button>
  <audio ref="audio" controls></audio>
  <input type="button" value="录音" @click="startRecording"/>
  <input type="button" value="暂停" @click="pauseRecording"/>
  <input type="button" value="继续" @click="resumeRecording"/>
  <input type="button" value="停止" @click="stopRecording"/>
  <input type="button" value="连接" @click="linkRecording"/>
  <input type="button" value="保存" @click="saveRecording"/>
  <input type="button" value="上传" @click="uploadRecording"/>
  <br/>
  <textarea :value="audio_text" cols="200" rows="80"/>

</div>
</template>

<script>
import axios from 'axios';
import WebAudioRecorder from '../utils/WebAudioRecorder'

export default {
  name: "AudioFileUpload",
  data() {
    return {
      serverUrl: 'http://192.168.3.7:8080/inference',
      audioFormat: 'wav',
      selectedFile: null,
      audio_text: "",
      recorder: null,
    };
  },
  methods: {
    onFileChange(e) {
      this.selectedFile = e.target.files[0];
    },
    uploadInference: function (blob, audioFormat) {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('temperature', '0.2');
      formData.append('response-format', 'json');
      formData.append('audio_format', audioFormat);

      axios.post(this.serverUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => {
        if (response.data.code > 0) {
          let sentences = response.data.data;
          debugger;
          for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i].t0 + "-" + sentences[i].t1 + ":" + sentences[i].sentence;
            this.audio_text += (sentence + "\n");
          }

        }

      }).catch(error => {
        console.error(error);
      });
    },
    uploadFile() {
      this.uploadInference(this.selectedFile, this.audioFormat);
    },
    startRecording() {
      WebAudioRecorder.get(rec => {
        this.recorder = rec;
        this.recorder.start();
      });
    },
    pauseRecording() {
      if (this.recorder) {
        this.recorder.pause();
      }
    },
    resumeRecording() {
      if (this.recorder) {
        this.recorder.resume();
      }
    },
    stopRecording() {
      if (this.recorder) {
        this.recorder.stop();
      }
    },
    linkRecording() {
      if (this.recorder) {
        this.recorder.link(this.$refs.audio);
      }
    },
    saveRecording() {
      if (this.recorder) {
        this.recorder.save();
      }
    },
    uploadRecording() {
      if (this.recorder) {
        const formData = new FormData();
        const blob = this.recorder.getBlob();
        this.uploadInference(blob, "wav");
      }
    }
  }
}
</script>
