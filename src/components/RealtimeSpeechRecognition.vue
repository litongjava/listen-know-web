<template>
<div>
  <label>
    <input type="text" :value="serverUrl" size="60"/>
  </label>
  <button @click="startRecording">Start</button>
  <button @click="pauseRecording">Pause</button>
  <button @click="resumeRecording">Resume</button>
  <button @click="recognizeRecording">Recognize</button>
  <button @click="stopRecording">Stop</button>
  <button @click="getDefaultSampleRate">getDefaultSampleRate</button>
  <label>recording:</label><span>{{recording}}</span>
  <div v-for="result in results" :key="result.id">
    {{ result }}
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
      // serverUrl: 'ws://192.168.3.7:8090/paddlespeech/streaming/save',
      startName: null,
      wsConnection: null,
      recording: false,
      results: [],
      processor: null,
      source: null,
      stream: null,
      inputSampleRate: null,
      outputSampleRate: 16000,
    };
  },
  methods: {
    getDefaultSampleRate() {
      // 创建一个新的 AudioContext 实例
      let audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // 打印 AudioContext 的采样率
      console.log("Sample rate:", audioContext.sampleRate);
    },
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
          "name": this.startName + ".wav",
          "signal": "start",
          "nbest": 1
        }));
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
      navigator.mediaDevices.getUserMedia({audio: true})
        .then(stream => {
          // 使用原始音频流的采样率创建 AudioContext
          let audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.inputSampleRate = audioContext.sampleRate;
          this.source = audioContext.createMediaStreamSource(stream);
          this.stream = stream;

          // 创建 ScriptProcessorNode 用于处理音频数据
          this.processor = audioContext.createScriptProcessor(4096, 1, 1);
          this.source.connect(this.processor);
          this.processor.connect(audioContext.destination);
          this.recording = true;
          this.processor.onaudioprocess = (e) => {
            // 获取输入缓冲区的音频数据
            if (this.recording) {
              this.sendAudioData(this.processAudioBuffer(e.inputBuffer))
            }

          };
        })
        .catch(error => {
          console.error('Error accessing audio devices:', error);
        });
    },

    processAudioBuffer(audioBuffer) {
      // console.log("audioBuffer", audioBuffer);
      //假设 AudioBuffer 是单声道
      const rawData = audioBuffer.getChannelData(0);
      // console.log("rawData:", rawData);
      //修改频率
      const compression = parseInt(this.inputSampleRate / this.outputSampleRate);
      const length = rawData.length / compression;
      const pcm16kf32 = new Float32Array(length);
      let index = 0, j = 0;
      while (index < length) {
        pcm16kf32[index] = rawData[j];
        j += compression;
        index++;
      }
      // console.log(pcm16kf32);
      // 修改位深度
      let pcm16ki16 = new Int16Array(length);

      for (let i = 0; i < length; i++) {
        const f32 = Math.max(-1, Math.min(1, pcm16kf32[i]));
        pcm16ki16[i] = f32 < 0 ? f32 * 0x8000 : f32 * 0x7FFF;
      }
      // console.log("pcm16ki16:", pcm16ki16);
      return pcm16ki16;
    },

    // 将音频数据发送到 WebSocket 服务器
    sendAudioData(audioData) {
      if (this.wsConnection.readyState === 1) {
        // console.log("send data:", audioData);
        // console.log("wsConnection", this.wsConnection);
        if (this.wsConnection.readyState === 1) {
          this.wsConnection.send(audioData);
        }
      } else {
        console.log("websocket not opened")
      }

    },

    handleServerResponse(response) {

      if ("ok" === response.status) {
        if ("server_ready" === response.signal) {
          // 开始录音
          this.startAudioRecording();
        } else if (response.result) {
          for (let i = 0; i < response.result.length; i++) {
            let sentence = response.result[i];
            this.results.push(sentence.t0 + "--" + sentence.t1 + ":" + sentence.sentence);
          }

        }
      } else if ("end" === response.signal) {
        for (let i = 0; i < response.result.length; i++) {
          let sentence = response.result[i];
          this.results.push(sentence.t0 + "--" + sentence.t1 + ":" + sentence.sentence);
        }
        // 关闭 WebSocket 连接
        this.wsConnection.close();
        this.wsConnection = null;
      } else {
        console.log("response:", response);
      }


    },
    pauseRecording() {
      this.recording = false;
    },
    resumeRecording() {
      this.recording = true;
    },
    recognizeRecording() {
      if (this.wsConnection.readyState === 1) {
        // 发送结束信号到 WebSocket 服务器
        this.wsConnection.send(JSON.stringify({
          "name": this.startName + ".wav",
          "signal": "recognize",
        }));
      }
    },

    stopRecording() {
      this.recording = false;
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      if (this.wsConnection.readyState === 1) {
        // 发送结束信号到 WebSocket 服务器
        this.wsConnection.send(JSON.stringify({
          "name": this.startName + ".wav",
          "signal": "end",
          "nbest": 1
        }));
      }
    }
  }
}
</script>

<style scoped>

</style>