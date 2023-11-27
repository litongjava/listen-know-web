<template>
<div id="app">
  <nav>
    <router-link to="/">Home</router-link>
    |
    <router-link to="/about">About</router-link>
    |
    <router-link to="/upload-audio">Upload Audio</router-link>
    |
    <router-link to="/RealtimeSpeechRecognition">RealtimeSpeechRecognition</router-link>
    |
    <router-link to="/RealtimeSpeechSave">RealtimeSpeechSave</router-link>
    |
    <router-link to="/Recorder">Recorder</router-link>
  </nav>
  <router-view/>
</div>
</template>

