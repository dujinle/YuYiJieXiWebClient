var HttpUtil = require('HttpUtil');
/**
 * 浏览器调用语音合成接口
 * @param {Object} param 百度语音合成接口参数
 * 请参考 https://ai.baidu.com/docs#/TTS-API/41ac79a6
 * @param {Object} options 跨域调用api参数
 *           timeout {number} 超时时间 默认不设置为60秒
 *           volume {number} audio控件音量，范围 0-1
 *           hidden {boolean} 是否隐藏audio控件
 *           autoDestory {boolean} 播放音频完毕后是否自动删除控件
 *           onInit {Function} 创建完audio控件后调用
 *           onSuccess {Function} 远程语音合成完成，并且返回音频文件后调用
 *           onError {Function}  远程语音合成完成，并且返回错误字符串后调用
 *           onTimeout {Function} 超时后调用，默认超时时间为60秒
 */
'use strict';
class BaiDuTTS {
	constructor(videoPlayer) {
		var self = this;
		this.isPlay = false;
		this.audio = document.getElementById('audio');
		if(!this.audio){
			this.audio = document.createElement('audio');
		}
		this.access_token = null;
		HttpUtil.get_token(function(token){
			self.access_token = token;
		});
	}
	init(){
		//防止iphone无法播放的问题，初始化就一直播放,播放什么鬼 不知道
		//就是要一直播放
		if(this.isPlay == false){
			console.log('init for audio play');
			this.isPlay = true;
			this.audio.src = null;
			this.audio.play();
		}
	}
	
	tts(stext){
		var self = this;
		console.log('tts',stext);
		this.freshAudio(stext, {
            volume: 1,
            autoDestory: true,
            timeout: 10000,
            hidden: true,
            onInit: function (htmlAudioElement) {
            },
            onSuccess: function(htmlAudioElement) {
				console.log('onSuccess',stext);
                self.audio.play();
            },
            onError: function(text) {
                console.log(text);
            },
            onTimeout: function () {
                console.log('timeout')
            }
        });
	}
	
	freshAudio(stext,options){
		console.log('access_token',this.access_token);
		var url = 'https://tsn.baidu.com/text2audio';
		var opt = options || {};
		if(this.access_token == null){
			this.isFunction(opt.onError) && opt.onError("无效的token");
		}
		if (opt.autoplay) {
			this.audio.setAttribute('autoplay', 'autoplay');
		}

		// 隐藏控制栏
		if (!opt.hidden) {
			this.audio.setAttribute('controls', 'controls');
		} else {
			this.audio.style.display = 'none';
		}

		// 设置音量
		if (typeof opt.volume !== 'undefined') {
			this.audio.volume = opt.volume;
		}

		// 调用onInit回调
		this.isFunction(opt.onInit) && opt.onInit(this.audio);

		// 默认超时时间60秒
		var DEFAULT_TIMEOUT = 60000;
		var timeout = opt.timeout || DEFAULT_TIMEOUT;

		// 创建XMLHttpRequest对象
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url);

		// 创建form参数
		var data = {};
		// 赋值预定义参数
		data.tex = stext;
		data.spd = 5;
        data.pit = 5;
        data.vol = 15;
        data.per = 0;
		data.cuid = data.cuid || this.access_token;
		data.tok = this.access_token;
		data.ctp = 1;
		data.lan = data.lan || 'zh';

		// 序列化参数列表
		var fd = [];
		for(var k in data) {
			fd.push(k + '=' + encodeURIComponent(data[k]));
		}

		// 用来处理blob数据
		var frd = new FileReader();
		xhr.responseType = 'blob';
		xhr.send(fd.join('&'));

		// 用timeout可以更兼容的处理兼容超时
		var timer = setTimeout(function(){
			xhr.abort();
			this.isFunction(opt.onTimeout) && opt.onTimeout();
		}, timeout);
		var self = this;
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				clearTimeout(timer);
				if (xhr.status == 200) {
					if (xhr.response.type === 'audio/mp3') {
						console.log('xhr.response.type',xhr.response.type);
						// 在body元素下apppend音频控件
						//document.body.append(self.audio);
						
						//audio = self.videoPlayer.getComponent(cc.VideoPlayer);
						//audio.remoteURL = URL.createObjectURL(xhr.response);
						self.audio.setAttribute('src', URL.createObjectURL(xhr.response));

						// autoDestory设置则播放完后移除audio的dom对象
						
						if (opt.autoDestory) {
							self.audio.onended = function() {
								self.audio.pause();
								self.audio.src = null;
								self.isPlay = false;
							}
						}
						//self.audio.play();
						self.isFunction(opt.onSuccess) && opt.onSuccess(self.audio);
					}

					// 用来处理错误
					if (xhr.response.type === 'application/json') {
						frd.onload = function(){
							var text = frd.result;
							self.isFunction(opt.onError) && opt.onError(text);
						};
						frd.readAsText(xhr.response);
					}
				}
			}
		}
	}
    // 判断是否是函数
    isFunction(obj) {
        if (Object.prototype.toString.call(obj) === '[object Function]') {
            return true;
        }
        return false;
    }
}
module.exports = BaiDuTTS;