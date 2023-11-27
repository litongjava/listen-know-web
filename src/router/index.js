import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: '/upload-audio',
    name: 'upload-audio',
    component: () => import(/* webpackChunkName: "about" */ '../views/UploadAudioView.vue')
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
    path:"/Recorder",
    name:"Recorder",
    component:()=>import('../views/RecorderView.vue')
  },
  {
    path:"/RecorderJSTest",
    name:"RecorderJSTest",
    component:()=>import('../views/RecorderJSTestView.vue')
  }


];

const router = new VueRouter({
  routes
});

export default router
