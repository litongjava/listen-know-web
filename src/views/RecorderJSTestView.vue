<template>
<div>
  <input type="button" value="录音" @click="startRecording"/>
  <input type="button" value="暂停" @click="pauseRecording"/>
  <input type="button" value="继续" @click="resumeRecording"/>
  <input type="button" value="停止" @click="stopRecording"/>
  <input type="button" value="播放" @click="playRecording"/>
  <input type="button" value="保存" @click="saveRecording"/>
  <input type="button" value="上传" @click="uploadRecording"/>
  <br/>
  <audio ref="audio" controls></audio>
  <br/>
  <canvas id="recordCanvas" ref="record" style="border: 1px solid gray"></canvas>
  <canvas id="playCanvas" ref="play" style="border: 1px solid gray"></canvas>
</div>
</template>

<script>
import Recorder from 'js-audio-recorder';

export default {
  name: "RecorderJSTestView",
  data() {
    return {
      recorder: null,
      audioBlob: null,
      drawRecordId: null,
      drawPlayId: null
    };
  },

  methods: {
    async startRecording() {
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
        this.recorder.onprogress = function (params) {
          console.log('录音时长(秒)', params.duration);
          console.log('录音大小(字节)', params.fileSize);
          console.log('录音音量百分比(%)', params.vol);
          console.log('当前录音的总数据([DataView, DataView...])', params.data);
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

    async stopRecording() {
      if (this.recorder) {
        await this.recorder.stop();
        this.audioBlob = await this.recorder.getWAVBlob();
        this.drawRecordId && cancelAnimationFrame(this.drawRecordId);
        this.drawRecordId = null;
      }
    },

    playRecording() {
      if (this.audioBlob) {
        const audioURL = URL.createObjectURL(this.audioBlob);
        this.$refs.audio.src = audioURL;
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

    uploadRecording() {
      if (this.audioBlob) {
        const formData = new FormData();
        formData.append('file', this.audioBlob, 'recording.wav');

        // 以下为上传逻辑，根据你的后端接口进行相应调整
        // axios.post('your-upload-url', formData, {
        //   headers: {
        //     'Content-Type': 'multipart/form-data'
        //   }
        // })
        // .then(response => {
        //   console.log('上传成功', response);
        // })
        // .catch(error => {
        //   console.error('上传失败', error);
        // });
      }
    },
    drawRecord() {
      this.drawRecordId = requestAnimationFrame(this.drawRecord);
      this.drawWave({
        canvas: this.$refs.record,
        dataArray: this.recorder.getRecordAnalyseData(),
      });
    },
    drawPlay() {
      this.drawPlayId = requestAnimationFrame(this.drawPlay);
      this.drawWave({
        canvas: this.$refs.play,
        dataArray: this.recorder.getPlayAnalyseData(),
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
    }
  }
};
</script>

<style scoped>

</style>
