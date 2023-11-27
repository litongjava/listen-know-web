<template>
<div>
  <input type="text" :value="serverUrl" size="60">
  <button @click="startRecording">开始</button>
  <button @click="stopRecording">结束</button>
  <button @click="getDefaultAudioContextParas">getDefaultAudioContextParas</button>
  <div v-for="result in results" :key="result.id">
    {{ result.sentence }}
  </div>

  <br/>

</div>
</template>

<script>
export default {
  name: "AudioSave",
  data() {
    return {
      //serverUrl: 'ws://192.168.3.7:8090/paddlespeech/asr/streaming',
      serverUrl: 'ws://192.168.3.7:8090/paddlespeech/streaming/save',
      startName: null,
      wsConnection: null,
      recording: false,
      results: [],
      processor: null,
      source: null,
      stream: null,
      sampleRate: null,
      bitsPerSample: 32,
      channels: 1,
      audioSamples: [],
    };
  },
  methods: {
    getDefaultAudioContextParas() {
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
        if (!this.sampleRate) {
          let audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.sampleRate = audioContext.sampleRate;
        }

        this.wsConnection.send(JSON.stringify({
          "name": this.startName + ".wav",
          "sampleRate": this.sampleRate,
          "bitsPerSample": this.bitsPerSample,
          "signal": "start",
          "nbest": 1,

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
      let audioSamples = [];
      navigator.mediaDevices.getUserMedia({audio: true})
        .then(stream => {
          let audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.source = audioContext.createMediaStreamSource(stream);
          this.stream = stream;
          this.processor = audioContext.createScriptProcessor(4096, this.channels, this.channels);

          this.source.connect(this.processor);
          this.processor.connect(audioContext.destination);

          this.processor.onaudioprocess = (e) => {
            let inputData = e.inputBuffer.getChannelData(0);
            // 处理 inputData 并实时发送
            // this.sendAudioData(inputData);
            this.audioSamples = this.audioSamples.concat(Array.from(inputData));
          };
        })
        .catch(error => {
          console.error('Error accessing audio devices:', error);
        });
    },

    // 将音频数据发送到 WebSocket 服务器
    sendAudioData(audioData) {
      if (this.wsConnection.readyState === 1) {
        console.log("send data:", audioData);
        console.log("wsConnection", this.wsConnection);
        if (this.wsConnection.readyState === 1) {
          this.wsConnection.send(audioData);
        }
      } else {
        console.log("websocket not opened")
      }

    },

    handleServerResponse(response) {
      if (response.status === "ok" && response.signal === "server_ready") {
        // 开始录音
        this.startAudioRecording();
      }

      // 根据服务器的响应更新 UI
      // if (response.result) {
      //   this.results.push(response.result);
      // }
    },
    stopRecording() {
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

        // 关闭 WebSocket 连接
        this.wsConnection.close();
        this.wsConnection = null;
      }
    },

    floatTo16BitPCM(output, offset, input) {
      for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    },
    writeWAV(audioSamples, sampleRate) {
      let numSamples = audioSamples.length;
      let buffer = new ArrayBuffer(44 + numSamples * 2); // 16-bit PCM
      let view = new DataView(buffer);

      writeWAVHeader(view, sampleRate, numSamples, 1, 16); // Mono channel, 16-bit samples

      // Convert and write audio samples...
      floatTo16BitPCM(view, 44, audioSamples);

      return buffer;
    },


    writeWAVHeader(view, sampleRate, numSamples, numChannels, bitsPerSample) {
      // RIFF header
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + numSamples * numChannels * bitsPerSample / 8, true); // File size
      view.setUint32(8, 0x57415645, false); // "WAVE"

      // fmt subchunk
      view.setUint32(12, 0x666D7420, false); // "fmt "
      view.setUint32(16, 16, true); // Subchunk1 size (16 for PCM)
      view.setUint16(20, 1, true); // Audio format (1 for PCM)
      view.setUint16(22, numChannels, true); // Num channels
      view.setUint32(24, sampleRate, true); // Sample rate
      view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // Byte rate
      view.setUint16(32, numChannels * bitsPerSample / 8, true); // Block align
      view.setUint16(34, bitsPerSample, true); // Bits per sample

      // data subchunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, numSamples * numChannels * bitsPerSample / 8, true); // Subchunk2 size
    },

  }
}
</script>

<style scoped>

</style>