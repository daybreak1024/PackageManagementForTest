var mysql  = require('mysql');

// sql 初始化
var connection = mysql.createConnection({
  user: 'root',
  password: 'daybreak',
  database: 'ipaInfo',
  insecureAuth: true,
  dateStrings: true,
});

connection.connect(function callback(err) {
  if (err) {
      return console.log('[INSERT ERROR] - ', err.message);
  }
});

function readListOfIpaInfo(pageNum,pageSize,cb){
  console.log('数据库读取 处理开始 '+'pageNum:'+ pageNum +'pageSize:'+ pageSize);
  let beginIndex = (pageNum - 1) * pageSize;
  let endIndex = pageNum  * pageSize;
  var readSql = 'SELECT * from info order by id desc limit ' + beginIndex + ',' +endIndex;
  connection.query(readSql, function (err, result) {
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

  var addSql = 'INSERT INTO info(id,name,version,buildVersion,description,resourceURL,date) VALUES(0,?,?,?,?,?,?)';
  var addSqlParams = [name, version, buildVersion, description, resourceURL, date];
  //增
  connection.query(addSql, addSqlParams, function (err, result) {

      if (err) {
          console.log('[INSERT ERROR] - ', err.message);
          cb(false);
          return;
      }

      console.log('--------------------------INSERT----------------------------');
      console.log('INSERT ID:', result);
      console.log('-----------------------------------------------------------------\n\n');

      cb(true)
  });

}

module.exports = {
  saveIpaInfo : saveIpaInfo,
  readListOfIpaInfo : readListOfIpaInfo,
};
