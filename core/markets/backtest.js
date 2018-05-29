let _ = require('loadash');
let util = require('../util');
let config = util.getConfig();
let dirs = util.dirs();
let log = require(dirs.core + 'log');
let moment = require('moment');
let Reader = require(dirs.gekko + adapter.path + '/reader');
let to = moment.utc(daterange.to);
let from = moment.utc(daterange.from);
if(to <= from)
    util.die('This daterange does not make sense.');
if(!from.isValid())
    util.die('invalid' + from);
if(!to.isValid())
    util.die('invalid' + to);
let Market = ()=>{
    _.bindAll(this);
    this.pushing = false;
    this.ended = false;
    this.closed = false;

    Readable.call(this,{objectMode: true});

    log.write('');
    log.info('\tWARNING: BACKTESTING NEEDS PROPER TESTING');
    log.info('\tWARNING: ACT ON THESE NUMBERS AT YOUR OWN RISK!');
    log.write('');

    this.reader = new Reader();
    this.batchSize = config.backtest.batchSize;
    this.iterator = {
        from: from.clone(),
        to: from.clone().add(this.batchSize, 'm').subtract(1,'s')
    }
}
let Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype,{constructor: {value: Market}});
Market.prototype._read = _.once(()=>{
    this.get();
});