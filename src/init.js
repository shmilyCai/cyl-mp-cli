const fs = require("fs"); // node中的文件系统
const download = require("download-git-repo"); // 下载并提取 git 仓库，用于下载项目模板
const handlebars = require("handlebars"); // 模板引擎，将用户提交的信息动态填充到文件中
const inquirer = require("inquirer"); // 通用的命令行用户界面集合，用于和用户进行交互
const ora = require("ora"); // 下载过程久的话，可以用于显示下载中的动画效果
const Log = require("./utils/log"); // 控制台输出

// 初始化项目地址, 修改该地址可自定义小程序模板
// const GIT_TEMPLATE =  ''

module.exports = function(name) {
  if (!fs.existsSync(name)) {
    inquirer
      .prompt([
        {
          name: "description",
          message: "请输入项目描述"
        },
        {
          name: "author",
          message: "请输入作者名称"
        }
      ])
      .then(answers => {
        const spinner = ora("download...");
        spinner.start();
        download(GIT_TEMPLATE, name, { clone: true }, err => {
          if (err) {
            spinner.fail();
            Log.error(err);
          } else {
            spinner.succeed();
            const fileName = `${name}/package.json`;
            const meta = {
              name,
              description: answers.description,
              author: answers.author
            };
            if (fs.existsSync(fileName)) {
              const content = fs.readFileSync(fileName).toString();
              const result = handlebars.compile(content)(meta);
              fs.writeFileSync(fileName, result);
            }
            Log.success("success");
          }
        });
      });
  } else {
    Log.error("项目已存在");
  }
};
