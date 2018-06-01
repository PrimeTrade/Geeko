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








