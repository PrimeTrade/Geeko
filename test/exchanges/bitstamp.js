let chai = require('chai');
let expect = chai.expect;
let should = chai.should;
let sinon = require('sinon');
let proxyquire = require('proxyquire');

let lodash = require('lodash');
let moment = require('moment');

let util = require('../../core/util');
let config = util.getConfig();
let dirs = util.dirs();

let TRADES = require('./data/bitstamplodashtrades.json');

let FakeExchange = function() {};
FakeExchange.prototype = {
  	transactions: function(since, handler, descending) {
    	handler(null,TRADES);
  	}
}


let transactionsSpy = sinon.spy(FakeExchange.prototype, 'transactions');
spoofer = {bitstamp: FakeExchange};


describe('exchanges/bitstamp', function() {
  	let Bitstamp = proxyquire(dirs.exchanges + 'bitstamp', spoofer);
  	let bs;

  	it('should instantiate', function() {
    	bs = new Bitstamp(config.watch);
  	});

  	it('should correctly fetch historical trades', function() {
    	bs.getTrades(null, lodash.noop, false);

    	expect(transactionsSpy.callCount).to.equal(1);

    	let args = transactionsSpy.lastCall.args;
    	expect(args.length).to.equal(2);

    	expect(args[0]).to.equal('btcusd');
  	});

  	it('should retry on exchange error', function() {
    	let ErrorFakeExchange = function() {};
    	ErrorFakeExchange.prototype = {
      		transactions: function(since, handler, descending) {
        		handler('Auth error');
      		}
    	}
    	spoofer = {bitstamp: ErrorFakeExchange}

    	let ErroringBitstamp = proxyquire(dirs.exchanges + 'bitstamp', spoofer);
    	let ebs = new ErroringBitstamp(config.watch);

    	ebs.retry = lodash.noop;
    	let retrySpy = sinon.spy(ebs, 'retry');

    	ebs.getTrades(null, lodash.noop)

    	expect(retrySpy.callCount).to.equal(1);

    	let args = retrySpy.lastCall.args;
    	expect(args[1].length).to.equal(2);
    	expect(args[1][0]).to.equal(null);
  	})

  	it('should correctly parse historical trades', function(done) {
    	let check = function(err, trades) {

      	expect(err).to.equal(null);

      	expect(trades.length).to.equal(TRADES.length);

      	let oldest = lodash.first(trades);
      	let OLDEST = lodash.last(TRADES);

      	expect(oldest.tid).to.equal(+OLDEST.tid);
      	expect(oldest.price).to.equal(+OLDEST.price);
      	expect(oldest.amount).to.equal(+OLDEST.amount);
      	expect(oldest.date).to.equal(OLDEST.date);

      	done();
    }

    bs.getTrades(null, check, false);

  });
});
