<template>
<div id="app">
  <nav>
    <router-link to="/">Upload Audio</router-link>
    |
    <router-link to="/RecordAudio">Record Audio</router-link>
    |
    <router-link to="/RealtimeSpeechRecognition">RealtimeSpeechRecognition</router-link>
    |
    <router-link to="/RealtimeSpeechSave">RealtimeSpeechSave</router-link>
    |
    <router-link to="/Recorder">Recorder</router-link>
    |
    <router-link to="/JSAudioRecorderTest">JSAudioRecorderTest</router-link>
    |
    <router-link to="/about">About</router-link>
  </nav>
  <router-view/>
</div>
</template>

<script>export default {
  components: {}
}
</script>
