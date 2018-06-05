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
      case 'XLTC':
          minTradeSize = '0.1';
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
    
})