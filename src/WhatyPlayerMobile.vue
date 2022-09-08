<template>
  <div :class="['whaty-play-video-content', {'whaty-pv-full-wrap': fullScreen}]"
       :style="{'--primary-color': primaryColor, 'width': width, 'height': height}"
       id="whatyPlayer">
    <!--视频状态审核成功-->
    <div class="play-video-content-success"
         v-show="vid && playInfo.basicInfo && playInfo.basicInfo.status === '60' && !whatyPlayErrorMsg">
      <div class="pv-video-wrap"
           ref="pvVideoWrap">
        <video
          id="my-player"
          ref="myPlayer"
          class="video-js"
          data-setup='{}'>
        </video>
        <div class="pv-log-error" v-if="videoPlayError">
          <div class="pv-log-errorIcon">&#xe656;</div>
          <div class="pv-log-errormsg">{{videoPlayError}}</div>
        </div>
        <div class="pv-cover" v-if="showCover" :style="`background-image: url(${poster || (playInfo.basicInfo ? playInfo.basicInfo.thumbnail : '')})`">
          <span @click="changePlayStatus()">&#xe87c;</span>
        </div>
      </div>
      <div class="pv-video-bottom">
        <!--操作控制按钮-->
        <div :class="['pv-controls', {'pv-controls-focus': !isPlaying || videoHoverFocus}]">
          <div class="pv-controls-left">
            <button type="button"
                    class="pv-iconfont pv-iconfont-hover"
                    @click="changePlayStatus">{{isPlaying ? '&#xe619;' : '&#xe87c;'}}</button>
            <div class="pv-time-wrap">
              <span class="pv-time-current">{{currentDuration | toHourMinuteSecond}}</span>
              <span class="pv-time-separator">/</span>
              <span class="pv-time-duration">{{duration | toHourMinuteSecond}}</span>
            </div>
          </div>
          <!--进度条-->
          <div class="pv-progress-wrap" :style="{'cursor': ban_seek === 'on' ? 'unset' : 'pointer'}">
            <!--帧信息展示-->
            <div class="pv-progress-touch-time"></div>
            <div class="pv-progress-bg" ref="pvProgress">
              <!--进度条缓冲-->
              <div class="pv-progress-buffer" :style="{'width': bufferProgress + '%'}"></div>
              <!--进度条-->
              <div class="pv-progress-current">
                <div class="pv-progress-current-bg" ref="currentProgress"></div>
                <span class="pv-progress-target"></span>
              </div>
            </div>
          </div>
          <div class="pv-controls-right">
<!--            &lt;!&ndash;音量&ndash;&gt;-->
<!--            <div class="pv-component-wrap">-->
<!--              <button type="button" class="pv-iconfont">{{volume ? '&#xe657;' : '&#xe650;'}}</button>-->
<!--              <div class="pv-control-wrap-style">-->
<!--                <div class="pv-control-wrap-style-content pv-volume-slider">-->
<!--                  <div class="pv-volume-rail" ref="volumeProgress">-->
<!--                    <div class="pv-volume-current" ref="volumeCurrentProgress" :style="[{'height': `${volume}%`}]">-->
<!--                      <span class="pv-volume-target"></span>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
            <!--设置-->
            <div class="pv-component-wrap"
                 v-if="(speedArray && speedArray.length) && (showHd && definitionArray.length)">
              <button type="button"
                      class="pv-iconfont"
                      @click="showSettingDetail">&#xe608;</button>
            </div>
            <!--全屏/退出全屏按钮-->
            <div class="pv-component-wrap">
              <button type="button"
                      class="pv-iconfont"
                      @click="fullScreenChange">{{fullScreen ? '&#xe792;' : '&#xe7cf;'}}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="play-video-controls-fixed"
           v-show="showSetting && (speedArray && speedArray.length) && (showHd && definitionArray.length)"
           @click="hideSettingDetail">
        <!--倍速-->
        <div class="play-video-controls-fixed-item"
             v-if="speedArray && speedArray.length">
          <div class="play-video-controls-fixed-item-name">{{ getLangMsg('speed') }}</div>
          <div class="play-video-controls-fixed-item-options">
            <div class="play-video-controls-fixed-item-option-value"
                 v-for="speedItem in speedArray"
                 :key="speedItem"
                 :class="{'play-video-controls-fixed-item-option-value-selected': speedNum === speedItem}"
                 @click.stop="updateVideoSpeed(speedItem)">{{speedItem}}x</div>
          </div>
        </div>
        <!--清晰度-->
        <div class="play-video-controls-fixed-item"
             v-if="showHd && definitionArray.length">
          <div class="play-video-controls-fixed-item-name">{{ getLangMsg('definition') }}</div>
          <div class="play-video-controls-fixed-item-options">
            <div class="play-video-controls-fixed-item-option-value"
                 v-for="definitionItem in definitionArray"
                 :key="definitionItem.id"
                 :class="{'play-video-controls-fixed-item-option-value-selected': definitionObj.id === definitionItem.id}"
                 @click.stop="updateVideoDefinition(definitionItem)">{{getDefinitionName(definitionItem.definition)}}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-show="whatyPlayErrorMsg" class="error-hint-content">{{whatyPlayErrorMsg}}</div>
  </div>
</template>

<script>
/* eslint-disable */
import videoJs from 'video.js'
import 'videojs-contrib-hls'
import moment from 'moment'
import md5 from 'js-md5'
import request from './request'
import config from './../../package.json'
import 'video.js/dist/video-js.css'
import langObj from './lang'
import qs from 'qs'

let player, marquee
export default {
  name: 'WhatyPlayerMobile',
  props: {
    // 音视频Id
    vid: {
      type: String,
      default: '4029819b8001b788018001b861dc0000'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '100%'
    },
    // 播放器语种 中文ZH 英语EN
    lang: {
      type: String,
      default: 'zh-CN'
    },
    // 播放器主题色
    primaryColor: {
      type: String,
      default: 'rgba(102,153,0,1)'
    },
    // 播放器初始音量
    initVolume: {
      type: Number,
      default: 50,
      validator: (val) => {
        return val >= 0 && val <= 100
      }
    },
    // 当speed参数值为boolean类型时，代表是否显示倍速切换的按钮
    speed: {
      type: Boolean | Array,
      default: true
    },
    // 播放器封面
    poster: String,
    // 是否自动播放
    autoplay: Boolean,
    // 是否循环播放
    loop: {
      type: Boolean,
      default: false
    },
    // 是否禁止拖拽进度至视频未播放到的位置
    ban_seek_by_limit_time: {
      type: String,
      default: 'off'
    },
    // 是否禁止拖拽进度条
    ban_seek: {
      type: String,
      default: 'off'
    },
    // 播放开始时间
    watchStartTime: Number,
    // 是否显示清晰度选择按钮
    showHd: {
      type: Boolean,
      default: true
    },
    // 默认清晰度,LD: 普清,SD: 标清,HD: 高清
    df: {
      type: String,
      default: 'SD'
    },
    viewerInfo: {
      type: Object,
      default: () => {
        return {
          id: 'test',
          name: 'test'
        }
      }
    },
    playSafeUrl: {
      type: String,
      // required: true,
      default: '/api/video/play/playToken'
    },
    playSafeData: Object,
    ITSupport: {
      type: Object,
      default: () => {
        return {
          text: '由正承教育提供视频服务',
          link: 'https://www.baidu.com/'
        }
      }
    },
    code: {
      type: String,
      default: '跑马灯内容'
    }
  },
  filters: {
    toHourMinuteSecond (val) {
      if (val) {
        let time = moment.duration(val * 1000)
        let timeArr = []
        if (time.hours()) {
          timeArr.push(`${time.hours()}`.padStart(2, '0'))
        }
        return [...timeArr, `${time.minutes()}`.padStart(2, '0'), `${time.seconds()}`.padStart(2, '0')].join(':')
      }
      return '00:00'
    }
  },
  data () {
    return {
      playInfo: {},
      token: '',
      isPlaying: false,
      showCover: true,
      mouseFocusProgress: false,
      videoPlayError: '',
      // 缓冲进度
      bufferProgress: 0,
      // 视频总时长
      duration: 0,
      // 视频观看时长
      currentDuration: 0,
      // 视频最长观看时长
      maxWatchDuration: 0,
      // 音量
      volume: 0,
      // 倍速
      speedArray: [],
      speedNum: 1,
      // 清晰度
      definitionObj: {},
      definitionArray: [],
      // 全屏
      fullScreen: false,
      // 心跳
      playRecordTimer: null,
      heartbeat: 60,
      playDuration: 0,
      startPosition: 0,
      whatyPlayErrorMsg: '',
      // 控制操作按钮是否显示
      videoHoverFocus: false,
      videoHoverFocusTimer: null,
      videoWidth: 0,
      videoHeight: 0,
      // 跑马灯
      marqueeTimer: null,
      marqueeInfo: null,

      showSetting: false
    }
  },
  computed: {
    version () {
      return config.version || '1.0.0'
    },
    videoUrl () {
      return 'http://shc02.frp.o-learn.cn/api/video/play/m3u8/' + this.definitionObj.id || this.vid
    },
    isMobile () {
      return navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
    },
    progressWidth () {
      if (this.$refs.pvProgress) {
        return this.$refs.pvProgress.clientWidth
      }
      return 0
    },
    maxWatchProgress () {
      return this.maxWatchDuration / this.duration * this.progressWidth
    }
  },
  methods: {
    getLangMsg (errorCode) {
      if (langObj && langObj.hasOwnProperty(this.lang) && errorCode) {
        return langObj[this.lang][errorCode]
      }
      return ''
    },
    getDefinitionName (definition = '') {
      switch (definition) {
        case 'LD' :
          return '普清'
        case 'SD' :
          return '标清'
        case 'HD' :
          return '高清'
        default :
          return '自动'
      }
    },
    showSettingDetail () {
      this.showSetting = true
      this.videoHoverHideControls()
    },
    hideSettingDetail () {
      this.showSetting = true
    },
    initPlayVideo () {
      player = new videoJs('my-player', {
        bigPlayButton: true,
        autoplay: this.autoplay,
        controls: false,
        loop: this.loop,
        language: this.lang,
        preload: 'auto',
        playbackRates: this.speedArray
      }, () => {
        videoJs.Hls.xhr.beforeRequest = (options) => {
          if (!this.isMobile) {
            if (!options.uri.startsWith('key://')) {
              return
            }
            options.uri = `${options.uri}?token=${this.token}`
          }
        }
        player.src({
          src: this.videoUrl,
          type: 'application/x-mpegURL'
        })
        if (this.watchStartTime) {
          this.seekVideo(this.watchStartTime)
        }
        this.videoWidth = this.$refs.myPlayer.clientWidth
        this.videoHeight = this.$refs.myPlayer.clientHeight
        this.addVideoListener()
      })
    },
    addVideoListener () {
      if (player) {
        player.on('loadeddata', (e) => {
          this.$emit('wpv-init-over')
        })
        player.on('durationchange', (e) => {
          this.duration = this.getDuration()
        })
        player.on('progress', (e) => {
          this.bufferProgress = player.bufferedPercent() * 100
        })
        player.on('firstplay', (e) => {
          this.$emit('wpv-first-play', this.vid)
        })
        // 监听播放
        player.on('play', () => {
          this.isPlaying = true
          this.showCover = false
          this.startPosition = this.getCurrentTime()
          this.clearPlayRecordTimer()
          this.playRecord('play')
          this.playRecordTimer = setInterval(() => {
            this.playDuration++
            if (this.playDuration >= this.heartbeat) {
              this.playRecord()
            }
          }, 1000)
          this.marqueeCodeRun()
          this.$emit('wpv-play')
        })
        // 监听暂停
        player.on('pause', () => {
          this.isPlaying = false
          this.showCover = false
          this.playRecord('pause')
          this.clearPlayRecordTimer()
          this.hideMarquee()
          this.$emit('wpv-pause')
        })
        // 监听播放结束
        player.on('ended', () => {
          this.isPlaying = false
          this.showCover = true
          this.clearMarquee()
          this.$emit('wpv-ended')
        })
        // 监听音量修改
        player.on('volumechange', () => {
          this.playRecord('volume')
          this.$emit('wpv-volume-change', this.volume)
        })
        // 监听用户拖动进度修改
        player.on('seeked', () => {
          this.playRecord('progress')
          this.$emit('wpv-seeked', this.getCurrentTime())
        })
        // 监听全屏状态
        document.addEventListener('fullscreenchange', () => {
          this.fullScreen = !!document.fullscreenElement
          this.playRecord('fullscreen')
          this.$emit('wpv-full-screen-change', this.fullScreen)
        })
        // 播放器加载错误
        player.on('error', (e) => {
          this.isPlaying = false
          this.clearPlayRecordTimer()
          this.clearMarquee()
          this.hideMarquee()
          this.$emit('wpv-error')
        })
        player.on('timeupdate', (e) => {
          this.currentDuration = this.getCurrentTime()
          this.maxWatchDuration = Math.max(this.currentDuration, this.maxWatchDuration)
        })
      }
    },
    // 获取视频总时长（s）
    getDuration () {
      if (player) {
        return player.duration() || 0
      }
      return 0
    },
    // 获取视频播放时长（s）
    getCurrentTime () {
      if (player) {
        return player.currentTime() || 0
      }
      return 0
    },
    // 开始/暂停播放
    changePlayStatus () {
      if (this.isPlaying) {
        this.pauseVideo()
      } else {
        this.playVideo()
      }
    },
    // 播放
    playVideo () {
      if (player) {
        player.play()
      }
    },
    // 暂停
    pauseVideo () {
      if (player) {
        player.pause()
      }
    },
    // 跳转到（s）
    seekVideo (second = 0) {
      second = parseFloat(second)
      if (player && !isNaN(second)) {
        player.currentTime(second)
      }
    },
    // 设置视频播放音量
    setVolume (volume) {
      volume = parseFloat(volume)
      if (player && !isNaN(volume)) {
        // 0-1
        player.volume(volume / 100)
      }
    },
    // 修改视频倍速
    updateVideoSpeed (speed) {
      if (this.speedNum !== speed) {
        this.speedNum = speed
        player.playbackRate(speed)
        // 倍速修改，不使用videojs倍速监听原因是切换视频/修改清晰度（重新修改视频src时）需要重置播放器倍速 导致重复倍速监听回调
        this.playRecord('speed')
        this.$emit('wpv-rate-change', this.speedNum)
      }
    },
    // 修改清晰度
    updateVideoDefinition (val) {
      if (!this.definitionArray.length) {
        return this.definitionObj = {}
      }
      if (typeof val === 'object') {
        this.definitionObj = val
      }
      if (typeof val === 'string') {
        let definitionIndex
        definitionIndex = this.definitionArray.findIndex(item => item.definition === val)
        this.definitionObj = definitionIndex === -1 ? this.definitionArray[0] : this.definitionArray[definitionIndex]
      }
      let current = this.getCurrentTime()
      player.src({
        src: this.videoUrl,
        type: 'application/x-mpegURL'
      })
      player.on('loadedmetadata', () => {
        this.seekVideo(current)
        if (this.isPlaying) {
          this.playVideo()
        }
        player.playbackRate(this.speedNum)
      })
    },
    // 全屏状态修改
    fullScreenChange () {
      if (this.fullScreen) {
        this.exitFullscreen()
      } else {
        let player = document.getElementById('whatyPlayer')
        this.enterFullScreen(player)
      }
    },
    // 全屏
    enterFullScreen (ele) {
      if (ele.requestFullscreen) {
        ele.requestFullscreen()
      } else if (ele.mozRequestFullScreen) {
        ele.mozRequestFullScreen()
      } else if (ele.webkitRequestFullscreen) {
        ele.webkitRequestFullscreen()
      } else if (ele.msRequestFullscreen) {
        ele.msRequestFullscreen()
      }
      return true
    },
    // 退出全屏
    exitFullscreen () {
      if (document.exitFullScreen) {
        document.exitFullScreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (element.msExitFullscreen) {
        document.msExitFullscreen()
      } else if (document.oRequestFullscreen) {
        document.oCancelFullScreen()
      }
      return true
    },
    videoHoverShowControls () {
      if (this.videoHoverFocusTimer) {
        clearInterval(this.videoHoverFocusTimer)
        this.videoHoverFocusTimer = null
      }
      this.videoHoverFocus = true
      this.videoHoverFocusTimer = setTimeout(() => this.videoHoverFocus = false, 3000)
    },
    videoHoverHideControls () {
      this.videoHoverFocus = false
    },
    // 切换播放视频， vid/options对象
    changeVid (val) {
      if (val) {
        let vid = typeof val === 'string' ? val : val.vid
        this.initData()
        this.loadPlayInfo(vid).then(() => {
          if (player) {
            player.src({
              src: this.videoUrl,
              type: 'application/x-mpegURL'
            })
            // options
            if (typeof val === 'object') {
              player.options = val
              this.seekVideo(val.watchStartTime)
            }
            player.playbackRate(typeof val === 'object' && val.speed ? val.speed : this.speedNum)
          }
        }).catch(errorMsg => {
          this.whatyPlayErrorMsg = errorMsg
        })
      }
    },
    initData () {
      this.playInfo = {}
      this.token = ''
      this.isPlaying = false
      this.showCover = true
      this.bufferProgress = 0
      this.duration = 0
      this.currentDuration = 0
      this.maxWatchDuration = 0
      this.videoPlayError = ''
      this.whatyPlayErrorMsg = ''
      this.startPosition = 0
      this.playDuration = 0
      this.marqueeInfo = null
      this.definitionObj = {}
      this.setProgressWidth(0)
      this.clearMarquee()
      this.clearPlayRecordTimer()
    },
    setProgressWidth (width = 0) {
      if (this.$refs.currentProgress) {
        this.$refs.currentProgress.style.width = `${width.toFixed(4)}%`
      }
    },
    initPvProgress () {
      let progress = this.$refs.pvProgress
      if (progress) {
        let startX = 0
        const getRightX = (x = 0) => {
          x = x - startX
          return Math.min(Math.max(0, x), this.progressWidth)
        }
        const isSeek = (x) => {
          return this.ban_seek === 'off' && (this.ban_seek_by_limit_time === 'off' || (this.ban_seek_by_limit_time === 'on' && getRightX(x) < this.maxWatchProgress))
        }
        progress.ontouchstart = (e) => {
          this.mouseFocusProgress = true
          startX = progress.getBoundingClientRect().left
          if (isSeek(e.clientX)) {
            this.setProgressWidth((getRightX(e.clientX) / this.progressWidth) * 100)
          }
          document.ontouchmove = (ev) => {
            ev.preventDefault()
            ev.stopPropagation()
            if (isSeek(ev.clientX)) {
              this.setProgressWidth((getRightX(ev.clientX) / this.progressWidth) * 100)
            }
          }
          document.ontouchend = (eu) => {
            this.mouseFocusProgress = false
            document.ontouchmove = null
            document.ontouchend = null
            if (isSeek(eu.clientX) && player) {
              let changeWatchTime = getRightX(eu.clientX) / this.progressWidth * this.duration
              this.seekVideo(changeWatchTime)
            }
          }
        }
      }
    },
    initPvVolumeProgress () {
      let volumeProgress = this.$refs.volumeProgress
      if (volumeProgress) {
        let startY = 0
        const getRightY = (x = 0) => {
          x = x - startY
          return Math.max(Math.min(100 - x, 100), 0)
        }
        volumeProgress.onmousedown = (e) => {
          startY = volumeProgress.getBoundingClientRect().top
          this.volume = getRightY(e.clientY)
          document.onmousemove = (ev) => {
            ev.preventDefault()
            ev.stopPropagation()
            this.volume = getRightY(ev.clientY)
          }
          document.onmouseup = (eu) => {
            document.onmousemove = null
            document.onmouseup = null
            this.volume = getRightY(eu.clientY)
            this.setVolume(this.volume)
          }
        }
      }
    },
    // 发送操作心跳
    playRecord (eventType = 'heartbeat') {
      if (player) {
        let params = {
          playId: this.token,
          vid: this.vid,
          viewerId: this.viewerInfo.id,
          viewerName: this.viewerInfo.name,
          definition: this.definitionObj.definition || '',
          speed: this.speedNum,
          playDuration: this.playDuration,
          volume: this.volume,
          eventType,
          eventSource: 'user',
          fullscreen: this.fullScreen,
          startPosition: this.startPosition.toFixed(0),
          endPosition: this.getCurrentTime().toFixed(0)
        }
        request.send('/api/video/play/record', {
          method: 'POST',
          body: qs.stringify(params)
        })
        this.playDuration = 0
        this.startPosition = this.getCurrentTime()
      }
    },
    clearPlayRecordTimer () {
      if (this.playRecordTimer) {
        clearInterval(this.playRecordTimer)
        this.playRecordTimer = null
      }
    },
    loadPlayInfo (vid) {
      let that = this
      return new Promise((resolve, reject) => {
        if (vid) {
          // 获取视频信息
          request.send('/api/video/play/info', {
            method: 'POST',
            body: `vid=${vid}`,
            success (response) {
              response = JSON.parse(response)
              if (response.code === '200') {
                that.playInfo = response.data || {}
                // 设置清晰度，有默认值时显示默认清晰度 否则展示清晰度列表第一条
                if (that.playInfo.transcodeInfos && that.playInfo.transcodeInfos.length) {
                  let arr = that.playInfo.transcodeInfos.filter(item => item.status === 'normal')
                  if (arr.length) {
                    let defaultIndex = 0
                    if (that.df && arr.findIndex(item => item.definition === that.df) !== -1) {
                      defaultIndex = arr.findIndex(item => item.definition === that.df)
                    }
                    that.definitionObj = arr[defaultIndex]
                    that.definitionArray = arr.reverse()
                  }
                }
                if (that.playInfo['basicInfo'] && that.playInfo['basicInfo']['status'] === '60') {
                  // 视频跑马灯验证
                  if (that.playInfo['config'] && that.playInfo['config']['marqueeUrl']) {
                    that.checkVideoMarquee(vid).then(() => {
                      that.getVideoToken(vid).then(() => {
                        resolve()
                      }).catch((errorMsg) => reject(errorMsg))
                    }).catch((errorMsg) => reject(errorMsg))
                  } else {
                    that.getVideoToken(vid).then(() => {
                      resolve()
                    }).catch((errorMsg) => reject(errorMsg))
                  }
                } else {
                  reject(that.getLangMsg(that.playInfo['basicInfo']['status']))
                }
              } else {
                reject(response.message)
              }
            },
            error (errorRes) {
              reject(errorRes || '获取视频信息请求发送失败')
            }
          })
        } else {
          reject(that.getLangMsg('00'))
        }
      })
    },
    checkVideoMarquee (vid) {
      let that = this
      return new Promise((resolve, reject) => {
        let t = moment().valueOf()
        let requestBody = `t=${t}&vid=${vid}&code=${that.code}`
        request.send(that.playInfo['config']['marqueeUrl'], {
          method: 'POST',
          body: requestBody,
          success (marqueeRes) {
            // 验证跑马灯
            marqueeRes = JSON.parse(marqueeRes)
            let sign = marqueeRes.sign
            delete marqueeRes.sign
            request.send(`/api/video/play/sign?${requestBody + '&' + qs.stringify(marqueeRes)}`, {
              method: 'GET',
              success (res) {
                res = JSON.parse(res)
                if (res.data && res.data === sign) {
                  that.marqueeInfo = marqueeRes
                  resolve()
                } else {
                  reject(res.message || that.getLangMsg('##003'))
                }
              },
              error (errorRes) {
                reject(errorRes || '跑马灯验证加载错误。')
              }
            })
          },
          error (errorRes) {
            reject(errorRes || '跑马灯加载错误。请检查跑马灯接口返回的参数是否正确。')
          }
        })
      })
    },
    randomString (num) {
      let e = ''
      for (let i = 0; i < num; i++) e += String.fromCharCode(122 - Math.floor(26 * Math.random()))
      return e
    },
    createRandomElement (num) {
      return document.createElement(this.randomString(num))
    },
    marqueeCodeRun () {
      if (this.marqueeInfo) {
        if (!marquee) {
          let left = this.videoWidth
          let top = Math.random() * this.videoHeight
          let sign = document.createElement('o-span')
          // 从右往左所需时间ms
          let speedDuration = this.marqueeInfo.speed / 10 * 1000
          sign.setAttribute('class', 'pv-opa-tk')
          sign.innerText = this.marqueeInfo.username
          marquee = this.createRandomElement(4)
          marquee.innerText = this.code
          marquee.style.cssText = `font-size:${this.marqueeInfo.fontSize || 14}px;color:${this.marqueeInfo.fontColor || '#fff'}opacity: ${this.marqueeInfo.alpha || 1};;position:absolute;white-space: nowrap;top:${top}px;left:${left}px;display: ${this.marqueeInfo.show === 'on' && this.isPlaying ? 'block' : 'none'}`
          marquee.animate([{
            left: `${left}px`
          }, {
            left: 0
          }], {duration: speedDuration, fill:'forwards', easing:'linear'})
          this.$refs.pvVideoWrap.appendChild(marquee)

          this.marqueeTimer = setTimeout(() => {
            marquee.remove()
            marquee = null
            this.marqueeCodeRun()
          }, speedDuration)
        } else {
          if (this.marqueeInfo.show === 'on') {
            marquee.style.display = 'block'
          }
        }
      }
    },
    clearMarquee () {
      if (marquee) {
        marquee.remove()
        marquee = null
      }
      if (this.marqueeTimer) {
        clearInterval(this.marqueeTimer)
        this.marqueeTimer = null
      }
    },
    hideMarquee () {
      if (marquee) {
        marquee.style.display = 'none'
      }
    },
    getVideoToken (vid) {
      let that = this
      return new Promise((resolve, reject) => {
        let params = {vid}
        Object.assign(params, that.playSafeData || {})
        // 测试
        let ts = moment().valueOf()
        let userId = 'afj3sd32'
        request.send(that.playSafeUrl, {
          method: 'POST',
          body: `sign=${md5(`sdfhue2skl23f4ts${ts}userId${userId}videoId${vid}viewerId${that.viewerInfo.id}sdfhue2skl23f4`)}&ts=${ts}&userId=${userId}&videoId=${vid}&viewerId=${that.viewerInfo.id}`,
          success (playSafeRes) {
            playSafeRes = JSON.parse(playSafeRes)
            that.token = playSafeRes.data.token
            resolve()
          },
          error (errorRes) {
            reject(errorRes || '获取加密视频凭证失败')
          }
        })
        // 正式
        // request.send(that.playSafeUrl, {
        //   method: 'POST',
        //   body: qs.stringify(params),
        //   success (playSafeRes) {
        //     playSafeRes = JSON.parse(playSafeRes)
        //     if (playSafeRes.token) {
        //       that.token = playSafeRes.token
        //       resolve()
        //     } else {
        //       reject(playSafeRes.message || '获取加密视频凭证失败')
        //     }
        //   },
        //   error (errorRes) {
        //     reject(errorRes || '获取加密视频凭证失败')
        //   }
        // })
      })
    },
    disposePlay () {
      if (player) {
        player.dispose()
        player = null
      }
    }
  },
  mounted () {
    this.loadPlayInfo(this.vid).then(() => {
      this.initPlayVideo()
    }).catch(errorMsg => {
      this.whatyPlayErrorMsg = errorMsg
    })
    this.volume = this.initVolume
    if (this.speed) {
      this.speedArray = typeof this.speed === 'boolean' ? [2, 1.5, 1.2, 1, 0.5] : this.speedArray
    }
    this.$nextTick(() => {
      this.initPvProgress()
      this.initPvVolumeProgress()
      // 监听浏览器小窗口播放
      let observer = new MutationObserver((mutations) => {
        let attributesChange = false
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            attributesChange = true
          }
        })
        if (attributesChange) {
          this.disposePlay()
          this.videoPlayError = this.getLangMsg('##001')
        }
      })
      observer.observe(document.querySelector('script'), {attributes: true})
    })
  },
  destroyed () {
    this.disposePlay()
    this.clearMarquee()
    this.clearPlayRecordTimer()
  },
  watch: {
    currentDuration (val) {
      if (val && !this.mouseFocusProgress) {
        this.$refs.currentProgress.style.width = `${(this.currentDuration / this.duration * 100).toFixed(4)}%`
      }
    }
  }
}
</script>

<style scoped lang="scss">
@font-face {
  font-family: 'iconfont';  /* Project id 2762874 */
  src: url('//at.alicdn.com/t/c/font_2762874_ftg74zuh8fw.woff2?t=1662645241511') format('woff2'),
  url('//at.alicdn.com/t/c/font_2762874_ftg74zuh8fw.woff?t=1662645241511') format('woff'),
  url('//at.alicdn.com/t/c/font_2762874_ftg74zuh8fw.ttf?t=1662645241511') format('truetype');
}
.whaty-play-video-content {
  width: 100%;
  height: 100%;
  transition: opacity .5s;
  box-sizing: border-box;
  font-size: 14px;
  background: #000;
  position: relative;
  touch-action: none;
  &.whaty-pv-full-wrap {
    position: fixed !important;
    width: 100% !important;
    height: 100% !important;
    left: 0;
    top: 0;
    z-index: 10000;
  }
  &>button {
    position: absolute;
    z-index: 1;
  }
  &>.play-video-content-success {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    &>.pv-video-wrap {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      .video-js {
        width: 100%;
        height: 100%;
        .vjs-poster {
          cursor: default !important;
        }
      }
      &>.pv-cover {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        color: #fff;
        z-index: 1;
        background-color: rgba(0, 0, 0, .6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'iconfont' !important;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        &>span {
          font-size: 32px;
          cursor: pointer;
          &:hover {
            color: var(--primary-color);
          }
        }
      }
      &>.pv-log-error {
        position: absolute;
        width: 100%;
        height: 100%;
        background: #00101b;
        z-index: 30;
        opacity: 1 !important;
        visibility: visible !important;
        color: #ffffff;
        &>.pv-log-errorIcon {
          font-family: 'iconfont' !important;
          font-size: 30px;
          position: absolute;
          top: 50%;
          left: 50%;
          margin-left: -23px;
          margin-top: -55px;
          width: 47px;
          height: 31px;
        }
        &>.pv-log-errormsg {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          padding-top: 25px;
          text-align: center;
        }
      }
      .pv-opa-tk {
        position: absolute;
        pointer-events: none;
        color: #fff;
        -webkit-text-stroke: 1px #262626;
        font-weight: bold;
        opacity: .01;
        font-size: 14px;
        white-space: nowrap;
      }
      @media screen and (max-width: 420px) {
        .pv-cover {
          &>span {
            font-size: 28px;
          }
        }
      }
    }
    &>.pv-video-bottom {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      -ms-user-select: none;
      user-select: none;
      z-index: 2;
      transition: all .3s;
      padding-top: 15px;
      height: auto;
      box-sizing: border-box;
      $controlsFocusHeight: 48px;
      &>.pv-controls {
        color: #fff;
        position: relative;
        bottom: 0;
        width: 100%;
        background-clip: content-box;
        font-size: 12px;
        height: 0;
        transition: height .3s;
        transform-origin: bottom;
        overflow: hidden;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        padding: 0 10px;
        .pv-iconfont {
          outline: none;
          border: 0;
          vertical-align: top;
          background-color: transparent;
          text-align: center;
          color: #fff;
          padding: 0 5px !important;
          cursor: pointer;
          display: inline-block;
          height: 100%;
          font-size: 14px;
          margin: 0 5px;
          font-family: 'iconfont' !important;
          white-space: nowrap;
          width: auto;
          &.text-sm {
            font-size: 12px;
          }
        }
        &>.pv-controls-left {
          height: 100%;
          &>.pv-time-wrap {
            display: inline-block;
            height: 100%;
            vertical-align: top;
            position: relative;
            line-height: $controlsFocusHeight;
          }
        }
        &>.pv-progress-wrap {
          flex: 1;
          height: 3px;
          position: relative;
          margin: 0 10px;
          &>.pv-progress-bg {
            position: absolute;
            left: 0;
            top: -1px;
            width: 100%;
            height: 100%;
            background-color: rgba(255,255,255,.35);
            &>.pv-progress-buffer {
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              background-color: rgba(255,255,255,.35);
            }
            &>.pv-progress-current {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              font-size: 0;
              z-index: 1;
              text-align: left;
              &>.pv-progress-current-bg {
                position: relative;
                display: inline-block;
                height: 100%;
                background-color: var(--primary-color);
              }
              &>.pv-progress-target {
                position: absolute;
                width: 10px;
                height: 10px;
                top: 50%;
                margin-top: -5px;
                margin-left: -5px;
                border-radius: 5px;
                background-color: #fff;
                opacity: 1;
              }
            }
          }
        }
        &>.pv-controls-right {
          height: 100%;
          &>.pv-component-wrap {
            display: inline-block;
            height: 100%;
            vertical-align: top;
            position: relative;
            cursor: pointer;
            &>.pv-control-wrap-style {
              display: none;
              position: absolute;
              bottom: 100%;
              left: 50%;
              padding-bottom: 10px;
              -ms-transform: translateX(-50%);
              transform: translateX(-50%);
              transition: opacity .5s;
              opacity: 0;
              margin-bottom: -5px;
              &>.pv-control-wrap-style-content {
                background-color: rgba(0,16,27,.7);
                border-radius: 4px;
                &.pv-volume-slider {
                  position: relative;
                  padding: 9px 13px;
                  cursor: pointer;
                  &>.pv-volume-rail {
                    height: 100px;
                    width: 4px;
                    border-radius: 4px;
                    background-color: rgba(255,255,255,0.35);
                    position: relative;
                    &>.pv-volume-current {
                      position: absolute;
                      left: 0;
                      bottom: 0;
                      width: 100%;
                      border-radius: 3px;
                      background-color: var(--primary-color);
                      &>.pv-volume-target {
                        width: 12px;
                        height: 12px;
                        border-radius: 6px;
                        background-color: #fff;
                        position: absolute;
                        top: -6px;
                        left: -4px;
                      }
                    }
                  }
                }
                &.pv-fullscreen-tip {
                  white-space: nowrap;
                  line-height: 30px;
                  padding: 0 9px;
                }
                &>.pv-select-option {
                  width: 80px;
                  font-size: 12px;
                  line-height: 34px;
                  text-align: center;
                  cursor: pointer;
                  color: #ffffff;
                  &:last-child {
                    margin-bottom: 0;
                  }
                  &.pv-select-option-active {
                    color: var(--primary-color);
                  }
                  &:hover {
                    color: var(--primary-color);
                  }
                }
              }
            }
            &>.pv-iconfont {
              margin: 0;
            }
          }
        }
        &.pv-controls-focus {
          height: $controlsFocusHeight;
          overflow: unset;
        }
        //@media screen and (max-width: 420px) {
        //  .pv-iconfont {
        //    margin: 0;
        //  }
        //  .pv-controls-left {
        //    left: 10px;
        //    .pv-time-wrap {
        //      margin-left: 0;
        //    }
        //  }
        //  .pv-controls-right {
        //    right: 10px;
        //    &>.pv-component-wrap {
        //      display: none;
        //      &:last-child {
        //        display: block;
        //      }
        //    }
        //  }
        //}
      }
      &:hover {
        &>.pv-controls {
          height: $controlsFocusHeight;
          overflow: unset;
        }
      }
    }
    &>.play-video-controls-fixed {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background: rgba(0, 0, 0, .7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow-y: auto;
      padding: 0 25px;
      box-sizing: border-box;
      &>.play-video-controls-fixed-item {
        width: 100%;
        display: flex;
        align-items: flex-start;
        color: #FFFFFF;
        font-size: 16px;
        margin: 15px 0;
        &>.play-video-controls-fixed-item-options {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          &>.play-video-controls-fixed-item-option-value {
            margin: 0 15px;
            &.play-video-controls-fixed-item-option-value-selected {
              color: var(--primary-color);
            }
          }
        }
      }
    }
  }
  &>.error-hint-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }
}
</style>
