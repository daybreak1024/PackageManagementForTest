var express = require('express');
var app = express();
var fs = require("fs");
var multer  = require('multer');
// var mysql  = require('mysql');

// multer 初始化
let upload = multer({
    dest: 'dest'
});

// sql 初始化
// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'daybreak',
//     password : '111111',
//     database : 'ipas'
//   });
//   connection.connect();
   

// express
app.get('/index.html', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html");
 })

app.post('/upload', upload.any(),function (req, res) {
    console.log(req.files);
    
    var des_file = __dirname + "/" + req.files[0].originalname;
   fs.readFile( req.files[0].path, function (err, data) {
        fs.writeFile(des_file, data, function (err) {
         if( err ){
              console.log( err );
         }else{
               response = {
                   message:'File uploaded successfully', 
                   filename:req.files[0].originalname
              };
          }
          console.log( response );
          res.end( JSON.stringify( response ) );
       });
   });

})
  
var server = app.listen(8888,'localhost',function () {
    var host = server.address().address
    var port = server.address().port
   
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})