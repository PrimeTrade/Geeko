let SMA = require('./SMA.js');

let Indicator = function (settings) {
    this.input = 'candle';
    this.lastClose = 0;
    this.uo = 0;
    this.firstWeight = settings.first.weight;
    this.secondWeight = settings.second.weight;
    this.thirdWeight = settings.third.weight;
    this.firstLow = new SMA(settings.first.period);
    this.firstHigh = new SMA(settings.first.period);
    this.secondLow = new SMA(settings.second.period);
    this.secondHigh = new SMA(settings.second.period);
    this.thirdLow = new SMA(settings.third.period);
    this.thirdHigh = new SMA(settings.third.period);
}


Indicator.prototype.update = function(candle) {
    let close = candle.close;
    let prevClose = this.lastClose;
    let low = candle.low;
    let high = candle.high;

    let bp = close - Math.min(low, prevClose);
    let tr = Math.max(high, prevClose) - Math.min(low, prevClose);

    this.firstLow.update(tr);
    this.secondLow.update(tr);
    this.thirdLow.update(tr);

    this.firstHigh.update(bp);
    this.secondHigh.update(bp);
    this.thirdHigh.update(bp);

    let first = this.firstHigh.result / this.firstLow.result;
    let second = this.secondHigh.result / this.secondLow.result;
    let third = this.thirdHigh.result / this.thirdLow.result;

    this.uo = 100 * (this.firstWeight * first + this.secondWeight * second + this.thirdWeight * third) / (this.firstWeight + this.secondWeight + this.thirdWeight);

    this.lastClose = close;
}

module.exports = Indicator;
