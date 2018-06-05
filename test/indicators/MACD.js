const _ = require('lodash');
const log = require('../../core/log');

let method = {
    init: () => {
        //state about current trend, on every new candle we use this state to check if we need to report.
        this.trend = {
            direction: 'none',
            duration: 0,
            persisted: false,
            adviced: false
        };
        //how much previous data we need as a base before giving advice.
        this.requiredHistory = this.tradingAdvisor.historySize;
        this.addIndicator('macd', 'MACD', this.settings);
    },
    update: (candle)=>{
        //actions to be performed on every new candle
    },
    log: ()=>{
        let digits = 8;
        let macd = this.indicators.macd;

        let diff = macd.diff;
        let signal = macd.signal.result;

        log.debug('calculated MACD properties for candle:');
        log.debug('\t', 'short:', macd.short.result.toFixed(digits));
        log.debug('\t', 'long:', macd.long.result.toFixed(digits));
        log.debug('\t', 'macd:', diff.toFixed(digits));
        log.debug('\t', 'signal:', signal.toFixed(digits));
        log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
    },
    check: ()=> {
        let macddiff = this.indicators.macd.result;

        if (macddiff > this.settings.thresholds.up) {

            // new trend detected
            if (this.trend.direction !== 'up')
            // reset the state for the new trend
                this.trend = {
                    duration: 0,
                    persisted: false,
                    direction: 'up',
                    adviced: false
                };

            this.trend.duration++;

            log.debug('In uptrend since', this.trend.duration, 'candle(s)');

            if (this.trend.duration >= this.settings.thresholds.persistence)
                this.trend.persisted = true;

            if (this.trend.persisted && !this.trend.adviced) {
                this.trend.adviced = true;
                this.advice('long');
            } else
                this.advice();

        } else if (macddiff < this.settings.thresholds.down) {

            // new trend detected
            if (this.trend.direction !== 'down')
            // reset the state for the new trend
                this.trend = {
                    duration: 0,
                    persisted: false,
                    direction: 'down',
                    adviced: false
                };

            this.trend.duration++;

            log.debug('In downtrend since', this.trend.duration, 'candle(s)');

            if (this.trend.duration >= this.settings.thresholds.persistence)
                this.trend.persisted = true;

            if (this.trend.persisted && !this.trend.adviced) {
                this.trend.adviced = true;
                this.advice('short');
            } else
                this.advice();

        }
        else {
            log.debug('In no trend');
            this.advice();
        }
    }
};
module.exports = method;