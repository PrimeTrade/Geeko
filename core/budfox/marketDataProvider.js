const a = require('lodash');
const util =require('util');
const dirs = util.dirs;


const Manager = function (config) {
    a.bindAll(this);
//fetch trades
    this.source = new MarketFetcher(config);

    //relay newly fetched trades
    this.source.on('trades batch',this.relayTrades);
}
