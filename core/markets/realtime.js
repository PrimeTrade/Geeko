let _ = require('lodash');
let util = require('../util');
let dirs = util.dirs();
let config = util.getConfig();
let exchanges = require(dirs.gekko + 'exchanges');
let exchange = _.find(exchanges, (e)=>{
    return e.slug === config.watch.exchange.toLowerCase();
});

if(!exchange)
    util.die(`Unsupported exchange: ${config.watch.exchange.toLowerCase()}`)

let exchangeChecker = require(util.dirs().core + 'exchangeChecker');

let error = exchangeChecker.cantMonitor(config.watch);
if(error)
    util.die(error,true);

module.exports = require(dirs.budfox + 'budfox');