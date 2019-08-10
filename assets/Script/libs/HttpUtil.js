var HttpUtil = HttpUtil || {
	//上传
    upload:function (url,data, callback) {
		var xhr = cc.loader.getXMLHttpRequest();
		if (callback) {
			xhr.upload.addEventListener("progress", function (e) {
				callback('uploading', e);
			}, false);
			xhr.addEventListener("load", function (e) {
				callback('ok', e);
			}, false);
			xhr.addEventListener("error", function (e) {
				callback('error', e);
			}, false);
			xhr.addEventListener("abort", function (e) {
				callback('cancel', e);
			}, false);
		
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
					callback('recg',xhr.responseText);
				}else{
					callback('recg',null);
				}
			};
		}
		xhr.open("POST", url);
		xhr.send(data);
    },
	get:function(url,param,cb){
		var xhr = cc.loader.getXMLHttpRequest();
		//var xhr = new XMLHttpRequest();
		if(param == null){
			xhr.open("GET", url,false);
		}else{
			xhr.open("GET", url + "?" + param,false);
		}
		console.log(url + "?" + param);
		xhr.setRequestHeader("Content-Type","application/json");
		xhr.onreadystatechange = function () {
			console.log('get',xhr);
			if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
				var result = JSON.parse(xhr.responseText);
				cb(null,result);
			}else{
				cb(xhr.status,null);
			}
		};
		xhr.send(null);
	},
	postJson:function(url,data, callback){
		var xhr = cc.loader.getXMLHttpRequest();
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type","application/json");
		if (callback) {
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
					callback(200,xhr.responseText);
				}else{
					callback(201,null);
				}
			};
		}
		xhr.send(data);
	},
	post:function(url,data,cb){
		var xhr = cc.loader.getXMLHttpRequest();
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type","application/json");
		xhr.onreadystatechange = function () {
			console.log('post',xhr.status);
			if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {            
				var result = JSON.parse(xhr.responseText);
				cb(xhr.status,result);
			}
		};
		xhr.send(data);
	}
};
module.exports = HttpUtil;