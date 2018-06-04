let lodash = require('lodash');
let CoinFalcon = require('coinfalcon');
let moment = require('moment');

let log = require('../core/log');


let trader = function(config){
	
	lodash.bindall(this);
	if(lodash.isObject(config)){
	
		this.key = config.key;
		this.secret = config.secret;
		
		this.currency = config.currency;
		this.currency.toUpperCase();
		
		this.asset = confi.asset;
		this.asset.toUpperCase();
	}
	this.pair = this.asset +'-'+ this.currency;
	this.name = 'coinfalcon';
	
	this.coinfalcon = new Coinfalcon.Client(this.key, this.secret);
};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|429|522)/);


trader.prototype.retry = function(methods,args,error){

	let self = this;
	lodash.each(args,function(arg,i){
	
		if(lodash.isFunction(arg)){
			args[i] = lodash.bind(arg,self);
		}
	});
	
	log.debug('[CoinFalcon] ', this.name, "Retrying...");
	
	if(!error || !error.message.match(recoverableErrors)){
		
		log.error('[CoinFalcon] ', this.name, 'returned an irrecoverable error');
		lodash.each(args , function(arg,i){
		
			if(lodash.isFunction(arg)){
				arg(error,null);
				return;
			}
		});
		return;
	}
	
	let wait = wait + moment.duration(5,'second'); 
	
	setTimeout(function(){
		method.apply(self,args);
	},wait);
};

// for failure and success of the cainfalcon and call callback function accordingly
trader.prototype.getTicker = function(callback){

	let failure = function(err){
		//states the error using log file
		log.error('[CoinFalcon] error gettion ticker', err);
		callback(err,null);
	};
	
	let success = function(res){
		callback(null, {bid: +res.data.bids[0].price, ask: +res.data.ask[0].price});
	};
	
	//url for orders 
	let url = "markets/" + this.pair +"/orders?level=1" ; 
	
	this.coinfalcon.get(url).then(success).catch(failure);
};

//take a fees equal to 0.25% on bath of the sell and buy trades
trader.getFee = function(callback){
	
	callback(false, 0.0025);
}


trader.prototype.getOrder = function(order, callback){

	let success = function(res){
		if(lodash.has(res, 'error')){
	
			let err = new Error(res.error);
			failure(err);
		}
		else
		{
		
			let price = parseFloat(res.data.price);
			let amount = parseFloat(res.data.size);
      		let date = moment(res.data.created_at);
      		callback(false, { price, amount, date });
		}
	};
	
	let failure = function(err){
		log.error('[CoinFalcon] unable to get order', err);
		callback(err, null);
		
	}.bind(this);
	
	this.coinfalcon.get('user/orders/' + order).then(success).catch(failure);
};


trader.prototype.getPortfolio = function(callback) {
  	var success = function(res) {
    	if (lodash.has(res, 'error')) {
      		var err = new Error(res.error);
      		callback(err, null);
    	} 
    	else {
      		let portfolio = res.data.map(function(account) {
        		return {name: account.currency, amount: parseFloat(account.available)}
      		});
      		
      		callback(null, portfolio);
    	}
  	};

  	let failure = function(err) {
    	log.error('[CoinFalcon] error getting portfolio', err);
    	callback(err, null);
  	}

  	this.coinfalcon.get('user/accounts').then(success).catch(failure);
};



trader.prototype.addOrder = function(type, amount, price, callback){

	let args = lodash.toArray(arguments);
	let success = function(res){
		if(lodash.has(res, 'error')){
		
			let err = new Error(res.error);
			failure(err);
		}
		else{
		
			callback(false, res.data.id);
		}
	};
	
	let failure = function(err){
		log.error('[CoinFalcon] unable to' + type.toLowerCase(), err);
		return this.retry(this.addOrder,args,err);
	}.bind(this);	
	
	let payload = { order_type: type, operation_type: 'limit_order', market: this.pair, size: amount, price:price};
	
	this.coinfalcon.post('user/orders', payload).then(success).catch(failure);
};	


['buy', 'sell'].map(function(type) {
  	trader.prototype[type] = function(amount, price, callback) {
    	this.addOrder(type, amount, price, callback);
  	};
});


trader.prototype.checkOrder = function(order, callback){
	let success = function(res){
	
		if(lodash.has(res, 'error')){
			let err = new Error(res.error);
			failure(err);
		}
		else{
			let filled = res.data.status == "canceled" || res.data.status == "fulfilled";
			callback(false, filled);
		}
	};
	
	let failure = function(err){
		log.error('[CoinFalcon] unable to check order', err);
		callback(err,null);
	}.bind(this);
	
	this.coinfalcon.get('user/orders/' + order).then(success).catch(failure);

};


trader.prototype.cancelOrder = function(order, callback){

	let arg = lodash.toArray(arguments);
	
	let success = function(res){
		if(lodash.has(res, 'error')){
			let err = new Error(res.error);
			failure(err);
		}	
		else{
			callback(false, rs.data.id);
		}
	};
	
	let failure = function(err){
		log.error('[CoinFalcon] unable to cancel',err);
		return this.retry(this.cancelOrder, arg, err);
	}.bind(this);
	
	this.coinfalcon.delete('user/orders?id=' + order).then(success).catch(failure);
	
};


trader.prototype.getTrades =  function(since, callback, descnding){
	let arg = lodash.toArray(arguments);
	
	let success = function(res){
	
		let parsedTrades = [];
		
		lodash.each(res.data,function(trades){
			parsedTrades.push({
				tid: moment(trade.created_at).unix(), 
				date: moment(trade.created_at).unix(),
          		price: parseFloat(trade.price),
          		amount: parseFloat(trade.size),
			});
		},this);
		
		descending ? callback(null,parsedTrades) : callback(null, parsedTrades.reverse());
	}.bind(this);
	
	let failure = function(err){
		err =new Error(err);
		log.error('[CoinFalcon] error in getting trades' , err);
		return this.retry(this.getTrades, args,err);
	}.bind(this);
	
	let url = "markets/" + this.pair + "/trades"

  	if (since) {
    	url += '?since_time=' + (lodash.isString(since) ? since : since.toISOString());
  	}

  	this.coinfalcon.get(url).then(success).catch(failure);	
}


trader.getCapabilities = function () {
  return {
    name: 'CoinFalcon',
    slug: 'coinfalcon',
    assets: marketData.assets,
    currencies: marketData.currencies,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
    forceReorderDelay: false
  };
}

//export the trader variable
module.exports = trader;
