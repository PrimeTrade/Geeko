// require the writable stream
let Writable = require('stream').Writable;
let lodash = require('lodash');

let util = require('./util');

//initialize the candlecustomer variable and writable stream
let Geeko = function(candleConsumers) {
	this.candleConsumers = candleConsumers;
  
  	Writable.call(this, {objectMode: true});

  	this.finalize = lodash.bind(this.finalize, this);
}


Geeko.prototype = Object.create(Writable.prototype, {
  	constructor: { value: Geeko }
});

//
//process for every element of candleCustomers
Geeko.prototype.lodashwrite = function(chunk, encoding, lodashdone) {
  	let done = lodash.after(this.candleConsumers.length, lodashdone);
  	lodash.each(this.candleConsumers, function(c) {
    	c.processCandle(chunk, done);
  	});
}

//check tradingMethod to shutdown the trade
Geeko.prototype.finalize = function() {
  	var tradingMethod = _.find(this.candleConsumers,c => c.meta.name === 'Trading Advisor');

  	if(!tradingMethod)
    	return this.shutdown();

  	tradingMethod.finish(this.shutdown.bind(this));
}

//check if env is a child process or not
Geeko.prototype.shutdown = function() {
  	async.eachSeries(this.candleConsumers,function(c, callback) {
      	if (!c.finalize) c.finalize(callback);
      		callback();
    },
    function() {
      if (env === 'child-process') 
      		process.send('done');
      else 
      		process.exit(0);		//terminate the process
    });
};

module.exports = Geeko;


