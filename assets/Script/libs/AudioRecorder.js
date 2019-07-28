var AudioContext = window.AudioContext || window.webkitAudioContext;
function AudioRecorder(config) {

    config = config || {};
	//对象变量长久维持
	instance = {
		mediaStream:null,
		bufferSize:config.bufferSize || 4096,
		sampleRate:config.sampleRate || 44100,
		numberOfAudioChannels:config.numberOfAudioChannels || 2,
	};
	resmapler = new Resampler(instance.sampleRate, 16000, instance.numberOfAudioChannels, instance.bufferSize),
	tmpObjs = {
		audioCTX:null,
		leftChannel:[],
		rightChannel:[],
		audioInput:null,
		jsAudioNode:null,
		recording:false,
		recordingLength:0,
		isPaused:false,
		isAudioProcessStarted:false,
	};
    var self = this;

	//开始录音准备
    this.start = function () {
		this.microphoneCaptured();
		setAudioContext();
		if(instance.mediaStream){
			tmpObjs.audioInput = tmpObjs.audioCTX.createMediaStreamSource(instance.mediaStream);
			tmpObjs.audioInput.connect(tmpObjs.jsAudioNode);
			tmpObjs.jsAudioNode.onaudioprocess = onAudioProcess;
			if(config.startSuccess){
				config.startSuccess();
			}
			tmpObjs.recording = true;
		}
    };
	//获取录音权限
	this.microphoneCaptured = function(){
		console.log('microphoneCaptured',instance.mediaStream);
		navigator.mediaDevices.getUserMedia({ audio: true })
			.then(onMicrophoneCaptured)
			.catch(onMicrophoneCaptureError);
	};
    this.stop = function(){
        stopRecording(function(blob){
            console.log('stop recording',blob);
			if(config.stopSuccess){
				config.stopSuccess(blob);
			}
        });
    };

    function stopRecording(callback) {
        // stop recording
		if(tmpObjs.recording == false){
			return;
		}
        tmpObjs.recording = false;
        // to make sure onaudioprocess stops firing
        tmpObjs.audioInput.disconnect();
        tmpObjs.jsAudioNode.disconnect();
		console.log(instance.sampleRate,instance.numberOfAudioChannels,tmpObjs.recordingLength);
		var conf = {
            sampleRate: config.desiredSampRate,
			//desiredSampRate:config.desiredSampRate,
            numberOfAudioChannels: instance.numberOfAudioChannels,
            internalInterleavedLength: tmpObjs.recordingLength,
            leftBuffers: tmpObjs.leftChannel,
            rightBuffers: instance.numberOfAudioChannels === 1 ? [] : tmpObjs.rightChannel
        };
        mergeLeftRightBuffers(conf, function (buffer, view) {
            callback && callback(buffer);
            clearRecordedData();
            tmpObjs.isAudioProcessStarted = false;
        });
    }

    function clearRecordedData() {
		tmpObjs.jsAudioNode = null;
		tmpObjs.jsAudioNode = null;
        tmpObjs.leftChannel = [];
		tmpObjs.rightChannel = [];
        tmpObjs.recordingLength = 0;
        tmpObjs.isAudioProcessStarted = false;
        tmpObjs.recording = false;
        tmpObjs.isPaused = false;
		console.log('clearRecordedData',tmpObjs.recordingLength);
    }

    function setAudioContext() {
		tmpObjs.audioCTX = new AudioContext();
		if (tmpObjs.audioCTX.createJavaScriptNode) {
			tmpObjs.jsAudioNode = tmpObjs.audioCTX.createJavaScriptNode(instance.bufferSize, instance.numberOfAudioChannels, instance.numberOfAudioChannels);
		} else if (tmpObjs.audioCTX.createScriptProcessor) {
			tmpObjs.jsAudioNode = tmpObjs.audioCTX.createScriptProcessor(instance.bufferSize, instance.numberOfAudioChannels, instance.numberOfAudioChannels);
		} else {
			throw 'WebAudio API has no support on this browser.';
		}
		tmpObjs.jsAudioNode.connect(tmpObjs.audioCTX.destination);
    }

    function onMicrophoneCaptured(microphone) {
        instance.mediaStream = microphone;
		return;
		tmpObjs.audioInput = tmpObjs.audioCTX.createMediaStreamSource(instance.mediaStream);
		tmpObjs.audioInput.connect(tmpObjs.jsAudioNode);
		tmpObjs.jsAudioNode.onaudioprocess = onAudioProcess;
		if(config.startSuccess){
			config.startSuccess();
		}
		tmpObjs.recording = true;
    }

    function onMicrophoneCaptureError() {
        console.log("There was an error accessing the microphone. You may need to allow the browser access");
    }

    function onAudioProcess(e) {
        if (tmpObjs.isPaused) {
            return;
        }

        if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
                console.log('MediaStream seems stopped.');
            }
        }

        if (!tmpObjs.recording) {
            return;
        }

        if (!tmpObjs.isAudioProcessStarted) {
            tmpObjs.isAudioProcessStarted = true;
            if (config.onAudioProcessStarted) {
                config.onAudioProcessStarted();
            }

            if (config.initCallback) {
                config.initCallback();
            }
        }

        var left = e.inputBuffer.getChannelData(0);

        // we clone the samples
		var releft = resmapler.resample(left);
        tmpObjs.leftChannel.push(new Float32Array(releft));

        if (instance.numberOfAudioChannels === 2) {
            var right = e.inputBuffer.getChannelData(1);
			var reright = resmapler.resample(right);
            tmpObjs.rightChannel.push(new Float32Array(reright));
        }

        tmpObjs.recordingLength += instance.bufferSize;
		console.log('leftChannel size:',tmpObjs.leftChannel.length);
    }

    function isMediaStreamActive() {
        if (config.checkForInactiveTracks === false) {
            // always return "true"
            return true;
        }

        if ('active' in instance.mediaStream) {
            if (!instance.mediaStream.active) {
                return false;
            }
        } else if ('ended' in instance.mediaStream) { // old hack
            if (instance.mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

	//callback(buffer,view)
    function mergeLeftRightBuffers(config, callback) {
        
		function mergeAudioBuffers(config, cb) {
            var numberOfAudioChannels = config.numberOfAudioChannels;

            // todo: "slice(0)" --- is it causes loop? Should be removed?
			//复制对象
            var leftBuffers = config.leftBuffers.slice(0);
            var rightBuffers = config.rightBuffers.slice(0);
            var sampleRate = config.sampleRate;
            var internalInterleavedLength = config.internalInterleavedLength;
            var desiredSampRate = config.desiredSampRate;
			console.log('mergeAudioBuffers',desiredSampRate);
            if (numberOfAudioChannels === 2) {
                leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
                rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength);
                if (desiredSampRate) {
                    leftBuffers = interpolateArray(leftBuffers, desiredSampRate, sampleRate);
                    rightBuffers = interpolateArray(rightBuffers, desiredSampRate, sampleRate);
                }
            }

            if (numberOfAudioChannels === 1) {
                leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
                if (desiredSampRate) {
                    leftBuffers = interpolateArray(leftBuffers, desiredSampRate, sampleRate);
                }
            }

            // set sample rate as desired sample rate
            if (desiredSampRate) {
                sampleRate = desiredSampRate;
            }

            // for changing the sampling rate, reference:
            // http://stackoverflow.com/a/28977136/552182
            function interpolateArray(data, newSampleRate, oldSampleRate) {
                var fitCount = Math.round(data.length * (newSampleRate / oldSampleRate));
                //var newData = new Array();
                var newData = [];
                //var springFactor = new Number((data.length - 1) / (fitCount - 1));
                var springFactor = Number((data.length - 1) / (fitCount - 1));
                newData[0] = data[0]; // for new allocation
                for (var i = 1; i < fitCount - 1; i++) {
                    var tmp = i * springFactor;
                    //var before = new Number(Math.floor(tmp)).toFixed();
                    //var after = new Number(Math.ceil(tmp)).toFixed();
                    var before = Number(Math.floor(tmp)).toFixed();
                    var after = Number(Math.ceil(tmp)).toFixed();
                    var atPoint = tmp - before;
                    newData[i] = linearInterpolate(data[before], data[after], atPoint);
                }
                newData[fitCount - 1] = data[data.length - 1]; // for new allocation
                return newData;
            }

            function linearInterpolate(before, after, atPoint) {
                return before + (after - before) * atPoint;
            }

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
            view.setUint32(24, sampleRate, true);

            // byte rate (sample rate * block align)
            view.setUint32(28, sampleRate * 2, true);

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
            if (cb) {
                return cb(buffer,view);
            }
        }
		mergeAudioBuffers(config,callback);
    }
}

class Resampler {
  constructor(fromSampleRate, toSampleRate, channels, inputBufferSize) {
    
    if (!fromSampleRate || !toSampleRate || !channels) {
      throw(new Error("Invalid settings specified for the resampler."));
    }
    this.resampler       = null;
    this.fromSampleRate  = fromSampleRate;
    this.toSampleRate    = toSampleRate;
    this.channels        = channels || 0;
    this.inputBufferSize = inputBufferSize;
    this.initialize()
  }
  
  initialize() {
    if (this.fromSampleRate == this.toSampleRate) {
      
      // Setup resampler bypass - Resampler just returns what was passed through
      this.resampler   = (buffer) => {
        return buffer
      };
      this.ratioWeight = 1;
      
    } else {
      
      if (this.fromSampleRate < this.toSampleRate) {
        
        // Use generic linear interpolation if upsampling,
        // as linear interpolation produces a gradient that we want
        // and works fine with two input sample points per output in this case.
        this.linearInterpolation();
        this.lastWeight = 1;
        
      } else {
        
        // Custom resampler I wrote that doesn't skip samples
        // like standard linear interpolation in high downsampling.
        // This is more accurate than linear interpolation on downsampling.
        this.multiTap();
        this.tailExists = false;
        this.lastWeight = 0;
      }
      
      // Initialize the internal buffer:
      this.initializeBuffers();
      this.ratioWeight = this.fromSampleRate / this.toSampleRate;
    }
  }
  
  bufferSlice(sliceAmount) {
    
    //Typed array and normal array buffer section referencing:
    try {
      return this.outputBuffer.subarray(0, sliceAmount);
    }
    catch (error) {
      try {
        //Regular array pass:
        this.outputBuffer.length = sliceAmount;
        return this.outputBuffer;
      }
      catch (error) {
        //Nightly Firefox 4 used to have the subarray function named as slice:
        return this.outputBuffer.slice(0, sliceAmount);
      }
    }
  }
  
  initializeBuffers() {
    this.outputBufferSize = (Math.ceil(this.inputBufferSize * this.toSampleRate / this.fromSampleRate / this.channels * 1.000000476837158203125) + this.channels) + this.channels;
    try {
      this.outputBuffer = new Float32Array(this.outputBufferSize);
      this.lastOutput   = new Float32Array(this.channels);
    }
    catch (error) {
      this.outputBuffer = [];
      this.lastOutput   = [];
    }
  }
  
  linearInterpolation() {
    this.resampler = (buffer) => {
      let bufferLength = buffer.length,
          channels     = this.channels,
          outLength,
          ratioWeight,
          weight,
          firstWeight,
          secondWeight,
          sourceOffset,
          outputOffset,
          outputBuffer,
          channel;
      
      if ((bufferLength % channels) !== 0) {
        throw(new Error("Buffer was of incorrect sample length."));
      }
      if (bufferLength <= 0) {
        return [];
      }
      
      outLength    = this.outputBufferSize;
      ratioWeight  = this.ratioWeight;
      weight       = this.lastWeight;
      firstWeight  = 0;
      secondWeight = 0;
      sourceOffset = 0;
      outputOffset = 0;
      outputBuffer = this.outputBuffer;
      
      for (; weight < 1; weight += ratioWeight) {
        secondWeight    = weight % 1;
        firstWeight     = 1 - secondWeight;
        this.lastWeight = weight % 1;
        for (channel = 0; channel < this.channels; ++channel) {
          outputBuffer[outputOffset++] = (this.lastOutput[channel] * firstWeight) + (buffer[channel] * secondWeight);
        }
      }
      weight -= 1;
      for (bufferLength -= channels, sourceOffset = Math.floor(weight) * channels; outputOffset < outLength && sourceOffset < bufferLength;) {
        secondWeight = weight % 1;
        firstWeight  = 1 - secondWeight;
        for (channel = 0; channel < this.channels; ++channel) {
          outputBuffer[outputOffset++] = (buffer[sourceOffset + ((channel > 0) ? (channel) : 0)] * firstWeight) + (buffer[sourceOffset+(channels + channel)] * secondWeight);
        }
        weight += ratioWeight;
        sourceOffset = Math.floor(weight) * channels;
      }
      for (channel = 0; channel < channels; ++channel) {
        this.lastOutput[channel] = buffer[sourceOffset++];
      }
      return this.bufferSlice(outputOffset);
    };
  }
  
  multiTap() {
    this.resampler = (buffer) => {
      let bufferLength = buffer.length,
          outLength,
          output_variable_list,
          channels     = this.channels,
          ratioWeight,
          weight,
          channel,
          actualPosition,
          amountToNext,
          alreadyProcessedTail,
          outputBuffer,
          outputOffset,
          currentPosition;
      
      if ((bufferLength % channels) !== 0) {
        throw(new Error("Buffer was of incorrect sample length."));
      }
      if (bufferLength <= 0) {
        return [];
      }
      
      outLength            = this.outputBufferSize;
      output_variable_list = [];
      ratioWeight          = this.ratioWeight;
      weight               = 0;
      actualPosition       = 0;
      amountToNext         = 0;
      alreadyProcessedTail = !this.tailExists;
      this.tailExists      = false;
      outputBuffer         = this.outputBuffer;
      outputOffset         = 0;
      currentPosition      = 0;
      
      for (channel = 0; channel < channels; ++channel) {
        output_variable_list[channel] = 0;
      }
      
      do {
        if (alreadyProcessedTail) {
          weight = ratioWeight;
          for (channel = 0; channel < channels; ++channel) {
            output_variable_list[channel] = 0;
          }
        } else {
          weight = this.lastWeight;
          for (channel = 0; channel < channels; ++channel) {
            output_variable_list[channel] = this.lastOutput[channel];
          }
          alreadyProcessedTail = true;
        }
        while (weight > 0 && actualPosition < bufferLength) {
          amountToNext = 1 + actualPosition - currentPosition;
          if (weight >= amountToNext) {
            for (channel = 0; channel < channels; ++channel) {
              output_variable_list[channel] += buffer[actualPosition++] * amountToNext;
            }
            currentPosition = actualPosition;
            weight -= amountToNext;
          } else {
            for (channel = 0; channel < channels; ++channel) {
              output_variable_list[channel] += buffer[actualPosition + ((channel > 0) ? channel : 0)] * weight;
            }
            currentPosition += weight;
            weight = 0;
            break;
          }
        }
        
        if (weight === 0) {
          for (channel = 0; channel < channels; ++channel) {
            outputBuffer[outputOffset++] = output_variable_list[channel] / ratioWeight;
          }
        } else {
          this.lastWeight = weight;
          for (channel = 0; channel < channels; ++channel) {
            this.lastOutput[channel] = output_variable_list[channel];
          }
          this.tailExists = true;
          break;
        }
      } while (actualPosition < bufferLength && outputOffset < outLength);
      return this.bufferSlice(outputOffset);
    };
  }
  
  resample(buffer) {
    if (this.fromSampleRate == this.toSampleRate) {
      this.ratioWeight = 1;
    } else {
      if (this.fromSampleRate < this.toSampleRate) {
        this.lastWeight = 1;
      } else {
        this.tailExists = false;
        this.lastWeight = 0;
      }
      this.initializeBuffers();
      this.ratioWeight = this.fromSampleRate / this.toSampleRate;
    }
    return this.resampler(buffer)
  }
}
