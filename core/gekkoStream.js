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


