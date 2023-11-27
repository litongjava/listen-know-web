class WebAudioRecorder {
  constructor(stream, config) {
    this.config = config || {};
    this.config.sampleBits = this.config.sampleBits || 16;      // 采样数位 8, 16
    this.config.sampleRate = this.config.sampleRate || 16000;   // 采样率(1/6 44100)

    this.context = new AudioContext();
    this.audioInput = this.context.createMediaStreamSource(stream);
    this.processor = this.context.createScriptProcessor(4096, 1, 1);
    this.stream = stream;

    // 集成audioData的属性
    this.size = 0;
    this.buffer = [];
    this.inputSampleRate = this.context.sampleRate;
    this.outputSampleRate = this.config.sampleRate;

    this.isRecording = false;

    this.processor.onaudioprocess = (e) => {
      if (this.isRecording) {
        this.input(e.inputBuffer.getChannelData(0));
      }
    };
  }

  input(data) {
    this.buffer.push(new Float32Array(data));
    this.size += data.length;
  }

  start() {
    this.isRecording = true;
    this.audioInput.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  pause() {
    this.isRecording = false;
  }

  resume() {
    this.isRecording = true;
    this.audioInput.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  stop() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.audioInput) {
      this.audioInput.disconnect();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  getBlob() {
    this.stop();
    return this.encodeWAV();
  }

  link(audio) {
    audio.src = window.URL.createObjectURL(this.getBlob());
  }

  save(filename = 'recording.wav') {
    const blob = this.encodeWAV(); // 获取音频数据的Blob
    const url = window.URL.createObjectURL(blob); // 创建一个链接到该Blob的URL

    // 创建一个临时的a标签用于下载
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = filename; // 设置下载的文件名
    a.click(); // 模拟点击进行下载

    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  compress() {
    const data = new Float32Array(this.size);
    let offset = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      data.set(this.buffer[i], offset);
      offset += this.buffer[i].length;
    }
    const compression = parseInt(this.inputSampleRate / this.outputSampleRate);
    const length = data.length / compression;
    const result = new Float32Array(length);
    let index = 0, j = 0;
    while (index < length) {
      result[index] = data[j];
      j += compression;
      index++;
    }
    return result;
  }

  encodeWAV() {
    const sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
    const sampleBits = this.config.sampleBits; // 可以直接使用this.config.sampleBits
    const bytes = this.compress();
    const dataLength = bytes.length * (sampleBits / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const data = new DataView(buffer);

    const channelCount = 1;  // 单声道
    let offset = 0;

    const writeString = (str) => {
      for (let i = 0; i < str.length; i++) {
        data.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // WAV头部信息
    writeString('RIFF');
    offset += 4;
    data.setUint32(offset, 36 + dataLength, true);
    offset += 4;
    writeString('WAVE');
    offset += 4;
    writeString('fmt ');
    offset += 4;
    data.setUint32(offset, 16, true);
    offset += 4;
    data.setUint16(offset, 1, true);
    offset += 2;
    data.setUint16(offset, channelCount, true);
    offset += 2;
    data.setUint32(offset, sampleRate, true);
    offset += 4;
    data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
    offset += 4;
    data.setUint16(offset, channelCount * (sampleBits / 8), true);
    offset += 2;
    data.setUint16(offset, sampleBits, true);
    offset += 2;
    writeString('data');
    offset += 4;
    data.setUint32(offset, dataLength, true);
    offset += 4;

    // 写入采样数据
    if (sampleBits === 8) {
      for (let i = 0; i < bytes.length; i++, offset++) {
        const s = Math.max(-1, Math.min(1, bytes[i]));
        const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
        data.setInt8(offset, parseInt(255 / (65535 / (val + 32768))), true);
      }
    } else {
      for (let i = 0; i < bytes.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, bytes[i]));
        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    }

    return new Blob([data], {type: 'audio/wav'});
  }

  static throwError(message) {
    throw new Error(message);
  }

  static canRecording() {
    return (navigator.getUserMedia != null);
  }

  static get(callback, config) {
    if (navigator.getUserMedia) {
      navigator.getUserMedia({audio: true}, function (stream) {
        const rec = new WebAudioRecorder(stream, config);
        callback(rec);
      }, function (error) {
        WebAudioRecorder.throwError(error.message);
      });
    } else {
      WebAudioRecorder.throwError('The current browser does not support recording.');
    }
  }
}

export default WebAudioRecorder;