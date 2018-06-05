const _ = require('lodash');
const log = require('../core/log');

let method = {
    init: ()=>{
        this.name = 'PPO';

        this.trend = {
            direction: 'none',
            duration: 0,
            persisted: false,
            adviced: false
        };

        this.requiredHistory = this.tradingAdvisor.historySize;
        this.addIndicator('ppo', 'PPO', this.settings);
    },
    update: (candle)=>{
        //actions to perform on every new candle.
    },
    log: ()=>{
        let digits = 8;
        let ppo = this.indicators.ppo;
        let long = ppo.result.longEMA;
        let short = ppo.result.shortEMA;
        let macd = ppo.result.macd;
        let result = ppo.result.ppo;
        let macdSignal = ppo.result.MACDsignal;
        let ppoSignal = ppo.result.PPOsignal;

        log.debug('calculated MACD properties for candle:');
        log.debug('\t', 'short:', short.toFixed(digits));
        log.debug('\t', 'long:', long.toFixed(digits));
        log.debug('\t', 'macd:', macd.toFixed(digits));
        log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
        log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
        log.debug('\t', 'ppo:', result.toFixed(digits));
        log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
        log.debug('\t', 'ppohist:', (result - ppoSignal).toFixed(digits));
    },
    check: (candle)=> {
        let price = candle.close;

        let ppo = this.indicators.ppo;
        let long = ppo.result.longEMA;
        let short = ppo.result.shortEMA;
        let macd = ppo.result.macd;
        let result = ppo.result.ppo;
        let macdSignal = ppo.result.MACDsignal;
        let ppoSignal = ppo.result.PPOsignal;

        let ppoHist = result - ppoSignal;

        if (ppoHist > this.settings.thresholds.up) {

            // new trend detected
            if (this.trend.direction !== 'up')
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

        } else if (ppoHist < this.settings.thresholds.down) {

            // new trend detected
            if (this.trend.direction !== 'down')
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