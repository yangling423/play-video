import PlayVideoComponent from './play-video'

const playVideo = {
  install: function (Vue) {
    if (typeof window !== 'undefined' && window.Vue) {
      Vue = window.Vue
    }
    Vue.component('PlayVideo', PlayVideoComponent)
  }
}
export default playVideo
