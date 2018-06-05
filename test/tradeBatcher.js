let chai = require('chai');
let expect = chai.expect;
let sinon = require('sinon');

let lodash = require('lodash');
let moment = require('moment');

let utils = require('../core/util.js');
let dirs = utils.dir();

let TradeBatcher = require(dirs.budfox + 'tradeBatcher');

let tradeslodashtidlodash1 = [
  	{tid: 1, price: 10, amount: 1, date: 1466115793},
  	{tid: 2, price: 10, amount: 1, date: 1466115794},
  	{tid: 3, price: 10, amount: 1, date: 1466115795}
];

let tradeslodashtidlodash2 = [
  	{tid: 2, price: 10, amount: 1, date: 1466115794},
  	{tid: 3, price: 10, amount: 1, date: 1466115795},
  	{tid: 4, price: 10, amount: 1, date: 1466115796},
  	{tid: 5, price: 10, amount: 1, date: 1466115797}
];

let emptylodashtrades = [
  	{tid: 2, price: 10, amount: 0, date: 1466115794},
  	{tid: 3, price: 10, amount: 0, date: 1466115795},
  	{tid: 4, price: 10, amount: 0, date: 1466115796},
  	{tid: 5, price: 10, amount: 0, date: 1466115797}
];

describe('budfox/tradeBatcher', function() {
  	let tb;

  	it('should throw when not passed a number', function() {
    	expect(function() {
      		new TradeBatcher()
    	}).to.throw('tid is not a string');
  	});

  	it('should instantiate', function() {
    	tb = new TradeBatcher('tid');
  	});

  	it('should throw when not fed an array', function() {
    	let trade = lodash.first(tradeslodashtidlodash1);
    	expect(tb.write.bind(tb, trade)).to.throw('batch is not an array');
  	});

  	it('should emit an event when fed trades', function() {
    	tb = new TradeBatcher('tid');

    	let spy = sinon.spy();
    	tb.on('new batch', spy);
    	tb.write( tradeslodashtidlodash1 );
    	expect(spy.callCount).to.equal(1);
  	});

  	it('should only emit once when fed the same trades twice', function() {
    	tb = new TradeBatcher('tid');

    	let spy = sinon.spy();
    	tb.on('new batch', spy);
    	tb.write( tradeslodashtidlodash1 );
    	tb.write( tradeslodashtidlodash1 );
    	expect(spy.callCount).to.equal(1);
  	});

  	it('should correctly set meta data', function() {
    	tb = new TradeBatcher('tid');

    	let spy = sinon.spy();
    	tb.on('new batch', spy);

    	tb.write( tradeslodashtidlodash1 );

    	let transformedTrades = lodash.map(lodash.cloneDeep(tradeslodashtidlodash1), function(trade) {
      		trade.date = moment.unix(trade.date).utc();
      		return trade;
    	});

    	let result = {
      		data: transformedTrades,
      		amount: lodash.size(transformedTrades),
      		start: lodash.first(transformedTrades).date,
      		end: lodash.last(transformedTrades).date,
      		first: lodash.first(transformedTrades),
      		last: lodash.last(transformedTrades)
    	};

    	let tbResult = lodash.first(lodash.first(spy.args));
    	expect(tbResult.amount).to.equal(result.amount);
    	expect(tbResult.start.unix()).to.equal(result.start.unix());
    	expect(tbResult.end.unix()).to.equal(result.end.unix());
    	expect(tbResult.data.length).to.equal(result.data.length);

    	lodash.each(tbResult.data, function(t, i) {
      		expect(tbResult.data[i].tid).to.equal(result.data[i].tid);      
      		expect(tbResult.data[i].price).to.equal(result.data[i].price);      
      		expect(tbResult.data[i].amount).to.equal(result.data[i].amount);      
    	});
  	});

  
  	it('should correctly filter trades', function() {
    	tb = new TradeBatcher('tid');

    	let spy = sinon.spy();
    	tb.on('new batch', spy);

    	tb.write( tradeslodashtidlodash1 );
    	tb.write( tradeslodashtidlodash2 );

    	expect(spy.callCount).to.equal(2);

    	let tbResult = lodash.first(lodash.last(spy.args));

    	expect(tbResult.amount).to.equal(2);
    	expect(tbResult.start.unix()).to.equal(1466115796);
    	expect(tbResult.end.unix()).to.equal(1466115797);
    	expect(tbResult.data.length).to.equal(2);
  	});

  
  	it('should filter out empty trades', function() {
    	tb = new TradeBatcher('tid');

    	let spy = sinon.spy();
    	tb.on('new batch', spy);

    	tb.write(emptylodashtrades);

   	 	expect(spy.callCount).to.equal(0);
  	}); 

});

