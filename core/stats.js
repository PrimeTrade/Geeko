let stats = require('stats-lite');
let lodash = require('lodash');


stats.sharpe = (returns, rfreturn) => {
  return (stats.mean(returns) - rfreturn) / stats.stdev(returns);
}

module.exports = stats;
