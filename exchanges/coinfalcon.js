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







