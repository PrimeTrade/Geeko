let config = require('../../core/util').getConfig();
let watch = config.watch;
let exchangeLowerCase = watch ? watch.exchange.toLowerCase() : watch = {};
let settings = {
    exchange: watch.exchange,
    pair: [watch.currency, watch.asset],
    historyCollection: `${exchangeLowerCase}_candles`,
    adviceCollection: `${exchangeLowerCase}_advices`
};
module.exports = { settings};