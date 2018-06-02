let lodash = require('lodash');

let trader = function(config){
	lodash.bindAll(this);
	if(lodash.isObject(config))
	{
		this.key = config.key;
		this.secret = config.secret;
		this.userId = config.username;
		this.pair = config.asset || this.currency;
	}
	
	this.name = 'meXBT';
	this.mexbt = new Mexbt(this.key, this.secret, this.userId);
	
}


trader.prototype.retry = function(method, args) {
  let wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  let self = this;

  // make sure the callback (and any other fn)
  // is bound to trader
  lodash.each(args, function(arg, i) {
    if(lodash.isFunction(arg))
      args[i] = lodash.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}


trader.prototype.getPortfolio = function(callback) {
  let set = function(err, data) {
    let portfolio = [];
    lodash.each(data.currencies, function(balanceInfo) {
      portfolio.push({name: balanceInfo.name, amount: balanceInfo.balance});
    });
    callback(err, portfolio);
  }
  this.mexbt.accountBalance(lodash.bind(set, this));
}


trader.prototype.getTicker = function(callback) {
  this.mexbt.ticker(callback);
}


trader.prototype.getFee = function(callback) {
  let set = function(err, data) {
    if(err)
      callback(err);

    callback(false, data.fee);
  }
  this.mexbt.getTradingFee({amount: 1, type: 'limit'}, lodash.bind(set, this));
}


trader.prototype.buy = function(amount, price, callback) {
  let set = function(err, result) {
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(null, result.serverOrderId);
  };

  this.mexbt.createOrder({amount: amount, price: price, side: 'buy', type: 'limit'}, lodash.bind(set, this));
}


trader.prototype.sell = function(amount, price, callback) {
  let set = function(err, result) {
    if(err || result.error)
      return log.error('unable to sell:', err, result);

    callback(null, result.serverOrderId);
  };

  this.mexbt.createOrder({amount: amount, price: price, side: 'sell', type: 'limit'}, lodash.bind(set, this));
}


trader.prototype.checkOrder = function(order, callback) {
  let currentPair = this.pair;

  let check = function(err, result) {
    let ordersForPair = lodash.find(result, function(o) { return o.ins === currentPair});
    let stillThere = lodash.find(ordersForPair.openOrders, function(o) { return o.ServerOrderId === order });
    callback(err, !stillThere);
  };

  this.mexbt.accountOrders(lodash.bind(check, this));
}

trader.prototype.cancelOrder = function(order, callback) {
  let cancel = function(err, result) {
    if(err || !result)
      log.error('unable to cancel order', order, '(', err, result, ')');
  };

  this.mexbt.cancelOrder({id: order}, lodash.bind(cancel, this));
}

trader.prototype.getTrades = function(since, callback, descending) {
  let args = lodash.toArray(arguments);
  let process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);
    trades = lodash.map(result.trades, function (t) {
      return {tid: t.tid, price: t.px, date: t.unixtime, amount: t.qty};
    });
    if (descending) {
      trades = trades.reverse()
    }
    callback(null, trades);
  }.bind(this);

  let endDate = moment().unix();

  // FIXME: there is a bug in meXBT tradesByDate function, that it doesnt return all data
  // when trying to fetch all.
  // So if no since, we just fetch all via trades and giving a high count
  if (since) {
    this.mexbt.tradesByDate({startDate: since.unix(), endDate: endDate}, process);
  } else {
    // improvised
    this.mexbt.trades({count: 1000}, process);
  }
}

trader.getCapabilities = function () {
  return {
    name: 'meXBT',
    slug: 'mexbt',
    currencies: ['MXN'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['MXN', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' }
      }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: 'date',
    tid: 'tid'
  };
}

module.exports = trader;







