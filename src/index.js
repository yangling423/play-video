import WhatyPlayerComponent from './whaty-player'

const whatyPlayer = {
  install: function (Vue) {
    if (typeof window !== 'undefined' && window.Vue) {
      Vue = window.Vue
    }
    Vue.component('WhatyPlayer', WhatyPlayerComponent)
  }
}
export default whatyPlayer
