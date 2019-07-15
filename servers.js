var express = require('express');
var app = express();
var multer = require('multer');
var util = require('util');
var handFile = require('./handFile');
var path = require('path');
var sqlBusiness = require('./sqlBusiness')
var fs = require('fs');
var https = require('https');
var http = require('http');
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

//获取本机ip地址
function getIPAdress() {
    let interfaces = require('os').networkInterfaces();　　
    for (let devName in interfaces) {　　　　
        let iface = interfaces[devName];　　　　　　
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }　　
    }
}

// express
app.use(express.static(__dirname + 'source/certificate'));
app.use('/store',express.static(__dirname + '/store'));


let options = {
    key: fs.readFileSync('.source/certificate/privateCA.pem', 'utf8'),
    cert: fs.readFileSync('.source/certificate/myCA.cer', 'utf8')
};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);


var host = getIPAdress();// 自己的 ip
var httpsPort = 8886;
var httpPort = 8888;
// https
httpsServer.listen(httpsPort, host, function () {

    console.log("应用实例，访问地址为 https://%s:%s", host, httpsPort)

})
// http
httpServer.listen(httpPort, host, function () {

    console.log("应用实例，访问地址为 http://%s:%s", host, httpPort)

})



app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
})
app.get('/index.html', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
})
app.get('/ipaList.html', function (req, res) {
    res.sendFile(__dirname + "/" + "ipaList.html");
})

/**
 * 读取列表
 * pageNum:num 
 * pageSize:num
 */
app.get('/list', function (req, res) {
    var resData = {
        'code': -1,
        'msg': '参数错误'
    };
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });
    if(!(req.query.pageNum && req.query.pageNum > 0) || !(req.query.pageSize && req.query.pageSize >0)){
        res.end(JSON.stringify(resData));
        return;
    }

    let pageNum = req.query.pageNum;
    let pageSize = req.query.pageSize;
    sqlBusiness.readListOfIpaInfo(pageNum,pageSize ,function (result){
        if(!result){
            res.end(JSON.stringify(resData));
            return;
        }
        var resData = {
            'code': 0,
            'msg': '查询成功',
            'data':JSON.stringify(result)
        };
        res.end(JSON.stringify(resData));
    })

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
        let baseURL = `https://${host}:${httpsPort}`;
        let ipaURL = baseURL + '/' + ipaPath;
        let plistPath = handFile.handlePlist(destDir, ipaURL)

        // 数据库存储
        let plistURL = baseURL + '/' +plistPath;

        sqlBusiness.saveIpaInfo('MAMTest', '2.5.4', '0.0.1', '就是版本提测啦', plistURL, currentDate, function (isSuccess) {
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
