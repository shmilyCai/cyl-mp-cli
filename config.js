module.exports = {
  // 根目录
  root: __dirname,

  // 执行命令目录路径
  dir_root: process.cwd(),

  // 小程序项目路径-发布npm包时记得修改
  // entry: './',
  entry: __dirname + "/demo/", // 本地测试的地址

  // 项目编译输出文件夹
  // output: '../mp/',

  // 小程序模版目录
  template: __dirname + "/src/template"
};
