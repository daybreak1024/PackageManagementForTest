var sqlite3 = require("sqlite3");
var fs = require("fs");

let dbPath = "./dataBase";
// 创建 db 存储路径
createDBDirIfNeed(dbPath);
// sql 初始化
var db = new sqlite3.Database(dbPath + "/ipainfo.db", function(err) {
  if (err) {
    console.log("[INSERT ERROR] - DB打开失败 : " + err);
    return;
  }
  let createTableSql = `
    CREATE TABLE IF NOT EXISTS info (
        id INTEGER PRIMARY KEY   AUTOINCREMENT,
        identifier   TEXT  NOT NULL,
        os           TEXT  NOT NULL,
        name         TEXT  NOT NULL,
        version      TEXT  NOT NULL,
        buildVersion TEXT  NOT NULL,
        description  TEXT  NOT NULL,
        resourceURL  TEXT  NOT NULL,
        date         TEXT  NOT NULL
        )
  `;
  db.run(createTableSql, function(err) {
    if (err) {
      console.log("[INSERT ERROR] - DB打开失败 : " + err);
    }
  });
});

function readListOfIpaInfo(projectName,os, pageNum, pageSize, cb) {
  console.log(
    "数据库读取 处理开始 " + " projectName:" + projectName + " os:" + os + " pageNum:" + pageNum + " pageSize:" + pageSize
  );
  let beginIndex = (pageNum - 1) * pageSize;
  let whereCondition = " WHERE name=" + "\"" +projectName + "\"" + " AND os="+ "\"" +os+ "\"" 
  let limit = " order by id desc limit " + beginIndex + "," + pageSize
  var readSql =
    "SELECT * FROM info "  + whereCondition + limit;
    console.log(
      "数据库读取 sql " + readSql
    );
  db.all(readSql, function(err, result) {
    if (err) {
      console.log("[SELECT ERROR] - ", err.message);
      cb(false);
      return;
    }
    console.log("--------------------------SELECT----------------------------");
    console.log("SELECT ID:", JSON.stringify(result));
    console.log(
      "-----------------------------------------------------------------\n\n"
    );

    cb(result);
  });
}

function saveIpaInfo(
  identifier,
  os,
  name,
  version,
  buildVersion,
  description,
  resourceURL,
  date,
  cb
) {
  console.log("数据库存储 处理开始");

  var addSql =
    "INSERT INTO info(identifier,os,name,version,buildVersion,description,resourceURL,date) VALUES(?,?,?,?,?,?,?,?)";
  var addSqlParams = [
    identifier,
    os,
    name,
    version,
    buildVersion,
    description,
    resourceURL,
    date
  ];
  console.log(addSqlParams.join("--"))
  //增
  db.run(addSql, addSqlParams, function(err) {
    if (err) {
      console.log("[INSERT ERROR] - ", err.message);
      cb(false);
      return;
    }

    console.log("--------------------------INSERT----------------------------");
    console.log("INSERT SUCCESS");
    console.log(
      "-----------------------------------------------------------------\n\n"
    );

    cb(true);
  });
}

module.exports = {
  saveIpaInfo: saveIpaInfo,
  readListOfIpaInfo: readListOfIpaInfo
};

// private
function createDBDirIfNeed(path) {
  let isExists = fs.existsSync(path);
  if (isExists) {
    return;
  }
  fs.mkdirSync(path);

}
