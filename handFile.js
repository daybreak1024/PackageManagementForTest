var path = require('path');
var fs = require("fs");
var plist = require('plist');
var URL = require('url');

let plistFileName = 'manifest.plist';

/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getStat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                resolve(false);
            } else {
                resolve(stats);
            }
        })
    })
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        })
    })
}

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
async function dirExists(dir) {
    let isExists = await getStat(dir);
    //如果该路径且不是文件，返回true
    if (isExists && isExists.isDirectory()) {
        return true;
    } else if (isExists) {     //如果该路径存在但是文件，返回false
        return false;
    }
    //如果该路径不存在
    let tempDir = path.parse(dir).dir;      //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await dirExists(tempDir);
    let mkdirStatus;
    if (status) {
        mkdirStatus = await mkdir(dir);
    }
    return mkdirStatus;
}
// 业务方法


/**
 * 检查创建路径，如果没有就进行创建
 * @param {*} destDirPath 需要检查的文件路径
 */
async function checkDirAndMkdirIfNeed(destDirPath) {
    let dirRes = await dirExists(path.join(__dirname, destDirPath));
    if (!dirRes) {
        console.log('【检查路径是否存在】 - ' + dirRes);

        return false;
    }
    return true;
}

/**
 * 移动上传的 iPA
 * @param {string} destDir 存储目标相对位置
 * @param {Multer.File} file 文件处理
 */
function handleIPAInfo(destDir, file,cb) {
    console.log('ipa 处理开始');

    if (!checkDirAndMkdirIfNeed(destDir)) {
        cb(false);
        return false;
    };

    // 移动 ipa
    let sourceFileAbsolutePath = path.join(__dirname, file.path);
    let destPath = path.join(destDir, file.originalname);
    let destAbsolutePath = path.join(__dirname, destPath);

    fs.readFile(sourceFileAbsolutePath, function (err, data) {
        if (err) throw err;
        fs.writeFile(destAbsolutePath, data, function (err) {
            if (err) throw err;
         
            fs.unlinkSync(sourceFileAbsolutePath);

            cb(destPath);
       });
   });

    
}
/**
 * 处理下载使用的 plist
 * @param {string} destDir  存储目标相对位置
 * @param {string} ipaURL ipa 对应的下载位置
 */
function handlePlist(destDir, ipaURL,title,version) {
    console.log('plist 处理开始');

    if (!checkDirAndMkdirIfNeed(destDir)) {
        return false;
    };

    // 处理 plist
    let plistSourceAbsolutePath = path.join(__dirname, 'source', 'plist', plistFileName); // 原始相对路径

    // 读取 plist
    let plistFile = fs.readFileSync(plistSourceAbsolutePath, 'utf8')
    // 解析为 json  「jsonPlist 的内容」看最下面
    let jsonPlist = plist.parse(plistFile);

    // 修改内容 
    jsonPlist.items[0].assets[0].url = ipaURL; // 修改 ipa 下载地址
    jsonPlist.items[0].metadata["bundle-version"] = version; // version
    jsonPlist.items[0].metadata.title = title; // title
    
    // 转换为 plist
    var builder = plist.build(jsonPlist);
    // 存储
    let plistDestPath = path.join(destDir, plistFileName); // 目标相对路径
    let plistDestAbsolutePath = path.join(__dirname, plistDestPath);

    fs.writeFileSync(plistDestAbsolutePath, builder);

    return plistDestPath;
}
module.exports = {
    handleIPAInfo: handleIPAInfo,
    handlePlist: handlePlist,
    updatedInfoPlistUrl:updatedInfoPlistUrl,
}
/**
 * 在本机 IP 被修改后可以通过此接口进行 infoPlist 中域名的全部替换
 */
function updatedInfoPlistUrl(newHost){
    let dirPath = path.join(__dirname,"store");
    var pa = fs.readdirSync(dirPath);
	pa.forEach(function(ele){
        let subDirPath = path.join(dirPath,ele);
		var info = fs.statSync(subDirPath);	
		if(info.isDirectory()){
            let infoPlistPath =  path.join(subDirPath,plistFileName);;
            updatedInfoPlistUrlWith(newHost,infoPlistPath);
		}	
	});
}
function updatedInfoPlistUrlWith(newHost,filePath){
// 读取 plist
let plistFile = fs.readFileSync(filePath, 'utf8')
// 解析为 json  「jsonPlist 的内容」看最下面
let jsonPlist = plist.parse(plistFile);

// 修改内容 
let oldUrlString = jsonPlist.items[0].assets[0].url;
let url = URL.parse(oldUrlString);
let newURLString = url.protocol +"//" + newHost + ":"+ url.port +url.path ;
jsonPlist.items[0].assets[0].url = newURLString;
// 转换为 plist
let builder = plist.build(jsonPlist);

fs.writeFileSync(filePath, builder);
}
/**  jsonPlist 的内容
   "items": [
       {
           "assets": [
               {
                   "kind": "software-package",
                   "url": "https://127.0.0.1/matest.ipa"
               },
               {
                   "kind": "display-image",
                   "url": "https://127.0.0.1/matest.ipa"
               },
               {
                   "kind": "full-size-image",
                   "url": "https://127.0.0.1/matest.ipa"
               }
           ],
           "metadata": {
               "bundle-identifier": "com.napm.AppXC",
               "bundle-version": "2.5.3",
               "kind": "software",
               "title": "MAMTest"
           }
       }
   ]
}
    */