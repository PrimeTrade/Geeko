// require the writable stream
let Writable = require('stream').Writable;
let lodash = require('lodash');

let util = require('./util');

//initialize the candlecustomer variable and writable stream
let Gekko = function(candleConsumers) {
	this.candleConsumers = candleConsumers;
  
  	Writable.call(this, {objectMode: true});

  	this.finalize = lodash.bind(this.finalize, this);
}

Gekko.prototype = Object.create(Writable.prototype, {
  	constructor: { value: Gekko }
});


Gekko.prototype.lodashwrite = function(chunk, encoding, lodashdone) {
  	let done = lodash.after(this.candleConsumers.length, lodashdone);
  	lodash.each(this.candleConsumers, function(c) {
    	c.processCandle(chunk, done);
  	});
}

Gekko.prototype.finalize = function() {
  	var tradingMethod = _.find(this.candleConsumers,c => c.meta.name === 'Trading Advisor');

  	if(!tradingMethod)
    	return this.shutdown();

  	tradingMethod.finish(this.shutdown.bind(this));
}

Gekko.prototype.shutdown = function() {
  	async.eachSeries(this.candleConsumers,function(c, callback) {
      	if (!c.finalize) c.finalize(callback);
      		callback();
    },
    function() {
      if (env === 'child-process') 
      		process.send('done');
      else 
      		process.exit(0);
    });
};

module.exports = Gekko;


