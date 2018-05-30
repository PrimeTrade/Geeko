// a leech market is "semi-realtime" and pulls out candles of a database (Updated regularly)
const _=require('lodash');
const util=require('../util');
const config=util.getConfig();
const dirs=util.dirs();
const moment=require('moment');
const exchangeChecker = require(dirs.core + 'exchangeChecker');
const adapter = config[config.adapter];
const Reader = require(dirs.gekko + adapter.path + '/reader');
const TICKINTERVAL = 20*1000; //20 sec
const slug = config.watch.exchange.toLowerCase();
const exchange = exchangeChecker.getExchangeCapabilities(slug);
let fromTs;

if(!exchange)
    util.die(`Exchange Unsupported: ${slug}`);

const error = exchangeChecker.cantMonitor(config.watch);
if(error)
    util.die(error, true);

if(config.market.from)
    fromTs = moment.utc(config.market.from).unix();
else
    fromTs = moment().startOf('minute').unix();

let Market=()=>{
    _.bindAll(this);
    Readable.call(this,{objectMode: true});
    this.reader = new Reader();
    this.latestTs = fromTs;

    setInterval(this.get,TICKINTERVAL);
}
let Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype,{constructor: {value: Market}});
