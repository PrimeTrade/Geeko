let _ = require('lodash');
let util = require('../util');
let dirs = util.dirs();
let config = util.getConfig();
let log = require(dirs.core + 'log');
let moment = require('moment');
let daterange = config.importer.daterange;
let from = moment.utc(daterange.from);
if(daterange.to){
    let to = moment.utc(daterange.to);
}
else{
    let to = moment().utc();
    log.debug(
        'End Date not specified for importing, setting to', to.format('YYYY-MM-DD HH:mm:ss')
    );
}
if(!from.isValid())
    util.die('invalid' + from);
if(!to.isValid())
    util.die('invalid' + to);

let TradeBatcher = require(dirs.budfox + 'tradeBatcher');
let CandleManager = require(dirs.budfox + 'candleManager');
let exchangeChecker = require(dire.core + 'exchangeChecker');

let error = exchangeChecker.cantFetchFullHistory(config.watch);
if(error)
    util.die(error,true);

let fetcher = require(dirs.importers + config.watch.exchange);

if(to <= from)
    util.die('This daterange does not make sense.');

let Market = ()=>{
    _.bindAll(this);
    this.exchangeSettings = exchangeChecker.settings(config.watch);

    this.tradeBatcher = new TradeBatcher(this.exchangeSettings.tid);
    this.candleManager = new CandleManager;
    this.fetcher = fetcher({
        to: to, from: from
    });


}