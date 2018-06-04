let _ = require('lodash');
let moment=require('moment');
let util = require(__dirname + '/../util');


let candleCreator = function () {
    _.bindAll(this);
//Remove fixed date
    this.threshold = moment("1970-01-01","YYYY-MM-DD");

    //Hold the leftover between fetches
    this.buckets={

    };
}
candleCreator.prototype.write=function (batch) {
    let trade=batch.data;
    if(_.isEmpty(trade))
        return;
    trade=this.filter(trade);
    this.fillBuckets(trade);
let candle=this.calculateCandle();
candle=this.addEmptyCandles(candle);
if(_.isEmpty(candle))
    return;

//last candle is not complete
    this.threshold=candle.pop().start;
    this.emit('candle',candle);
}
candleCreator.prototype.filter=function (trade) {
    return _.filter(trade,function (trade) {
        return trade.date > this.threshold;
    },
    this);
}
//put each trade in per minute bucket
candleCreator.prototype.fillBuckets=function(trade){
    _.each(trade,function (trade) {
        let minute=trade.date.format('YYYY-MM-DD HH:mm');

        if(!(minute in this.buckets))
            this.buckets[minute]=[];
        this.buckets[minute].push(trade);
    },this);
    this.lastTrade=_.last(trade);
}

//convert bucket into candle
candleCreator.prototype.calculateCandles=function () {
    let minutes=_.size(this.buckets);

    //catch error from high volume getTrades
    if(this.lastTrade !== undefined);
    //create a string referencing to minute this trade happened in
    let lastMinute=this.lastTrade.date.format('YYYY-MM-DD HH:mm');
    let candles=_.map(this.buckets, function(bucket, name){
        let candle=this.calculateCandle(bucket);
        //clean all buckets except the last one
        if(name !== lastMinute)
            delete this.buckets[name];
        return candle;
    },this);
    return candles;
}
candleCreator.prototype.calculateCandle=function (trade) {
    let first=_.first(trades);
    let b = parseFloat;
    let candle={
        start: first.date.clone().startOf('minute'),
        open: b(first.price),
        high: b(first.price),
        low: b(first.price),
        close: b(_.last(trade).price),
        vwp:0,
        volume: 0,
        trades: _.size(trade)
    };
    _.each(trade,function(trade){
        candle.high = _.max([candle.high, b(trade.price)]);
        candle.low = _.max([candle.low, b(trade.price)]);
        candle.volume += b(trade.amount);
        candle.vwp += b(trade.price) * b(trade.amount);
    });
    candle.vwp /= candle.volume;
    return candle;
}
//Gekko expects candle every minute,if nothing happened it will add empty candles
candleCreator.prototype.addEmptyCandles=function (candles) {
    let amount=_.size(candles);
    if(!amount)
        return candles;

    let start=_.first(candles).start.clone();
    let end=_.last(candles).start;
    let x,y=-1;
let minutes = _.map(candles,function (candle) {
    return +candle.start;
});
while(start<end){
    start.add(1,'min');
    x = +start;
    y++;

    if(_.contains(minutes,x))
        continue;
    let lastprice = candles[y].close;

    candles.splice(y + 1,0, {
        start: start.clone,
        open: lastprice,
        high: lastprice,
        low: lastprice,
        close: lastprice,
        vwp: lastprice,
        volume: 0,
        trades: 0
    });
}
return candles;
}
module.exports= candleCreator;