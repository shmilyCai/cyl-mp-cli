const fs = require("fs"); // node中的文件系统
const fuzzy = require("fuzzy"); // 模糊查找
const inquirer = require("inquirer"); // 通用的命令行用户界面集合，用于和用户进行交互
const path = require("path"); // 路径模块
const jsonFormat = require("json-format"); // json格式化（用来美化文件输出格式）
const Log = require("./utils/log"); // 控制台输出
const Util = require("./utils/util"); // 工具函数

let Config = require("../config"); // 获取配置项

// 全局属性
const __Data__ = {
  // 小程序项目app.json
  appJson: "",

  // 小程序所有分包
  appModuleList: {},

  // 小程序所有页面
  appPagesList: {}
};

// 校验文件名称
const regEn = /[`~!@#$%^&*()+<>?:"{},./;'[\]]/im;
const regCn = /[·！#￥（——）：；“”‘、，|《。》？、【】[\]]/im;

// 解析app.json
function getAppJson() {
  let appJsonRoot = path.join(Config.entry, "app.json");
  try {
    return require(appJsonRoot);
  } catch (e) {
    Log.error(
      `未找到app.json, 请检查当前文件目录是否正确，path: ${appJsonRoot}`
    );
    process.exit(1);
  }
}

// 获取文件名/模块名
function getPathSubSting(path) {
  let result = "",
    arr = path.split("/");
  for (let i = arr.length; i > 0; i--) {
    if (arr[i]) {
      result = arr[i];
      break;
    }
  }
  return result;
}

// app.json 业务对象
let parseAppJson = () => {
  // app Json 原文件
  let appJson = (__Data__.appJson = getAppJson());

  // 获取主包页面
  appJson.pages.forEach(
    path => (__Data__.appPagesList[getPathSubSting(path)] = "")
  );

  // 获取分包，页面列表
  appJson.subPackages.forEach(item => {
    __Data__.appModuleList[item.root] = item.root;
    item.pages.forEach(
      path => (__Data__.appPagesList[getPathSubSting(path)] = item.root)
    );
  });
};

// 注册插件
inquirer.registerPrompt(
  "autocomplete",
  require("@moyuyc/inquirer-autocomplete-prompt")
);

// 创建页面，分为一般的page页面和list列表页面
async function createPage({ name, modulePath = "", type = "/page" }) {
  // 模版文件路径
  let templateRoot = path.join(Config.template, type);
  if (!Util.checkFileIsExists(templateRoot)) {
    Log.error(
      `未找到模版文件, 请检查当前文件目录是否正确，path: ${templateRoot}`
    );
    return;
  }
  // 业务文件夹路径
  let page_root = path.join(Config.entry, modulePath, "/pages", name);
  // 查看文件夹是否存在
  let isExists = await Util.checkFileIsExists(page_root);
  if (isExists) {
    Log.error(`当前页面已存在，请重新确认, path: ` + page_root);
    return;
  }

  // 创建文件夹
  await Util.createDir(page_root);

  // 获取文件列表
  let files = await Util.readDir(templateRoot);
  // 复制文件
  // await Util.copyFilesArr(templateRoot, `${page_root}/${name}`, files);
  await Util.copyFilesArr(templateRoot, `${page_root}/index`, files);

  // 填充app.json
  await writePageAppJson(name, modulePath);
  // 成功提示
  Log.success(`创建页面成功, path: ` + page_root);
}

// 创建组件
async function createComponent({ name, scope, parentModule, parentPage = {} }) {
  // 小程序目录
  const Entry = Config.entry;

  // 模版文件路径
  let templateRoot = path.join(Config.template, "/component");
  if (!Util.checkFileIsExists(templateRoot)) {
    Log.error(
      `未找到模版文件, 请检查当前文件目录是否正确，path: ${templateRoot}`
    );
    return;
  }

  // 业务文件夹路径
  let component_root = {
    global: () => path.join(Entry, "/component", name),
    module: () => path.join(Entry, parentModule, "/component", name),
    page: () =>
      path.join(
        Entry,
        parentPage.root,
        "/pages",
        parentPage.page,
        "/component",
        name
      )
  }[scope]();

  // 查看文件夹是否存在
  let isExists = await Util.checkFileIsExists(component_root);
  if (isExists) {
    Log.error("组件已存在，请重新确认，path:" + component_root);
    return;
  }

  // 创建文件夹
  console.log("111");
  await Util.createDir(component_root);

  // 获取文件列表
  let files = await Util.readDir(templateRoot);

  // 复制文件
  // await Util.copyFilesArr(templateRoot, `${component_root}/${name}`, files);
  await Util.copyFilesArr(templateRoot, `${component_root}/index`, files);

  // 填充app.json
  scope === "page" &&
    (await writeComponentPageJson(
      name,
      parentPage,
      path.join(Entry, parentPage.root, "/pages", parentPage.page)
    ));

  // 成功提示
  Log.success(`createPage success, path: ` + component_root);
}

// 新增页面写入app.json
function writePageAppJson(name, modulePath = "") {
  return new Promise((resolve, reject) => {
    let appJson = __Data__.appJson;

    // 填充主包
    if (!modulePath) {
      appJson.pages.push(`pages/${name}/${name}`);
    } else {
      // 当前下标q
      let idx = Object.values(__Data__.appModuleList).indexOf(modulePath);
      if (idx === -1) {
        Log.error("app.json不存在当前module, path: " + modulePath);
        return;
      }
      appJson.subPackages[idx].pages.push(`pages/${name}/${name}`);
    }

    // 写入文件
    fs.writeFile(`${Config.entry}/app.json`, jsonFormat(appJson), err => {
      if (err) {
        Log.error("自动写入app.json文件失败，请手动填写，并检查错误");
        reject();
      } else {
        resolve();
      }
    });
  });
}

// 新增页面组件写入page.json
function writeComponentPageJson(name, parentPage, path) {
  return new Promise(resolve => {
    let jsonPath = `${path}/${parentPage.page}.json`;
    let jsonConf = JSON.parse(fs.readFileSync(jsonPath));

    // 不存在时默值为对象
    !jsonConf.usingComponents && (jsonConf.usingComponents = {});

    // 添加路径
    jsonConf.usingComponents[name] = `./component/${name}/${name}`;

    // 写入文件
    fs.writeFile(jsonPath, jsonFormat(jsonConf), err => {
      if (err) {
        Log.error("自动写入page, json文件失败，请手动填写，并检查错误");
        resolve();
      } else {
        resolve();
      }
    });
  });
}

// 问题队列
let question = [
  // 选择模式使用 page -> 创建页面 | component -> 创建组件
  {
    type: "list",
    name: "mode",
    message: "选择你想生成的模版类型：",
    choices: ["page", "list", "component"]
  },
  // 设置名称
  {
    type: "input",
    name: "name",
    message: answer => `设置 ${answer.mode} 的名字 (例如: index):`,
    validate(input) {
      let done = this.async();
      // 输入不得为空
      if (input === "" || input.length === 0) {
        done("You must input name!!!");
        return;
      }
      // 校验文件名是否符合规范
      if (regEn.test(input) || regCn.test(input)) {
        // done('文件名不符合规范!!!');
        done("The name entered does not conform to the rule!!!");
        return;
      }
      done(null, true);
    }
  },

  // 设置page所属module
  {
    type: "autocomplete",
    name: "modulePath",
    message: "设置页面所属的分包",
    choices: [],
    suggestOnly: false,
    source(answers, input) {
      return Promise.resolve(
        fuzzy
          .filter(input, ["none", ...Object.keys(__Data__.appModuleList)])
          .map(el => el.original)
      );
    },
    filter(input) {
      if (input === "none") {
        return "";
      }
      return __Data__.appModuleList[input];
    },
    when(answer) {
      return answer.mode === "page" || answer.mode === "list";
    }
  },
  // 选择组件作用域
  {
    type: "list",
    name: "componentScope",
    message: "设置组件所属的作用域",
    choices: ["global", "module", "page"],
    when(answer) {
      return answer.mode === "component";
    }
  },
  // 设置组件所属module
  {
    type: "autocomplete",
    name: "parentModule",
    message: "设置组件所属的分包",
    choices: [],
    suggestOnly: false,
    source(answers, input) {
      return Promise.resolve(
        fuzzy
          .filter(input, Object.keys(__Data__.appModuleList))
          .map(el => el.original)
      );
    },
    filter(input) {
      if (input === "none") {
        return "";
      }
      return __Data__.appModuleList[input];
    },
    when(answer) {
      return answer.mode === "component" && answer.componentScope === "module";
    }
  },
  // 设置组件所属pages
  {
    type: "autocomplete",
    name: "parentPage",
    message: "设置组件所属的页面",
    choices: [],
    suggestOnly: false,
    source(answers, input) {
      return Promise.resolve(
        fuzzy
          .filter(input, Object.keys(__Data__.appPagesList))
          .map(el => el.original)
      );
    },
    filter(input) {
      if (input === "none") {
        return "";
      }
      return { page: input, root: __Data__.appPagesList[input] };
    },
    when(answer) {
      return answer.mode === "component" && answer.componentScope === "page";
    }
  }
];

module.exports = function() {
  parseAppJson();
  inquirer.prompt(question).then(answers => {
    let {
      name,
      mode,
      componentScope,
      modulePath = "",
      parentModule,
      parentPage
    } = answers;
    switch (mode) {
      case "page":
        createPage({ name, modulePath, type: "/page" });
        break;
      case "list":
        createPage({ name, modulePath, type: "/list" });
        break;
      case "component":
        console.log(componentScope);
        createComponent({
          name,
          scope: componentScope,
          parentModule,
          parentPage
        });
        break;
    }
  });
};
