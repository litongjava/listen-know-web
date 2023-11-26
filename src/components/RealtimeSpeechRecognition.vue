<template>
<div>
  <input type="text" :value="serverUrl" size="60">
  <button @click="startRecording">开始</button>
  <button @click="stopRecording">结束</button>
  <div v-for="result in results" :key="result.id">
    {{ result.sentence }}
  </div>

  <br/>

</div>
</template>

<script>
export default {
  name: "RealtimeSpeechRecognition",
  data() {
    return {
      serverUrl: 'ws://192.168.3.7:8090/paddlespeech/asr/streaming',
      startName: null,
      wsConnection: null,
      recording: false,
      results: []
    };
  },
  methods: {
    async startRecording() {
      // 初始化结果数组
      this.results = [];

      // 建立 WebSocket 连接
      this.wsConnection = new WebSocket(this.serverUrl);

      // WebSocket 连接打开时的处理
      this.wsConnection.onopen = () => {
        // 发送开始信号
        this.startName = Date.now();
        this.wsConnection.send(JSON.stringify({
          "name": startName + ".wav",
          "signal": "start",
          "nbest": 1
        }));

        // 开始录音
        this.startAudioRecording();
      };

      // 接收 WebSocket 服务器的响应
      this.wsConnection.onmessage = (event) => {
        let response = JSON.parse(event.data);
        // 处理服务器返回的数据
        this.handleServerResponse(response);
      };

      // 错误处理
      this.wsConnection.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };
    },

    startAudioRecording() {
      // 使用适当的录音库初始化录音
      navigator.mediaDevices.getUserMedia({audio: true})
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();

          mediaRecorder.ondataavailable = async (e) => {
            // 处理音频数据，将其发送到 WebSocket 服务器
            this.sendAudioData(e.data);
          };

          this.recording = mediaRecorder; // 保存录音对象以便后续操作
        })
        .catch(error => {
          console.error('Error accessing audio devices:', error);
        });
    },

    sendAudioData(audioData) {
      // 将音频数据发送到 WebSocket 服务器
      // 注意：您可能需要将音频数据转换为适当的格式
      this.wsConnection.send(audioData);
    },

    handleServerResponse(response) {
      // 根据服务器的响应更新 UI
      if (response.result) {
        this.results.push(response.result);
      }
    },
    stopRecording() {
      if (this.recording) {
        // 停止录音
        this.recording.stop();
        this.recording.stream.getTracks().forEach(track => track.stop()); // 关闭所有的媒体流轨道
        this.recording = null; // 清除录音对象
      }

      if (this.wsConnection) {
        // 发送结束信号到 WebSocket 服务器
        this.wsConnection.send(JSON.stringify({
          "name": this.startName + ".wav",
          "signal": "end",
          "nbest": 1
        }));

        // 关闭 WebSocket 连接
        this.wsConnection.close();
        this.wsConnection = null;
      }
    },
  }
}
</script>

<style scoped>

</style>