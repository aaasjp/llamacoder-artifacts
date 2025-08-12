
/*
安装OSS Node.js SDK
更新时间：2024-11-06 10:38
产品详情
社区
如果您希望在 Node.js 应用程序中操作阿里云 OSS，以实现文件的上传、下载、存储和管理，可以参考本文安装 OSS Node.js SDK。

环境准备
环境要求

推荐使用Node.js 8.0及以上版本。

请参考Node.js安装下载和安装编译运行环境。

查看语言版本

执行以下命令查看Node.js版本。

 
node -v
执行以下命令查看npm版本。

 
npm -v
安装SDK
SDK版本选择

如果您使用的是Node.js 8.0及以上版本，请使用官网最新SDK 6.x版本。

如果您使用的是Node.js 8.0以下版本，请使用SDK 4.x版本.

执行以下命令安装SDK

安装SDK 6.x版本

 
npm install ali-oss@^6.x --save
安装SDK 4.x版本

 
npm install ali-oss@^4.x --save
验证SDK
您可以使用以下命令来验证ali-oss是否安装成功并查看其版本。

 
npm list ali-oss
成功返回示例如下，以下示例表明您已经成功安装ali-oss。

 
your-project-name@ /path/to/your/project
└── ali-oss@6.x.x

*/

const OSS = require('ali-oss')
const path=require("path")

const client = new OSS({
  // yourregion填写Bucket所在地域。以华北2（北京）为例，Region填写为oss-cn-beijing。
  region: 'oss-cn-beijing',
  // 从环境变量中获取访问凭证。运行本代码示例之前，请确保已设置环境变量OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET。
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  authorizationV4: true,
  // 填写Bucket名称。
  bucket: 'llamacoder-artifacts',
});

// 自定义请求头
const headers = {
  // 指定Object的存储类型。
  'x-oss-storage-class': 'Standard',
  // 指定Object的访问权限。
  'x-oss-object-acl': 'private',
  // 通过文件URL访问文件时，指定以附件形式下载文件，下载后的文件名称定义为example.txt。
  'Content-Disposition': 'attachment; filename="example.txt"',
  // 设置Object的标签，可同时设置多个标签。
  'x-oss-tagging': 'Tag1=1&Tag2=2',
  // 指定PutObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
  'x-oss-forbid-overwrite': 'true',
};

async function put () {
  try {
    // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
    // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    const result = await client.put('exampleobject.txt', path.normalize('D:\\localpath\\examplefile.txt')
    // 自定义headers
    ,{headers}
    );
    console.log(result);
  } catch (e) {
    console.log(e);
  }
}

put();