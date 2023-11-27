<template>
<div>
  <audio ref="audio" controls></audio>
  <input type="button" value="录音" @click="startRecording"/>
  <input type="button" value="暂停" @click="pauseRecording"/>
  <input type="button" value="继续" @click="resumeRecording"/>
  <input type="button" value="停止" @click="stopRecording"/>
  <input type="button" value="连接" @click="linkRecording"/>
  <input type="button" value="保存" @click="saveRecording"/>
  <input type="button" value="上传" @click="uploadRecording"/>
  <div ref="text"></div>
</div>
</template>

<script>
import WebAudioRecorder from '../utils/WebAudioRecorder'
import axios from 'axios';

export default {
  name: "Recorder",
  data() {
    return {
      recorder: null
    };
  },
  methods: {
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
        formData.append('file', blob, 'recording.wav');

        axios.post("audio/save/", formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
          .then(response => {
            console.log('上传成功', response.data);
          })
          .catch(error => {
            console.error('上传失败', error);
          });
      }
    }
  }
};
</script>