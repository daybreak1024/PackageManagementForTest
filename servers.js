var express = require('express');
var app = express();
var fs = require("fs");
var multer = require('multer');
var mysql  = require('mysql');
// multer 初始化
let upload = multer({
    dest: 'dest'
});

//time
Date.prototype.format = function(fmt) { 
    var o = { 
       "M+" : this.getMonth()+1,                 //月份 
       "d+" : this.getDate(),                    //日 
       "h+" : this.getHours(),                   //小时 
       "m+" : this.getMinutes(),                 //分 
       "s+" : this.getSeconds(),                 //秒 
       "q+" : Math.floor((this.getMonth()+3)/3), //季度 
       "S"  : this.getMilliseconds()             //毫秒 
   }; 
   if(/(y+)/.test(fmt)) {
           fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
   }
    for(var k in o) {
       if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
   return fmt; 
}        

// sql 初始化
var connection = mysql.createConnection({
    user     : 'root',
    password : 'daybreak',
    database : 'ipaInfo',
    insecureAuth: true,
    dateStrings: true,
  });
connection.connect(function callback(err){
    if (err) {
        return console.log('[INSERT ERROR] - ', err.message);
    }
});

function saveIpa(name,version,buildVersion,description,resourceURL,date,cb){

    var addSql = 'INSERT INTO info(id,name,version,buildVersion,description,resourceURL,date) VALUES(0,?,?,?,?,?,?)';
    var addSqlParams = [name,version,buildVersion,description,resourceURL, date];
    //增
    connection.query(addSql, addSqlParams, function (err, result) {

        // connection.end();

        if (err) {
            
            
            console.log('[INSERT ERROR] - ', err.message);

            cb(false);
            return;
        }

        console.log('--------------------------INSERT----------------------------');
        //console.log('INSERT ID:',result.insertId);        
        console.log('INSERT ID:', result);
        console.log('-----------------------------------------------------------------\n\n');

        cb(true)
    });

}

// express
app.get('/index.html', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
})


app.post('/upload', upload.any(), function (req, res) {
    // console.log(req.files);
    var resData = {
        'code':-1,
        'msg':'上传失败'
    };
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8"
    });
    if (req.files[0] == undefined ){
        resData = {
            'code':-1,
            'msg':'上传的文件有误，经检查'
        };
        res.end(JSON.stringify(resData));
        return;
    }

    fs.readFile(req.files[0].path, function (err, data) {
        if (err){
            console.log(err.message);

            resData = {
                'code':-1,
                'msg':'文件读取失败'
            };
            res.end(JSON.stringify(resData));

            return;
        }
       
        saveIpa('MAMTest', '2.5.4', '0.0.1','就是版本提测啦','https://c.runoob.com', new Date().format("yyyy-MM-dd hh:mm:ss"),function(isSuccess){
            if (isSuccess) {
                console.log('上传成功');
                
                resData = {
                    'code':0000,
                    'msg':'上传成功'
                };
                res.end(JSON.stringify(resData));

            }else{
                resData = {
                    'code':-1,
                    'msg':'存储错误'
                };
                res.end(JSON.stringify(resData));

            }
        })
    });
    

})

var server = app.listen(8888, 'localhost', function () {
    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})

