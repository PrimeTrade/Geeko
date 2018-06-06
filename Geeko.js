
console.log('GEEKO');


const util = require('./core/util');

const dirs = util.dir();

if(util.launchUI())
  return require(util.dirs().web + 'server');

const pipeline = require(dirs.core + 'pipeline');
const config = util.getConfig();
const mode = util.gekkoMode();

if(config.trader.enabled && !config['I understand that Gekko only automates MY OWN trading strategies'])
  util.die('Do you understand what Gekko will do with your money? Read this first:\n\nhttps://github.com/askmike/gekko/issues/201');


pipeline({config: config,mode: mode});
