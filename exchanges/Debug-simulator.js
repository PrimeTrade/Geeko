let lodash = require('lodash');
let moment = require('moment');

const TREND_DURATION = 1000;

let trader = function(){
	
	this.name = 'Exchange Simulator',
	this.at = moment().subtract(30,'minutes');
	
	this.price = 100;
	this.trend = 'up';
	this.tid = 0;
	
}

trader.prototype.getTrades = function(since, cb){
	
	let amount = moment().diff(this.at, 'seconds');
	let trades = lodash.range(amount).map(()=>{
		
		this.tid++;
		
		if(this.tid % TREND_DURATION === 0){
			this.trend = this.trend === 'up' ? 'down' : 'up' ;
		}
		
		this.price = this.trend === 'up' ? this.price + Math.random() : this.price - Math.random();
		
		return {date: this.at.add(1, 'seconds').unix(),price: this.price,amount: Math.random() * 100,tid: this.tid}
	});
	
	console.log(`[EXCHANGE SIMULATOR] emitted ${amount} fake trades, up until ${this.at.format('YYYY-MM-DD HH:mm:ss')}.`);

  	cb(null, trades);
}

trader.getCapabilities = function () {
  return {
    name: 'Exchange Simulator',
    slug: 'DEBUG_exchange-simulator',
    currencies: ['USD'],
    assets: ['BTC', 'BTC'],
    maxTradesAge: 60,
    maxHistoryFetch: null,
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' } },
    ],
    requires: ['key', 'secret', 'username'],
    fetchTimespan: 60,
    tid: 'tid',
    tradable: false
  };
}

module.exports = trader;
