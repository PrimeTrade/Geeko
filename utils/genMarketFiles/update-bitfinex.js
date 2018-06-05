let lodash = require('lodash');
let fs = require('fs');
let request = require('request-promise');
let Promise = require('bluebird');

request({
  	url: 'https://api.bitfinex.com/v1/symbolslodashdetails',
  	headers: {Connection: 'keep-alive','User-Agent': 'Request-Promise',},json: true,})
	.then(body => {
  		if (!body) 
    		throw new Error('Unable to fetch list of assets, response was empty');

  	return body;
})

.then(results => {
  	let assets = lodash.unique(lodash.map(results, market => {
    	return market.pair.substring(0, 3).toUpperCase();
  	}));

  	let currencies = lodash.unique(lodash.map(results, market => {
    	return market.pair.substring(3, 6).toUpperCase();
  	}));

  	let markets = lodash.map(results, market => {
    	return {
      		pair: [market.pair.substring(3, 6).toUpperCase(),market.pair.substring(0, 3).toUpperCase()],
      		minimalOrder: {amount: market.minimumlodashorderlodashsize,unit: 'asset',},
    	};
  	});

  	return { assets: assets, currencies: currencies, markets: markets };
})

.then(markets => {
  	fs.writeFileSync('../../exchanges/bitfinex-markets.json', JSON.stringify(markets, null, 2));
  	console.log(`Done writing Bitfinex market data`);
})

.catch(err => {
  	console.log(`Couldn't import products from Bitfinex`);
  	console.log(err);
});


