const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const request = require('request-promise');

let getMinTradesSize = asset=>{
  let minTradeSize = 0.01;
  switch (asset){
      case 'XREP':
          minTradeSize = '0.3';
          break;
      case 'XBT':
          minTradeSize = '0.002';
          break;
      case 'BCH':
          minTradeSize = '0.002';
          break;
      case 'DASH':
          minTradeSize = '0.03';
          break;
      case 'EOS':
          minTradeSize = '3.0';
          break;
      case 'XETH':
          minTradeSize = '0.02';
          break;
      case 'XETC':
          minTradeSize = '0.3';
          break;
      case 'GNO':
          minTradeSize = '0.03';
          break;
      case 'XICN':
          minTradeSize = '2.0';
          break;
      case 'XMLN':
          minTradeSize = '0.1';
          break;
      case 'XLTC':
          minTradeSize = '0.1';
          break;
      case 'XXMR':
          minTradeSize = '0.1';
          break;
      case 'XXRP':
          minTradeSize = '30';
          break;
      case 'XXLM':
          minTradeSize = '300';
          break;
      case 'XZEC':
          minTradeSize = '0.03';
          break;
      case 'USDT':
          minTradeSize = '5';
          break;
      default:
          break;
  }
  return minTradeSize;
};

let assetPromise = request({
    url: 'https://api.kraken.com/0/public/Assets',
    headers: {
        Connection: 'keep-alive',
        'User-Agent': 'Request-Promise'
    },
    json: true,
}).then(body=>{
    if (!body || !body.result) {
        throw new Error('Unable to fetch list of assets, response was empty')
    } else if (!_.isEmpty(body.error)) {
        throw new Error(`Unable to fetch list of assets: ${body.error}`);
    }

    return body.result;
});

let assetPairsPromise = request({
    url: 'https://api.kraken.com/0/public/AssetPairs',
    headers: {
        Connection: 'keep-alive',
        'User-Agent': 'Request-Promise',
    },
    json: true,
}).then(body => {
    if (!body || !body.result) {
        throw new Error('Unable to fetch list of assets, response was empty')
    } else if (!_.isEmpty(body.error)) {
        throw new Error(`Unable to fetch list of assets: ${body.error}`);
    }

    return body.result;
});

Promise.all([assetPromise, assetPairsPromise])
    .then(results => {
        let assets = _.unique(_.map(results[1], market => {
            return results[0][market.base].altname;
        }));
        let currencies = _.unique(_.map(results[1], market => {
            return results[0][market.quote].altname;
        }));
        let marketKeys = _.filter(_.keys(results[1]), k => { return !k.endsWith('.d'); });
        let markets = _.map(marketKeys, k => {
            let market = results[1][k];
            let asset = results[0][market.base];
            let currency = results[0][market.quote];
            return {
                pair: [currency.altname, asset.altname],
                prefixed: [market.quote, market.base],
                book: k,
                minimalOrder: {
                    amount: getMinTradeSize(market.base),
                    unit: 'asset',
                },
                precision: market.pair_decimals
            };
        });
        return { assets: assets, currencies: currencies, markets: markets };
    })
    .then(markets => {
        fs.writeFileSync('../../exchanges/kraken-markets.json', JSON.stringify(markets, null, 2));
        console.log(`Done writing Kraken market data`);
    })
    .catch(err => {
        console.log(`Couldn't import products from Kraken`);
        console.log(err);
    });
