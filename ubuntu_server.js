var express = require('express')
var app = express();
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var bodyparser = require('body-parser');
var privateKey  = fs.readFileSync('./key.pem', 'utf8');
var certificate = fs.readFileSync('./cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
var PORT = 3001;
var SSLPORT = 3002;
var html;
httpServer.listen(PORT, function() {
    console.log('HTTP Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen(SSLPORT, function() {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});

var pathName = path.join(__dirname, './build/web-mobile');
app.use(express.static(pathName));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extende:true}));

app.post('/voice', function (req, res) {
    /*  form.parse(req, function(err, fields, files) {
     config(files)
     });*/
    var buffer = '';
    var chunks = [];
    var size = 0;
    req.on('data', function (chunk) {
        chunks.push(chunk);
        size += chunk.length;
    });
    req.on('end', function () {
        var data = null;
        switch (chunks.length) {
            case 0:
                data = Buffer.alloc(0);
                break;
            case 1:
                data = chunks[0];
                break;
            default:
                data = Buffer.alloc(size);
                for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                    var chunk = chunks[i];
                    chunk.copy(data, pos);
                    pos += chunk.length;
                }
                break;
        }
		var name = new Date().getTime();
		var des_file = __dirname + "/" + name + ".wav";
		fs.writeFile(des_file, data, function (err) {
			if( err ){
				console.log( err );
			}else{
				console.log('wirte success');
			}
		});
        config(res, data);
    });
});

app.post('/text', function (req, res) {
	var result = req.body;
	console.log(result);
	let option2 = {
		headers: {
			'Content-Type': 'application/json'
		},
		url: `http://58.67.161.51:28080/get_sresult`,
		method: "POST",
		json: true,
		body: result
	};

	function callback(err, response, data) {
		console.log(err,data);
		if (!err && data) {
			result = data && data.result||[];
			res.send(result);
		}
	}
	request(option2, callback)
});

var request = require('request');
var APP_ID = "16883004";
var API_KEY = "gyg2xqmDFzg3Svb1fFLbUuTE";
var SECRET_KEY = "6fG1C428KU9bPSYpqoU1739fKWz5LDmn";
var accessToken, result;
var cuid = 'mymacbookpromacaddress';
var config = function (res, bufData, socket) {
    var option1 = {
        url: `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`,
        method: 'GET',
        json: true
    };
	console.log(bufData.length);
    function callback1(err, response, data) {
		console.log(data);
        if (!err && data) {
            accessToken = data.access_token;
            let option2 = {
                headers: {
                    'Content-Type': 'audio/wav; rate=16000',
                    'Content-Length': bufData.length
                },
                url: `http://vop.baidu.com/pro_api?dev_pid=80001&cuid=${cuid}&token=${accessToken}`,
                method: "POST",
                json: true,
                formData: {
                    my_buffer: bufData
                }
            };

            function callback2(err, response, data) {
				console.log(err,data);
                if (!err && data) {
                    result = data && data.result||[];
                    html = result.join();
                    res.send(html);
                }
            }

            request(option2, callback2)
        }
    }

    request(option1, callback1);

};
