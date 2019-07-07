var express = require('express');
var app = express();
var multer = require('multer');
var util = require('util');
var handFile = require('./handFile');
var path = require('path');
var sqlBusiness = require('./sqlBusiness')
// multer 初始化
let upload = multer({
    dest: 'tmp'
});

//time
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份 
        "d+": this.getDate(),                    //日 
        "h+": this.getHours(),                   //小时 
        "m+": this.getMinutes(),                 //分 
        "s+": this.getSeconds(),                 //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}



// express
var host, port;

var server = app.listen(8888, 'localhost', function () {
    host = server.address().address
    port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})



app.get('/index.html', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
})


app.post('/upload', upload.any(), function (req, res) {
    // console.log('123' + util.inspect(req));

    var resData = {
        'code': -1,
        'msg': '上传失败'
    };
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });
    if (req.files[0] == undefined) {
        resData = {
            'code': -1,
            'msg': '上传的文件为空，请检查'
        };
        res.end(JSON.stringify(resData));
        return;
    }
    let currentDate = new Date().format("yyyy-MM-dd-hh-mm-ss");
    var destDir = path.join('store', currentDate);// 本地存储路径

    // ipa
    handFile.handleIPAInfo(destDir, req.files[0], function (ipaPath) {
        if (!ipaPath) {
            resData = {
                'code': -1,
                'msg': '服务器，ipa 文件处理失败'
            };
            res.end(JSON.stringify(resData));
            return;
        }
        // plist
        let baseURL = 'http://' + host + ':' + port;
        let ipaURL = path.join(baseURL, ipaPath);
        let plistPath = handFile.handlePlist(destDir, ipaURL)

        // 数据库存储
        let plistURL = path.join(baseURL, plistPath);

        sqlBusiness.saveIpa('MAMTest', '2.5.4', '0.0.1', '就是版本提测啦', plistURL, currentDate, function (isSuccess) {
            if (isSuccess) {
                console.log('上传成功');

                resData = {
                    'code': 0000,
                    'msg': '上传成功'
                };
                res.end(JSON.stringify(resData));

            } else {
                resData = {
                    'code': -1,
                    'msg': '存储错误'
                };
                res.end(JSON.stringify(resData));

            }
        })
    });


})

/*
   {
       fieldname: 'image',
       originalname: 'MAMTest.ipa',
       encoding: '7bit',
       mimetype: 'application/octet-stream',
       destination: 'dest',
       filename: '82bfecb7b3140bf51397890ca04326bb',
       path: 'dest/82bfecb7b3140bf51397890ca04326bb',
       size: 13355288
   }
   */
