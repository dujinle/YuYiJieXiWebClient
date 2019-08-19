var AudioRecorderV2 = require('AudioRecorderV2');
var BaiDuTTS = require('BaiDuTTS');
var HttpUtil = require('HttpUtil');
var TextViewManager = require('TextViewManager');
var NaoZhongManager = require('NaoZhongManager');
var LaJiFenLeiManager = require('LaJiFenLeiManager');
cc.Class({
    extends: cc.Component,

    properties: {
		audioSource:cc.Node,
        leftTextInfo:cc.Node,
		rightTextInfo:cc.Node,
		scrollView:cc.Node,
		changjing:cc.Node,
		
		voiceInput:cc.Node,
		textInput:cc.Node,
		textEdit:cc.EditBox,
		videoPlayer:cc.Node,
		//-------以下场景对象数据----------//
		defaultScene:'LaJiFenLei',	//当前的场景
		recorder:null,				//录音对象句柄
		naozhongMager:null,			//闹钟对象句柄
		ljflMager:null,				//垃圾分类对象句柄
		defaultInput:'Text',
		inputButton:cc.Node,
		//场景节点
		myScene:{
			type:cc.Node,
			default:[]
		},
		textStr:'',
    },

    // use this for initialization
    onLoad: function () {
		this.changjing.active = false;
        if(this.defaultInput == 'Text'){
			this.inputButton.getChildByName('zitiBg').active = true;
			this.inputButton.getChildByName('voiceBg').active = false;
			this.textInput.active = true;
			this.voiceInput.active = false;
		}else{
			this.inputButton.getChildByName('zitiBg').active = false;
			this.inputButton.getChildByName('voiceBg').active = true;
			this.textInput.active = false;
			this.voiceInput.active = true;
		}
		this.voiceInput.on(cc.Node.EventType.TOUCH_START, this.recOpen, this);
		this.voiceInput.on(cc.Node.EventType.TOUCH_END, this.recStop, this);
		this.voiceInput.on(cc.Node.EventType.TOUCH_CANCEL, this.recCancel, this);
		this.recorder = new AudioRecorderV2({
			stopSuccess:this.stopRecorderSuccess.bind(this),
			startSuccess:()=>{
				this.audioSource.getComponent(cc.AudioSource).play();
			},
			desiredSampRate:16000,
			sampleRate:44100,
			numberOfAudioChannels:1
		});
		this.tvManager = new TextViewManager(this.scrollView);
		this.tvManager.initialize();
		this.customScreenAdapt();
		this.switchScene();
		this.sceneMap = {
			NaoZhong:'Alarm',
			LaJiFenLei:'LJFL'
		}
		this.btts = new BaiDuTTS(this.videoPlayer);
    },
	//用于切换输入UI控制 语音或者汉字
	switchInput:function(event){
		var self = this;
		if(this.defaultInput == 'YuYin'){
			this.inputButton.getChildByName('zitiBg').active = true;
			this.inputButton.getChildByName('voiceBg').active = false;
			this.defaultInput = 'Text';
			this.textInput.active = true;
			this.voiceInput.active = false;
		}else{
			this.defaultInput = 'YuYin';
			this.inputButton.getChildByName('zitiBg').active = false;
			this.inputButton.getChildByName('voiceBg').active = true;
			this.textInput.active = false;
			this.voiceInput.active = true;
			this.recorder.microphone();
		}
	},
	//场景进行切换
	switchScene:function(){
		for(var i = 0;i < this.myScene.length;i++){
			if(this.myScene[i].name == this.defaultScene){
				this.myScene[i].active = true;
				if(this.defaultScene == 'NaoZhong'){
					if(this.naozhongMager == null){
						this.naozhongMager = new NaoZhongManager(this.myScene[i]);
						this.naozhongMager.initialize();
					}
				}else if(this.defaultScene == 'LaJiFenLei'){
					if(this.ljflMager == null){
						this.ljflMager = new LaJiFenLeiManager(this.myScene[i]);
						this.ljflMager.initialize();
					}
				}
			}else{
				this.myScene[i].active = false;
			}
		}
	},
	openSceneSelect:function(){
		console.log()
		var self = this;
		this.changjing.active = true;
		var size = this.changjing.getContentSize();
		var pos = this.changjing.getPosition();
		//场景出来吧
		this.changjing.setPosition(pos.x,pos.y -size.height);
		this.changjing.runAction(cc.moveTo(0.3,pos));
		//事件回调处理
		this.touchStart = function(event){
			console.log(event);
			if(event.target.name == 'back'){
				this.changjing.runAction(cc.sequence(
					cc.moveTo(0.3,cc.v2(pos.x,pos.y - size.height)),
					cc.callFunc(()=>{
						this.changjing.active = false;
						this.changjing.setPosition(pos);
						back.off(cc.Node.EventType.TOUCH_START,this.touchStart,this);
						ditu.off(cc.Node.EventType.TOUCH_START,this.touchStart,this);
						lajifenlei.off(cc.Node.EventType.TOUCH_START,this.touchStart,this);
						naozhong.off(cc.Node.EventType.TOUCH_START,this.touchStart,this);
					},this)));
			}else if(event.target.name == 'ditu'){
				this.defaultScene = 'DiTu';
				this.switchScene();
			}else if(event.target.name == 'lajifenlei'){
				this.defaultScene = 'LaJiFenLei';
				this.switchScene();
			}else if(event.target.name == 'naozhong'){
				this.defaultScene = 'NaoZhong';
				this.switchScene();
			}
		};

		var back = this.changjing.getChildByName('back');
		back.on(cc.Node.EventType.TOUCH_START,this.touchStart,this);
		//地图场景
		var ditu = this.changjing.getChildByName('itemLayout').getChildByName('ditu');
		ditu.on(cc.Node.EventType.TOUCH_START,this.touchStart,this);
		//垃圾分类场景
		var lajifenlei = this.changjing.getChildByName('itemLayout').getChildByName('lajifenlei');
		lajifenlei.on(cc.Node.EventType.TOUCH_START,this.touchStart,this);
		//闹钟场景
		var naozhong = this.changjing.getChildByName('itemLayout').getChildByName('naozhong');
		naozhong.on(cc.Node.EventType.TOUCH_START,this.touchStart,this);
		
	},
	eidtChange:function(instr){
		this.textStr = instr;
	},
	eidtEnd:function(event){
		//this.tvManager.addText(this.textStr,'LEFT');
	},
	eidtReturn:function(event){
		this.btts.init();
		this.tvManager.addText(this.textStr,'LEFT');
		this.updateText(this.textStr);
	},
	recOpen:function(){
		console.log('recOpen');
		this.voiceInput.opacity = 180;
		this.recorder.start();
		this.btts.init();
	},
	recCancel:function(){
		console.log('recCancel');
		this.voiceInput.opacity = 255;
	},
	recStop:function(){
		console.log('recStop');
		this.voiceInput.opacity = 255;
		this.recorder.stop();
	},
	stopRecorderSuccess:function(data){
		var self = this;
		console.log('stopRecorderSuccess',data);
		HttpUtil.upload('/voice',data,function (state, e) {
            switch (state) {
                case 'uploading':
                    //var percentComplete = Math.round(e.loaded * 100 / e.total) + '%';
                    break;
                case 'ok':
                    //alert(e.target.responseText);
                    console.log("上传成功");
                    break;
                case 'error':
                     console.log("上传失败");
                    break;
                case 'cancel':
                     console.log("上传被取消");
                    break;
				case 'recg':
					console.log('recg',e);
					if(e != null){
						self.textStr = e;
						self.tvManager.addText(self.textStr,'LEFT');
						self.updateText(self.textStr);
					}
					break;
            }
        });
	},
	/*上传数据到语义解析引擎*/
	updateText(text){
		var self = this;
		var data = {
			text:text,
			scene:this.sceneMap[this.defaultScene]
		};
		HttpUtil.postJson('/text',JSON.stringify(data),function (state, e) {
			if(e != null){
				var res = JSON.parse(e);
				if(res.result != null && res.result.msg != null){
					self.textStr = res.result.msg;
					if(self.btts != null){
						self.btts.tts(self.textStr);
					}
					self.tvManager.addText(self.textStr,'RIGHT');
					if(self.defaultScene == 'NaoZhong'){
						self.naozhongMager.onprocess(res);
					}else if(self.defaultScene == 'LaJiFenLei'){
						self.ljflMager.onprocess(res);
					}else{
						console.log(res);
					}
				}
			}
        });
	},
	customScreenAdapt(){
		var DesignWidth = 720;
		var DesignHeight = 1280;
		let size = cc.winSize;
		cc.view.setDesignResolutionSize(size.width, size.height, cc.ResolutionPolicy.FIXED_WIDTH);
		this.node.scaleX = size.width / 720;
		this.node.scaleY = size.height / 1280;
	},
});
