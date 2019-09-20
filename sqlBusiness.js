var sqlite3 = require('sqlite3');
var handFile = require('./handFile');


let dbPath = './dataBase'
// 创建 db 存储路径
handFile.dirExists(dbPath);
// sql 初始化
var db = new sqlite3.Database(dbPath + '/ipainfo.db',function(err) {
  if(err){
      console.log('[INSERT ERROR] - DB打开失败 : ' + err);
      return;
  }
  let createTableSql = `
    CREATE TABLE IF NOT EXISTS info (
        id INTEGER PRIMARY KEY   AUTOINCREMENT,
        name         TEXT  NOT NULL,
        version      TEXT  NOT NULL,
        buildVersion TEXT  NOT NULL,
        description  TEXT  NOT NULL,
        resourceURL  TEXT  NOT NULL,
        date         TEXT  NOT NULL
        )
  `
    db.run(createTableSql,function(err){
        if(err){
            console.log('[INSERT ERROR] - DB打开失败 : ' + err);
        }
    });
  
});



function readListOfIpaInfo(pageNum,pageSize,cb){
  console.log('数据库读取 处理开始 '+'pageNum:'+ pageNum +'pageSize:'+ pageSize);
  let beginIndex = (pageNum - 1) * pageSize;
  var readSql = 'SELECT * from info order by id desc limit ' + beginIndex + ',' +pageSize;    

  db.all(readSql, function (err, result) {
    if(err){
      console.log('[SELECT ERROR] - ', err.message);
      cb(false);
      return;
    }
    console.log('--------------------------SELECT----------------------------');
    console.log('SELECT ID:', JSON.stringify(result));
    console.log('-----------------------------------------------------------------\n\n');

    cb(result);
  });

}

function saveIpaInfo(name, version, buildVersion, description, resourceURL, date, cb) {
  console.log('数据库存储 处理开始');

  var addSql = 'INSERT INTO info(name,version,buildVersion,description,resourceURL,date) VALUES(?,?,?,?,?,?)';
  var addSqlParams = [name, version, buildVersion, description, resourceURL, date];
  //增
  db.run(addSql, addSqlParams, function (err) {

      if (err) {
          console.log('[INSERT ERROR] - ', err.message);
          cb(false);
          return;
      }

      console.log('--------------------------INSERT----------------------------');
      console.log('INSERT SUCCESS');
      console.log('-----------------------------------------------------------------\n\n');

      cb(true)
  });

}

module.exports = {
  saveIpaInfo : saveIpaInfo,
  readListOfIpaInfo : readListOfIpaInfo,
};
