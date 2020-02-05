#!/usr/bin/env node

const program = require("commander"); // 可以自动的解析命令和参数，用于处理用户输入的命令
const initProgram = require("./src/init"); // 初始化项目文件
const createProgram = require("./src/create"); // 创建页面或者组件

program
  .version("1.0.0", "-v, --version")
  .command("init <name>")
  .action(name => initProgram(name));

program
  .command("create")
  .description("创建页面或者组件")
  .action(() => createProgram());

program.parse(process.argv);
