# play-video

**属性**

| 名称               | 类型          | 默认值    | 是否必填 | 说明                                                         |
| ------------------ | ------------- | --------- | -------- | ------------------------------------------------------------ |
| vid                | String        | /         | 是       | 播放器平台的音视频唯一id。                                   |
| width              | String        | 100%      | 否       | 播放器的宽度，支持像素值和百分比两种方式，比如200px或100%，默认根据父容器宽度 |
| height             | String        | 100%      | 否       | 播放器的高度，支持像素值和百分比两种方式，比如200px或100%，默认根据父容器高度 |
| autoplay           | Boolean       | /         | 否       | 是否自动播放。<br/>注：*目前大多数浏览器都会限制自动播放，该参数可能无效。* |
| loop               | Boolean       | false     | 否       | 是否开启循环播放。                                           |
| playSafeUrl        | String        | /         | 是       | 获取播放加密视频凭证的接口URL。<br>只有pc端才有该参数。      |
| playSafeData       | Boolean       | {vid: XXX | 否       | 请求加密视频凭证接口所需数据。<br>只有pc端才有该参数         |
| viewerInfo         | Object        | /         | 是       | 自定义观众信息。播放器上报的观看行为日志中会附带观众信息。<br/>{id: XXX, name: XXX} |
| poster             | String        | /         | 否       | 播放器封面。<br/>默认为视频第一秒的截图。                    |
| primaryColor       | String        | #B8BC18   | 否       | 播放器主题色。<br>                                           |
| lang               | String        | ZH        | 否       | 播放器语种 中文ZH 英语EN                                     |
| initVolume         | Number        | 50        | 否       | 播放器初始音量，取值范围[0, 100]。                           |
| speed              | Boolean/Array | /         | 否       | 当speed参数值为boolean类型时，代表是否显示倍速切换的按钮。当参数值为数组时，则代表倍速切换的可选速率。最多可设置6个速率，取值范围：(0,3]。PC端默认值为：[2, 1.5, 1.2, 0.5]，移动端默认值为：[1, 1.5, 2]。 |
| banSeek            | Boolean       | false     | 否       | 是否禁止拖拽进度条。<br>注：*Android系统下各厂商浏览器表现不一致，该参数可能不生效。* |
| banSeekByLimitTime | Boolean       | false     | 否       | 是否禁止拖拽进度至视频未播放到的位置。true时只能在已播放过的区域内拖拽。 |
| watchStartTime     | Number        | /         | 否       | 播放开始时间，表示视频从第几秒开始播放，参数值需小于视频时长。 |
| showHd             | Boolean       | true      | 否       | 是否显示清晰度选择按钮。                                     |
| df                 | String        | SD        | 否       | 视频清晰度，可选值LD: 普清, SD: 标清, HD: 高清。若该视频下清晰度对应转码列表未转码成功则显示自动。 |
| ITSupport          | Object        | /         | 否       | 播放器右键显示card内容，不传只显示播放器版本号。<br>{text: 内容文本, link: 跳转地址} |
| code               | String        | /         | 否       | 跑马灯自定义的code值。                                       |

**方法**

| 名称                  | 参数及类型    | 返回值及类型 | 说明                                                         |
| --------------------- | ------------- | ------------ | ------------------------------------------------------------ |
| playVideo             | /             | /            | 播放。                                                       |
| pauseVideo            | /             | /            | 暂停。                                                       |
| seekVideo             | Number        | /            | 跳转到某个时刻播放，参数单位为：秒。                         |
| getDuration           | /             | Number       | 获取视频总时长，返回值单位为：秒。                           |
| getCurrentTime        | /             | Number       | 获取视频当前的播放时刻，返回值单位为：秒。                   |
| setVolume             | Number        | /            | 设置视频播放音量，取值范围[0, 100]区间。                     |
| changeVid             | String/Object | /            | 切换到下一个视频。<br>传参为String类型时为vid。<br>传参为Object类型时为Object.assign({vid: XXX}, options) |
| updateVideoDefinition | String        | /            | 切换清晰度，参数取值LD/SD/HD，分别对应普清，标清，高清。     |
| fullScreenChange      | /             | /            | 全屏/退出全屏 切换。                                         |
| destroy               | /             | /            | 销毁播放器实例。                                             |

**事件**

| 名称                   | 说明                                                         |
| ---------------------- | ------------------------------------------------------------ |
| wpv-init-over          | 播放器初始化完毕时触发。播放器提供的方法需要在此事件发生后才可以调用。 |
| wpv-first-play         | 视频初次播放时触发。                                         |
| wpv-play               | 视频初次播放或由暂停恢复播放时触发                           |
| wpv-pause              | 视频暂停时触发。                                             |
| wpv-ended              | 视频播放结束时触发。                                         |
| wpv-volume-change      | 播放音频发生变化时触发，变化后的音量。                       |
| wpv-seeked             | 视频拖拽进度时触发，参数返回开始、结束seek的时间点以及vid。  |
| wpv-full-screen-change | 播放器改变全屏状态时触发，参数返回Boolean，true代表全屏，false代表非全屏。 |
| wpv-error              | 播放器加载错误时触发。                                       |

