let lodash = require('lodash');

let Checker = function() {
  lodash.bindAll(this);
}

Checker.prototype.notValid = function(conf) {
  if(conf.tradingEnabled)
    return this.cantTrade(conf);
  else
    return this.cantMonitor(conf);
}

Checker.prototype.cantMonitor = function(conf) {
  let slug = conf.exchange.toLowerCase();
  let exchange = this.getExchangeCapabilities(slug);

  if(!exchange)
    return 'Gekko does not support the exchange ' + slug;

  let name = exchange.name;

  if('monitorError' in exchange)
    return 'At this moment Gekko can\'t monitor ' + name +  ', find out more info here:\n\n' + exchange.monitorError;

  name = exchange.name;

  if(!_.contains(exchange.currencies, conf.currency))
    return 'Gekko only supports the currencies [ ' + exchange.currencies.join(', ') + ' ] at ' + name + ' (not ' + conf.currency + ')';

  if(!_.contains(exchange.assets, conf.asset))
    return 'Gekko only supports the assets [ ' + exchange.assets.join(', ') + ' ]  at ' + name + ' (not ' + conf.asset + ')';

  let pair = _.find(exchange.markets, function(p) {
    return p.pair[0] === conf.currency && p.pair[1] === conf.asset;
  });

  if(!pair)
    return 'Gekko does not support this currency/assets pair at ' + name;

  // everyting okay
  return false;
}

Checker.prototype.cantTrade = function(conf) {
  let cantMonitor = this.cantMonitor(conf);
  if(cantMonitor)
    return cantMonitor;

  let slug = conf.exchange.toLowerCase();
  let exchange = this.getExchangeCapabilities(slug);
  let name = exchange.name;

  if(!exchange.tradable)
    return 'At this moment Gekko can\'t trade at ' + name + '.';

  if(conf.key === 'your-key')
    return '"your-key" is not a valid API key';

  if(conf.secret === 'your-secret')
    return '"your-secret" is not a valid API secret';

  let error = false;
  _.each(exchange.requires, function(req) {
    if(!conf[req])
      error = name + ' requires "' + req + '" to be set in the config';
  }, this);

  return error;
}


