<template>
<div>
  <input type="text" :value="serverUrl" size="60">
  <button @click="startRecording">开始</button>
  <button @click="stopRecording">结束</button>
  <input type="button" value="继续" @click="resumeRecording"/>
  <input type="button" value="播放" @click="playRecording"/>
  <input type="button" value="保存" @click="saveRecording"/>
  <button @click="getDefaultSampleRate">getDefaultSampleRate</button>
  <br/>
  <audio ref="audio" controls></audio>
  <canvas id="recordCanvas" ref="record" style="border: 1px solid gray"></canvas>
  <div v-for="result in results" :key="result.id">
    {{ result.sentence }}
  </div>

  <br/>

</div>
</template>

<script>
import Recorder from 'js-audio-recorder';

export default {
  name: "RealtimeSpeechSave",
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
      inputSampleRate: null,
      outputSampleRate: 16000,
      recorder: null,
      audioBlob: null,
      drawRecordId: null,
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

    async startAudioRecording() {
      this.recorder = new Recorder({
        sampleBits: 16,
        sampleRate: 16000,
        numChannels: 1,
        compiling: true
      });

      try {
        // await this.recorder.getPermission();
        await this.recorder.start();
        this.drawRecord();
        let that = this;
        this.recorder.onprogress = function (params) {
          // console.log('录音时长(秒)', params.duration);
          // console.log('录音大小(字节)', params.fileSize);
          // console.log('录音音量百分比(%)', params.vol);
          // console.log('当前录音的总数据([DataView, DataView...])', params.data);
          that.sendAudioData(that.recorder.getNextData());
        }
      } catch (error) {
        console.error('录音启动失败:', error);
      }
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


    // 将音频数据发送到 WebSocket 服务器
    sendAudioData(dataViewArray) {
      let length = dataViewArray.length;
      if (this.wsConnection.readyState === 1) {
        for (let i = 0; i < length; i++) {
          console.log("send data:", dataViewArray[i]);
          console.log("wsConnection", this.wsConnection);
          if (this.wsConnection.readyState === 1) {
            this.wsConnection.send(dataViewArray[i]);
          }
        }
      } else {
        console.log("websocket not opened")
      }
      // console.log("length",);
      // console.log("buffer", dataView[0].buffer);
      // console.log("length", dataView[0].buffer.size);
      // console.log(dataView);
      // console.log(typeof dataView); // 输出dataView的数据类型
      //
      // // 获取dataView对象原型上的所有属性和方法
      // const proto = Object.getPrototypeOf(dataView);
      // console.log(proto);
      //
      // // 或者获取dataView对象的构造函数的名称
      // console.log(dataView.constructor.name);
      //
      // // 列出dataView对象原型上的所有方法
      // const methods = Object.getOwnPropertyNames(proto).filter(prop => typeof proto[prop] === 'function');
      // console.log(methods);


    },

    async stopRecording() {
      if (this.recorder) {
        await this.recorder.stop();
        this.audioBlob = await this.recorder.getWAVBlob();
        this.drawRecordId && cancelAnimationFrame(this.drawRecordId);
        this.drawRecordId = null;
      }

      if (this.wsConnection.readyState === 1) {
        // 发送结束信号到 WebSocket 服务器
        this.wsConnection.send(JSON.stringify({
          "name": this.startName + ".wav",
          "signal": "end",
          "nbest": 1
        }));
      }
    },
    playRecording() {
      if (this.audioBlob) {
        this.$refs.audio.src = URL.createObjectURL(this.audioBlob);
        this.$refs.audio.play();
        this.drawPlay();
      }
    },
    saveRecording() {
      if (this.audioBlob) {
        const a = document.createElement("a");
        document.body.appendChild(a);
        const url = URL.createObjectURL(this.audioBlob);
        a.href = url;
        a.download = 'recording.wav';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
    drawRecord() {
      this.drawRecordId = requestAnimationFrame(this.drawRecord);
      this.drawWave({
        canvas: this.$refs.record,
        dataArray: this.recorder.getRecordAnalyseData(),
      });
    },
    drawWave({canvas, dataArray}) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布

      // 设置绘制属性
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#409EFF';
      ctx.beginPath();

      const sliceWidth = canvas.width / dataArray.length; // 每个数据点的宽度
      let x = 0; // 当前绘制位置的 x 坐标

      for (let i = 0; i < dataArray.length; i++) {
        // 将数据点转换为 y 轴上的位置
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          // 移动到第一个点
          ctx.moveTo(x, y);
        } else {
          // 连接到下一个点
          ctx.lineTo(x, y);
        }

        x += sliceWidth; // 移动到下一个数据点的位置
      }

      ctx.lineTo(canvas.width, canvas.height / 2); // 绘制到最后一个点
      ctx.stroke(); // 完成波形绘制
    },
    handleServerResponse(response) {
      if ("ok" === response.status) {
        if ("server_ready" === response.signal) {
          // 开始录音
          this.startAudioRecording();
        } else if (response.result) {

        }
      } else if ("end" === response.signal) {
        // 关闭 WebSocket 连接
        this.wsConnection.close();
        this.wsConnection = null;
      } else {
        console.log("response:", response);
      }
    },

  }
}
</script>

<style scoped>

</style>