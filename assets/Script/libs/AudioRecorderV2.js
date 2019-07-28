var Resampler = require('Resampler');
var AudioContext = window.AudioContext || window.webkitAudioContext;
'use strict';
class AudioRecorderV2 {
	
	constructor(config) {
		this.bufferSize = config.bufferSize||4096;
		this.sampleRate = config.sampleRate || 44100;
		this.desiredSampRate = config.desiredSampRate || 16000;
		this.stopSuccess = config.stopSuccess || null;
		this.startSuccess = config.startSuccess || null;
		this.numberOfAudioChannels = config.numberOfAudioChannels || 1;
		this.leftChannel = [];
		this.rightChannel = [];
		this.supportRecorder = false;
		this.recording = false;
		this.jsAudioNode = null;
		this.audioInput = null;
		this.recordingLength = 0;
		this.isPaused = false;
		this.context = null;
		this.isAudioProcessStarted = false;
		this.resmapler = new Resampler(this.sampleRate, this.desiredSampRate, this.numberOfAudioChannels, this.bufferSize);
	}

	initialize(){
		this.recording = false;
		this.isPaused = false;
		this.recordingLength = 0;
		this.leftChannel = [];
		this.rightChannel = [];
		this.isAudioProcessStarted = false;
		if(this.context){
			this.context.close();
		}
	}

	microphone(){
		navigator.mediaDevices.getUserMedia({ audio: true })
		.then((stream)=>{
			this.supportRecorder = true;
			console.log('获取权限成功!');
		})
		.catch((err)=>{
			this.supportRecorder = false;
			console.log(err);
		});
	}
	
	start(){
		if(this.supportRecorder == false){
			return;
		}
		this.initialize();
		navigator.mediaDevices.getUserMedia({ audio: true })
		.then((stream)=>{
			console.log('开始录音！');
			this.context = new AudioContext();
			if (this.context.createJavaScriptNode) {
				this.jsAudioNode = this.context.createJavaScriptNode(this.bufferSize, this.numberOfAudioChannels, this.numberOfAudioChannels);
			} else if (this.context.createScriptProcessor) {
				this.jsAudioNode = this.context.createScriptProcessor(this.bufferSize, this.numberOfAudioChannels, this.numberOfAudioChannels);
			} else {
				throw 'WebAudio API has no support on this browser.';
			}
			this.recording = true;
			this.jsAudioNode.connect(this.context.destination);
			this.audioInput = this.context.createMediaStreamSource(stream);
			this.audioInput.connect(this.jsAudioNode);
			this.jsAudioNode.onaudioprocess = (event) =>{
				if (this.isPaused) {
					return;
				}

				if (!this.recording) {
					return;
				}

				if (!this.isAudioProcessStarted) {
					this.isAudioProcessStarted = true;
				}

				var left = event.inputBuffer.getChannelData(0);

				// we clone the samples
				var releft = this.resmapler.resample(left);
				this.leftChannel.push(new Float32Array(releft));

				if (this.numberOfAudioChannels === 2) {
					var right = event.inputBuffer.getChannelData(1);
					var reright = this.resmapler.resample(right);
					this.rightChannel.push(new Float32Array(reright));
				}

				this.recordingLength += this.bufferSize;
				console.log('leftChannel size:',this.leftChannel.length);
			}
			if(this.startSuccess){
				this.startSuccess();
			}
		})
		.catch((err)=>{
			console.log(err);
		})
	}
	
	stop(){
		console.log('停止录音！');
		if(this.recording == false){
			return;
		}
        // to make sure onaudioprocess stops firing
		if(this.audioInput && this.jsAudioNode){
			this.audioInput.disconnect();
			this.jsAudioNode.disconnect();
			this.jsAudioNode.onaudioprocess = null;
		}
		this.recording = false;
		console.log(this.sampleRate,this.numberOfAudioChannels,this.recordingLength);
		this.encodeWave((buffer,view) =>{
			this.stopSuccess && this.stopSuccess(buffer);
			this.initialize();
		});
	}

	encodeWave(callback){
        var numberOfAudioChannels = this.numberOfAudioChannels;
		//复制对象
		var leftBuffers = this.leftChannel.slice(0);
        var rightBuffers = this.rightChannel.slice(0);

        var internalInterleavedLength = this.recordingLength;
        if (numberOfAudioChannels === 2) {
            leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
            rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength);
        }

        if (numberOfAudioChannels === 1) {
            leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
		}
		//合并数据
        function mergeBuffers(channelBuffer, rLength) {
            var result = new Float64Array(rLength);
            var offset = 0;
            var lng = channelBuffer.length;
			console.log(rLength,lng);
            for (var i = 0; i < lng; i++) {
				var buffer = channelBuffer[i];
				result.set(buffer, offset);
				offset += buffer.length;
			}

            return result;
        }
		//双声道数据合并
		function interleave(leftChannel, rightChannel) {
			var length = leftChannel.length + rightChannel.length;
			var result = new Float64Array(length);
			var inputIndex = 0;
			for (var index = 0; index < length;) {
				result[index++] = leftChannel[inputIndex];
				result[index++] = rightChannel[inputIndex];
				inputIndex++;
			}
			return result;
		}

		function writeUTFBytes(view, offset, string) {
			var lng = string.length;
			for (var i = 0; i < lng; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		}

		// interleave both channels together
		var interleaved;

		if (numberOfAudioChannels === 2) {
			interleaved = interleave(leftBuffers, rightBuffers);
		}

		if (numberOfAudioChannels === 1) {
			interleaved = leftBuffers;
		}

		var interleavedLength = interleaved.length;

		// create wav file
		var resultingBufferLength = 44 + interleavedLength * 2;

		var buffer = new ArrayBuffer(resultingBufferLength);

		var view = new DataView(buffer);

		// RIFF chunk descriptor/identifier
		writeUTFBytes(view, 0, 'RIFF');

		// RIFF chunk length
		view.setUint32(4, 44 + interleavedLength * 2, true);

		// RIFF type
		writeUTFBytes(view, 8, 'WAVE');

		// format chunk identifier
		// FMT sub-chunk
		writeUTFBytes(view, 12, 'fmt ');

		// format chunk length
		view.setUint32(16, 16, true);

		// sample format (raw)
		view.setUint16(20, 1, true);

		// stereo (2 channels)
		view.setUint16(22, numberOfAudioChannels, true);

		// sample rate
		view.setUint32(24, this.desiredSampRate, true);

		// byte rate (sample rate * block align)
		view.setUint32(28, this.desiredSampRate * 2, true);

		// block align (channel count * bytes per sample)
		view.setUint16(32, numberOfAudioChannels * 2, true);

		// bits per sample
		view.setUint16(34, 16, true);

		// data sub-chunk
		// data chunk identifier
		writeUTFBytes(view, 36, 'data');

		// data chunk length
		view.setUint32(40, interleavedLength * 2, true);

		// write the PCM samples
		var lng = interleavedLength;
		var index = 44;
		var volume = 1;
		for (var i = 0; i < lng; i++) {
			view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
			index += 2;
		}
		if (callback) {
			return callback(buffer,view);
		}
	}

}
module.exports = AudioRecorderV2;