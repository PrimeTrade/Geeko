const _ = require('lodash');
const log = require('../core/log');
const RSI = require('./indicators/RSI');

let method = {
    init: ()=>{
        this.name = 'RSI';
        this.trend = {
            direction: 'none',
            duration: 0,
            persisted: false,
            adviced: false
        };
        this.requiredHistory = this.tradingAdvisor.historySize;
        this.addIndicator('rsi', 'RSI', this.settings);
    },
    log: (candle)=>{
        let digits = 8;
        let rsi = this.indicators.rsi;

        log.debug('calculated RSI properties for candle:');
        log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
        log.debug('\t', 'price:', candle.close.toFixed(digits));
    },
    check: ()=> {
        let rsi = this.indicators.rsi;
        let rsiVal = rsi.result;

        if (rsiVal > this.settings.thresholds.high) {

            // new trend detected
            if (this.trend.direction !== 'high')
                this.trend = {
                    duration: 0,
                    persisted: false,
                    direction: 'high',
                    adviced: false
                };

            this.trend.duration++;

            log.debug('In high since', this.trend.duration, 'candle(s)');

            if (this.trend.duration >= this.settings.thresholds.persistence)
                this.trend.persisted = true;

            if (this.trend.persisted && !this.trend.adviced) {
                this.trend.adviced = true;
                this.advice('short');
            } else
                this.advice();

        } else if (rsiVal < this.settings.thresholds.low) {

            // new trend detected
            if (this.trend.direction !== 'low')
                this.trend = {
                    duration: 0,
                    persisted: false,
                    direction: 'low',
                    adviced: false
                };

            this.trend.duration++;

            log.debug('In low since', this.trend.duration, 'candle(s)');

            if (this.trend.duration >= this.settings.thresholds.persistence)
                this.trend.persisted = true;

            if (this.trend.persisted && !this.trend.adviced) {
                this.trend.adviced = true;
                this.advice('long');
            }
            else
                this.advice();
        }
        else {
            log.debug('In no trend');
            this.advice();
        }
    }
};
module.exports = method;