var express = require("express");
var app = express();
var multer = require("multer");
var util = require("util");
var handFile = require("./handFile");
var path = require("path");
var sqlBusiness = require("./sqlBusiness");
var fs = require("fs");
var https = require("https");
var http = require("http");
// multer 初始化
let upload = multer({
    dest: "tmp"
});

//time
Date.prototype.format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        S: this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(
            RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length)
        );
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
            );
        }
    }
    return fmt;
};

//获取本机ip地址
function getIPAdress() {
    let interfaces = require("os").networkInterfaces();
    for (let devName in interfaces) {
        let iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (
                alias.family === "IPv4" &&
                alias.address !== "127.0.0.1" &&
                !alias.internal
            ) {
                return alias.address;
            }
        }
    }
}

// express
app.use(express.static(__dirname + "/source/certificate"));
app.use("/store", express.static(__dirname + "/store"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
// app.use("/projectConfig", express.static(__dirname + "/source/projectJSON"));

app.use(express.static(__dirname + "/Fornt"));

let options = {
    key: fs.readFileSync("./source/certificate/privateCA.pem", "utf8"),
    cert: fs.readFileSync("./source/certificate/myCA.cer", "utf8")
};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);

var host = getIPAdress(); // 自己的 ip
var httpsPort = 8886;
var httpPort = 8888;

var baseURL = "";
// https
httpsServer.listen(httpsPort, host, function() {
    console.log("应用实例，访问地址为 https://%s:%s", host, httpsPort);
});
// http
httpServer.listen(httpPort, host, function() {
    console.log("应用实例，访问地址为 http://%s:%s", host, httpPort);
    baseURL = `https://${host}:${httpsPort}`;
});

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/" + "Fornt/projectManager/HTML/projectManager.html");
});
app.get("/upload.html", function(req, res) {
    res.sendFile(__dirname + "/" + "upload.html");
});
app.get("/ipaList.html", function(req, res) {
    res.sendFile(__dirname + "/" + "Fornt/download/HTML/ipaList.html");
});
app.get("/secretRoot.html", function(req, res) {
    res.sendFile(__dirname + "/" + "secretRoot.html");
});

/**
 * 读取列表
 * pageNum:num
 * pageSize:num
 */
app.get("/list", function(req, res) {
    var resData = {
        code: -1,
        msg: "参数错误"
    };
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });
    let pageNum = req.query.pageNum;
    let pageSize = req.query.pageSize;
    let project = req.query.project;
    let os = req.query.os;
    if (!(os && os.length > 0) ||
        !(project && project.length > 0) ||
        !(pageNum && pageNum > 0) ||
        !(pageSize && pageSize > 0)
    ) {
        res.end(JSON.stringify(resData));
        return;
    }

    sqlBusiness.readListOfIpaInfo(project, os, pageNum, pageSize, function(
        result
    ) {
        if (!result) {
            res.end(JSON.stringify(resData));
            return;
        }
        // 动态处理下载列表中的域名地址-防止 ip 地址被更换
        result.forEach(element => {
            element.resourceURL = util.format(element.resourceURL, baseURL);
        });

        var resData = {
            code: 0,
            msg: "查询成功",
            data: result
        };
        res.end(JSON.stringify(resData));
    });
});
/**
 * 上传
 * */
app.post("/upload", upload.any(), function(req, res) {
    var resData = {
        code: -1,
        msg: "上传失败"
    };
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });

    if (req.files[0] == undefined) {
        resData = {
            code: -1,
            msg: "上传的文件为空，请检查"
        };
        res.end(JSON.stringify(resData));
        return;
    }
    let projectName = req.query.project;
    let os = req.query.os;
    let identifier = req.query.identifier;
    let currentDate = new Date().format("yyyy-MM-dd-hh-mm-ss");
    var destDir = path.join("store", currentDate); // 本地存储路径
    let body = req.body;
    let version = body.version;
    let buildVersion = body.versionBuild;
    let des = body.des || "啥也没写";
    // 移动安装包
    handFile.handleInstallationPackage(destDir, req.files[0], function(filePath) {
        if (!filePath) {
            resData = {
                code: -1,
                msg: "服务器，ipa 文件处理失败"
            };
            res.end(JSON.stringify(resData));
            return;
        }
        // 数据库存储的 plist 地址
        let fileURLPath = baseURL + "/" + filePath;
        // infoPlist
        if (os == "iOS") {
            let plistPath = handFile.handlePlist(
                destDir,
                fileURLPath,
                projectName,
                version,
                identifier
            );
            fileURLPath = "%s/" + plistPath;
            console.log(fileURLPath)
            console.log(plistPath)
        }

        sqlBusiness.saveIpaInfo(
            identifier,
            os,
            projectName,
            version,
            buildVersion,
            des,
            fileURLPath,
            currentDate,
            function(isSuccess) {
                if (isSuccess) {
                    console.log("上传成功");

                    resData = {
                        code: 0000,
                        msg: "上传成功"
                    };
                    res.end(JSON.stringify(resData));
                } else {
                    resData = {
                        code: -1,
                        msg: "存储错误"
                    };
                    res.end(JSON.stringify(resData));
                }
            }
        );
    });
});
app.get("/uploadInfoPlist", function(req, res) {
    var resData = {
        code: -1,
        msg: "参数错误"
    };
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });
    let newHost = req.query.newHost;
    if (newHost === undefined) {
        res.end(JSON.stringify(resData));
        return;
    }
    handFile.updatedInfoPlistUrl(newHost);
    resData = {
        code: 0000,
        msg: "处理成功"
    };
    res.end(JSON.stringify(resData));
});
app.get("/projectConfig", function(req, res) {
    var resData = {
        code: -1,
        msg: "参数错误"
    };


    // 同步读取
    let data = JSON.parse(fs.readFileSync(__dirname + "/source/projectJSON/projectConfig.json"));
    if (data === undefined) {
        res.end(JSON.stringify(data));
        return;
    }
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });
    resData = {
        code: 0000,
        msg: "处理成功",
        data: data
    };

    res.end(JSON.stringify(resData));
});
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