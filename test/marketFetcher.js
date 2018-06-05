let chai = require('chai');
let expect = chai.expect;
let should = chai.should;
let assert = chai.assert;
let sinon = require('sinon');
let proxyquire = require('proxyquire');

let lodash = require('lodash');
let moment = require('moment');

let util = require('../core/util.js');
let config = util.getConfig();
let dirs = util.dirs();

let providerName = config.watch.exchange.toLowerCase();
let providerPath = util.dirs().gekko + 'exchanges/' + providerName;

let mf;

let spoofer = {};

let TRADES = [{ tid: 1, amount: 1, price: 100, date: 1475837937 }, { tid: 2, amount: 1, price: 100, date: 1475837938 }];

let getTrades = function(since, handler, descending) {
  	handler(null,TRADES);
}

let FakeProvider = function() {};

FakeProvider.prototype = {
  	getTrades: getTrades
}

spoofer[providerPath] = FakeProvider;
let getTradesSpy = sinon.spy(FakeProvider.prototype, 'getTrades');


let TradeBatcher = require(util.dirs().budfox + 'tradeBatcher');
let tradeBatcherSpy = sinon.spy(TradeBatcher.prototype, 'write');
spoofer[util.dirs().budfox + 'tradeBatcher'] = TradeBatcher;

let MarketFetcher = proxyquire(dirs.budfox + 'marketFetcher', spoofer);

describe('budfox/marketFetcher', function() {
  	it('should throw when not passed a config', function() {
    	expect(function() {
      		new MarketFetcher();
    	}).to.throw('TradeFetcher expects a config');
  	});

  	it('should instantiate', function() {
   	 	mf = new MarketFetcher(config);
  	});

  	it('should fetch with correct arguments', function() {

    	mf.fetch();
    	expect(getTradesSpy.callCount).to.equal(1);
    
    	let args = getTradesSpy.firstCall.args;
    
    	let since = args[0];
    	expect(since).to.equal(undefined);

    	let handler = args[1];
   	 	assert.isFunction(handler);

    	let descending = args[2];
    	expect(descending).to.equal(false);
  	});

  

  	it('should pass the data to the tradebatcher', function() {
    	mf.fetch();
    	expect(getTradesSpy.callCount).to.equal(2);

    	expect(tradeBatcherSpy.lastCall.args[0]).to.deep.equal(TRADES);
  	});


});