#!/bin/bash

CommonName=$1

if [ ! -n "${CommonName}" ] ;then
    echo "请输入域名"
    exit -1
else
    echo "为域名 ${CommonName} 生成 CA 证书" 
fi

path="../source/certificate"

if [ ! -d $path  ];then
  mkdir $path
else
  echo dir exist
fi

cd $path

# 私钥
openssl genrsa -out privateCA.pem 2048

# 创建 CA 证书
openssl req -x509 -new -key privateCA.pem -out myCA.cer -days 365 -subj /CN=${CommonName}

