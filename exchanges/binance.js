let lodash = require('lodash');

let Errors = require('../core/error');
let log = require('../core/log');

let trader = function (config){
	lodash.bindAll(this);
	
	if(lodash.isObject(config)){
		this.key = config.key;
		this.currency = config.currency.toUpperCase();
		this.secret = config.secret;
		this.asset = config.asset.toUpperCase();
		
	}
	
	this.pair = this.asset + this.currency;
	this.name = 'binance';
	this.market = lodash.find(trader.getCapabilities().market, (market)=>{
		
		return market.pair[0] === this.currenc && market.pair[1] === this.asset ? true:false;
	});
	
	this.binance = new Binance.BinanceRest({
    	key: this.key,
    	secret: this.secret,
    	timeout: 15000,
    	recvWindow: 60000, // suggested by binance
    	disableBeautification: false,
    	handleDrift: true,
  	});
  
};


let retryCritical = {retries:10, factor:1.2, minTimeout:1000, maxTimeout:30000};

let retryForever = {forever:true, factor:1.2, minTimeout:10000, maxTimeout:30000};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|Error -1021|Response code 429|Response code 5)/);

trader.prototype.precessError = function(funcName, error){
	
	if(!error)
		return undefined;
	
	if(!error.message || !error.message.match(recoverableErrors)){
		
    	log.error(`[binance.js] (${funcName}) returned an irrecoverable error: ${error}`);
    	return new Errors.AbortError('[binance.js] ' + error.message || error);
	}
	
	
  	log.debug(`[binance.js] (${funcName}) returned an error, retrying: ${error}`);
  	return new Errors.RetryError('[binance.js] ' + error.message || error);
};

trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {
    if (body && body.code) {
      error = new Error(`Error ${body.code}: ${body.msg}`);
    }

    return callback(this.processError(funcName, error), body);
  }
};

trader.prototype.getTrades = function (since, callback, descending){

	let processResults = function(err, data){
		if(err)
			return callback(err);	
			
		let parsedTrades = [];
		
		lodash.each(data,function(trade){
			parsedTrades.push({
				tid: trade.aggTradeId,
				date: moment(trade.timestamp).unix(),
				price: parseFloat(trade.price),
				amount: parseFloat(trade.quantity),
			});
		},this);
		
		descending == true ? callback(null,parsedTrades.reverse()) : callback(undefined, parsedTrades) ;
	};
	
	let reqData = {symbol:this.pair,};
	
	if(since){
		let endTs = moment(since).add(1,'h').valueOf();
		let nowTs = moment().valueOf();
		
		reqData.startTime = moment(since).valueOf();
    	reqData.endTime = endTs > nowTs ? nowTs : endTs;	
	}
	
	let handler = (cb) => this.binance.aggTrades(reqData, this.handleResponse('getTrade', cb));
	util.retryCustom(retryForever, lodash.bind(handler,this), lodash.bind(processResults,this));
	
};


trader.prototype.getPortfolio = function(callback) {
  	let setBalance = function(err, data) {
    	log.debug(`[binance.js] entering "setBalance" callback after api call, err: ${err} data: ${JSON.stringify(data)}`)
    	if (err) 
    		return callback(err);
		
		let findAsset = function(item) {
      		return item.asset === this.asset;
    	}
    	let assetAmount = parseFloat(lodash.find(data.balances, lodash.bind(findAsset, this)).free);

    	let findCurrency = function(item) {
      		return item.asset === this.currency;
    	}
    	let currencyAmount = parseFloat(lodash.find(data.balances, lodash.bind(findCurrency, this)).free);

    	if (!lodash.isNumber(assetAmount) || lodash.isNaN(assetAmount)) {
      		log.error(`Binance did not return portfolio for ${this.asset}, assuming 0.`);
      		assetAmount = 0;
    	}
	
    	if (!lodash.isNumber(currencyAmount) || lodash.isNaN(currencyAmount)) {
      		log.error(`Binance did not return portfolio for ${this.currency}, assuming 0.`);
      		currencyAmount = 0;
    	}

    	let portfolio = [{ name: this.asset, amount: assetAmount },{ name: this.currency, amount: currencyAmount },];

    	return callback(undefined, portfolio);
  		};

  let handler = (cb) => this.binance.account({}, this.handleResponse('getPortfolio', cb));
  util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(setBalance, this));
};


trader.prototype.getFee = function(callback) {
  let makerFee = 0.1;
  callback(undefined, makerFee / 100);
};

trader.prototype.getTicker = function(callback) {
  let setTicker = function(err, data) {
    log.debug(`[binance.js] entering "getTicker" callback after api call, err: ${err} data: ${(data || []).length} symbols`);
    if (err) return callback(err);

    let findSymbol = function(ticker) {
      return ticker.symbol === this.pair;
    }
    let result = lodash.find(data, lodash.bind(findSymbol, this));

    let ticker = {
      ask: parseFloat(result.askPrice),
      bid: parseFloat(result.bidPrice),
    };

    callback(undefined, ticker);
  };

  let handler = (cb) => this.binance.lodashmakeRequest({}, this.handleResponse('getTicker', cb), 'api/v1/ticker/allBookTickers');
  util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(setTicker, this));
};


trader.prototype.getPrecision = function(tickSize) {
  if (!isFinite(tickSize)) return 0;
  let e = 1, p = 0;
  while (Math.round(tickSize * e) / e !== tickSize) { e *= 10; p++; }
  return p;
};

trader.prototype.roundAmount = function(amount, tickSize) {
  let precision = 100000000;
  let t = this.getPrecision(tickSize);

  if(Number.isInteger(t))
    precision = Math.pow(10, t);

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;
  return amount;
};

trader.prototype.getLotSize = function(tradeType, amount, price, callback) {
  amount = this.roundAmount(amount, this.market.minimalOrder.amount);
  if (amount < this.market.minimalOrder.amount)
    return callback(undefined, { amount: 0, price: 0 });

  price = this.roundAmount(price, this.market.minimalOrder.price)
  if (price < this.market.minimalOrder.price)
    return callback(undefined, { amount: 0, price: 0 });

  if (amount * price < this.market.minimalOrder.order)
    return callback(undefined, { amount: 0, price: 0});

  callback(undefined, { amount: amount, price: price });
}

trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  log.debug(`[binance.js] (addOrder) ${tradeType.toUpperCase()} ${amount} ${this.asset} @${price} ${this.currency}`);

  let setOrder = function(err, data) {
    log.debug(`[binance.js] entering "setOrder" callback after api call, err: ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);

    let txid = data.orderId;
    log.debug(`[binance.js] added order with txid: ${txid}`);

    callback(undefined, txid);
  };

  let reqData = {
    symbol: this.pair,
    side: tradeType.toUpperCase(),
    type: 'LIMIT',
    timeInForce: 'GTC', // Good to cancel (I think, not really covered in docs, but is default)
    quantity: amount,
    price: price,
    timestamp: new Date().getTime()
  };

  let handler = (cb) => this.binance.newOrder(reqData, this.handleResponse('addOrder', cb));
  util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(setOrder, this));
};

trader.prototype.getOrder = function(order, callback) {
  let get = function(err, data) {
    log.debug(`[binance.js] entering "getOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);

    let price = parseFloat(data.price);
    let amount = parseFloat(data.executedQty);
    
    // Data.time is a 13 digit millisecon unix time stamp.
    // https://momentjs.com/docs/#/parsing/unix-timestamp-milliseconds/ 
    let date = moment(data.time);

    callback(undefined, { price, amount, date });
  }.bind(this);

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.queryOrder(reqData, this.handleResponse('getOrder', cb));
  util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(get, this));
};

trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

trader.prototype.checkOrder = function(order, callback) {
  let check = function(err, data) {
    log.debug(`[binance.js] entering "checkOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);

    let stillThere = data.status === 'NEW' || data.status === 'PARTIALLYlodashFILLED';
    let canceledManually = data.status === 'CANCELED' || data.status === 'REJECTED' || data.status === 'EXPIRED';
    callback(undefined, !stillThere && !canceledManually);
  };

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.queryOrder(reqData, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(check, this));
};

trader.prototype.cancelOrder = function(order, callback) {
  // callback for cancelOrder should be true if the order was already filled, otherwise false
  let cancel = function(err, data) {
    log.debug(`[binance.js] entering "cancelOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) {
      if(data && data.msg === 'UNKNOWNlodashORDER') {  // this seems to be the response we get when an order was filled
        return callback(true); // tell the thing the order was already filled
      }
      return callback(err);
    }
    callback(undefined);
  };

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.cancelOrder(reqData, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(cancel, this));
};


trader.getCapabilities = function() {
  return {
    name: 'Binance',
    slug: 'binance',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
  };
};

module.exports = trader;
















