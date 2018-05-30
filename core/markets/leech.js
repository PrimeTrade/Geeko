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
const cp=require(dirs.core + 'cp');
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

Market.prototype._read = _.once(()=>{
    this.get();
});

Market.prototype.get = ()=>{
    let future = moment().add(1,'minute').unix();

    this.reader.get(this.latestTs,future,'full',this.processCandles)
}

Market.prototype.processCandles = (err,candles)=>{
    let amt = _.size(candles);
    if(amt === 0){
        //no new candles
        return;
    }
    //verify that the correct amount of candles was passed
    //eg: if this.latestTs was at 10:00 and we receive 15 candles with the latest at 11:00, we know we ar missing 45 candles
    _.each(candles, (c,i)=>{
        c.start = moment.unix(c.start).utc();
        this.push(c);
    },this);

    this.sendStartAt(_.first(candles));
    cp.lastCandle(_.last(candles));
    this.latestTs = _.last(candles).start.unix() + 1;
}

Market.prototype.sendStartAt = _.once((candle)=>{
    cp.firstCandle(candle);
});

module.exports = Market;
