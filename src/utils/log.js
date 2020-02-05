const chalk = require("chalk");
const symbols = require("log-symbols");

module.exports = {
  success(msg) {
    console.log(chalk.green(`>> ${msg}`));
  },
  error(msg) {
    console.log(chalk.red(`>> ${msg}`));
  }
};
