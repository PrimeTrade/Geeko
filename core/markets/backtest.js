let _ = require('loadash');
let util = require('../util');
let config = util.getConfig();
let dirs = util.dirs();
let log = require(dirs.core + 'log');
let moment = require('moment');
let adapter = config[config.adapter];
let Reader = require(dirs.gekko + adapter.path + '/reader');
let daterange = config.backtest.daterange;
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
Market.prototype.get = ()=>{
    if(this.iterator.to >= to){
        this.iterator.to = to;
        this.ended = true;
    }
    this.reader.get(
        this.iterator.from.unix(),
        this.iterator.to.unix(),
        'full',
        this.processCandles
    )
}
Market.prototype.processCandles = (err,candles)=>{
    this.pushing = true;
    let amount = _.size(candles);

    if(amount === 0){
        if(this.ended){
            this.closed = true;
            this.reader.close();
            this.emit('end');
        }
        else{
            util.die('No Candles returned (do you have local data for the specified range?)');

        }
    }

    if(!this.ended && amount < this.batchSize){
        var d = (t)=>{
            return moment.unix(t).utc().format('YYYY-MM-DD HH:mm:ss')
        }
        var from = d(_.first(candles).start);
        var to = d(_.last(candles).start);
        log.warn(`Simulate Simulation based on incomplete market data (${this.batchSize - amount} missing between ${from} and ${to}).`);
    }

    _.each(candles,(c,i)=>{
        c.start = moment.unix(c.start);
        this.push(c);
    },this);
    this.pushing = false;
    this.iterator ={
        from: this.iterator.from.clone().add(this.batchSize, 'm'),
        to: this.iterator.from.clone().add(this.batchSize * 2, 'm').subtract(1,'s')
    }

    if(!this.closed)
        this.get();
}
module.exports = Market;