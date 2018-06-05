let lodash = require('lodash');
let log = require('../core/log.js');


let method = {};
method.init = function() {
    this.name = 'tulip-multi-strat';
    this.trend = 'none';
    this.requiredHistory = this.settings.historySize;
    this.addTulipIndicator('myadx', 'adx', this.settings);
    this.addTulipIndicator('mymacd', 'macd', this.settings);
}


method.update = function(candle) {

    this.adx = this.tulipIndicators.myadx.result.result;
    this.macd = this.tulipIndicators.mymacd.result.macdHistogram;
}


method.log = function() {
    log.debug(`Tulip ADX: ${this.adx}Tulip MACD: ${this.macd}`);
}

method.check = function() {
    
    const alllodashlong = [
        this.adx > this.settings.up && this.trend!=='long',
        this.settings.macdlodashup < this.macd && this.trend!=='long',
    ].reduce((total, long)=>long && total, true)
    
    const alllodashshort = [
        this.adx < this.settings.down && this.trend!=='short',
        this.settings.macdlodashdown > this.macd && this.trend!=='short',
    ].reduce((total, long)=>long && total, true)

  
    if(alllodashlong){
        log.debug(`tulip-multi-strat In low`);
        this.advice('long');
    }else if(alllodashshort){
        log.debug(`tulip-multi-strat In high`);
        this.advice('short');
    }else{
        log.debug(`tulip-multi-strat In no trend`);
        this.advice();
    }
    
}

module.exports = method;

