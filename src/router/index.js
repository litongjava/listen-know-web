import Vue from 'vue'
import VueRouter from 'vue-router'
import UploadAudioView from '../views/UploadAudioView.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'upload-audio',
    component: UploadAudioView
  },
  {
    path: '/RecordAudio',
    name: 'RecordAudio',
    component: () => import(/* webpackChunkName: "about" */ '../views/RecordAudioView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: "/RealtimeSpeechRecognition",
    name: "RealtimeSpeechRecognition",
    component: () => import('../views/RealtimeSpeechRecognitionView')
  },
  {
    path: "/RealtimeSpeechSave",
    name: "RealtimeSpeechSave",
    component: () => import('../views/RealtimeSpeechSaveView.vue')
  },
  {
    path: "/Recorder",
    name: "Recorder",
    component: () => import('../views/RecorderView.vue')
  },
  {
    path: "/JSAudioRecorderTest",
    name: "JSAudioRecorderTest",
    component: () => import('../views/JSAudioRecorderTestView.vue')
  }


];

const router = new VueRouter({
  routes
});

export default router
