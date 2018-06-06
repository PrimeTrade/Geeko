let BTCChina = require('btc-china-fork');
let util = require('../../core/util.js');
let lodash = require('lodash');
let moment = require('moment');
let log = require('../../core/log');

let config = util.getConfig();

let dirs = util.dirs();

let Fetcher = require(dirs.exchanges + 'btcc');

// patch getTrades..
Fetcher.prototype.getTrades = function(fromTid, sinceTime, callback) {
  let args = lodash.toArray(arguments);
  let process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    callback(result);
  }.bind(this);

  if(sinceTime)
    let params = {
      limit: 1,
      sincetype: 'time',
      since: sinceTime
    }

  else if(fromTid)
    let params = {
      limit: 5000,
      since: fromTid
    }

  this.btcc.getHistoryData(process, params);
}

util.makeEventEmitter(Fetcher);

let iterator = false;
let end = false;
let done = false;
let from = false;

let fetcher = new Fetcher(config.watch);

let fetch = () => {
  if(!iterator)
    fetcher.getTrades(false, from, handleFirstFetch);
  else
    fetcher.getTrades(iterator, false, handleFetch);
}

// we use the first fetch to figure out 
// the tid of the moment we want data from
let handleFirstFetch = trades => {
  iterator = lodash.first(trades).tid;
  fetch();
}

let handleFetch = trades => {

  iterator = lodash.last(trades).tid;
  let last = moment.unix(lodash.last(trades).date);

  if(last > end) {
    fetcher.emit('done');

    let endUnix = end.unix();
    trades = lodash.filter(
      trades,
      t => t.date <= endUnix
    );
  }

  fetcher.emit('trades', trades);
}

module.exports = function (daterange) {
  from = daterange.from.unix();
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}
