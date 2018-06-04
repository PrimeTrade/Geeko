let Bitstamp = require('bitstamp');
let _ = require('lodash');
let log = require('../core/log');
let moment = require('moment');
let util = require('../core/util');

let trader = (config)=>{
    _.bindAll(this);
    if(_.isObject(config)){
        this.key = config.key;
        this.secret = config.secret;
        this.clientID = config.username;
        this.asset = config.asset.toLowerCase();
        this.currency = config.currency.toLowerCase();
        this.market = this.asset + this.currency;
    }
    this.name = 'Bitstamp';
    this.bitstamp = new Bitstamp(this.key, this.secret, this.clientID);
}

//if exchange errors we retry again after 10 sec
trader.prototype.retry = (method, args)=>{
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying...');

    let self = this;

    _.each(args, (arg, i)=>{
        if(_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });
    setTimeout(
        ()=>{
            method.apply(self, args)
        },
        wait
    );
};
trader.prototype.getPortfolio = (callback)=>{
    let args = _.toArray(arguments);
    let set = (err, data)=>{
        if(data && data.error){
            err = data.error;
        }
        if(err){
            if(err.meta && err.meta.reason === 'API key not found')
                util.die('Bitstamp says this API keys is invalid..');
            log.error('BITSTAMP API ERROR:', err);
            return this.retry(this.getPortfolio, args);
        }
        let portfolio = [];
        _.each(data, (amount, asset)=>{
            if(asset.indexOf('available') !== -1){
                asset = asset.substr(0, 3).toUpperCase();
                portfolio.push({name: asset, amount: parseFloat(amount)});
            }
        });
        callback(err, portfolio);
    };
    set.bind(this);
    this.bitstamp.balance(this.market, set);
};

trader.prototype.getTicker = (callback)=>{
    this.bitstamp.ticker(this.market, callback);
};

trader.prototype.getFee = (callback)=>{
    let set = (err, data)=>{
        if(err)
            callback(err);
        callback(false, data.fee/100);
    };
    set.bind(this);
    this.bitstamp.balance(this.market, set);
};

trader.prototype.buy = (amount, price, callback)=>{
    let findMarket = (pair)=>{
        return pair.pair[0].toLowerCase() === this.currency && pair.pair[1].toLowerCase() === this.asset
    };
    let args = _.toArray(arguments);
    let set = (err, result)=>{
        if(err || result.status === 'error'){
            log.error('unable to buy:', err, result.reason, 'retrying...0');
            return this.retry(this.buy, args);
        }
        callback(null, result.id);
    };
    set.bind(this);

    //Decrease amount by 1% to avoid trying to buy more than balance allows.
    amount = Number(amount * 0.99).toFixed(8);

    //Use proper precision by currency pair
    let pair = _.find(trader.getCapabilities().markets, _.bind(findMarket, this));
    price = Number(Number.parseFloat(price).toFixed(pair.precision));
    this.bitstamp.buy(this.market, amount, price, undefined, set);
};
trader.prototype.sell = (amount, price, callback)=>{
    let findMarket = (pair)=>{
        return pair.pair[0].toLowerCase() === this.currency && pair.pair[1].toLowerCase() === this.asset
    }
    let args = _.toArray(arguments);
    let set = (err, result)=>{
        if(err || result.status === "error"){
            log.error('unable to sell:', err, result.reason, 'retrying...');
            return this.retry(this.sell, args);
        }
        callback(null, result.id);
    };
    set.bind(this);

    //Ensure that there are no more than 8 decimal places.
    amount = Number(Number.parseFloat(amount)).toFixed(8);

    let pair = _.find(trader.getCapabilities().markets, _.bind(findMarket,this));
    price = Number(Number.parseFloat(price).toFixed(pair.precision));

    this.bitstamp.sell(this.market, amount, price, undefined, set);
};

trader.prototype.getOrder = (id, callback)=>{
    let args = _.toArray(arguments);
    let get = (err, data)=> {
        if (!err && _.isEmpty(data) && _.isEmpty(data.result))
            err = 'no data';
        else if (!err && !_.isEmpty(data.error))
            err = data.error;

        let order = _.find(data, o => o.order_id === +id);
        if (err) {
            log.error('Unable to get order', order, JSON.stringify(err));
            return this.retry(this.getOrder, args);
        }

        if (!order) {
            //if the order was cancelled we are unable to retrieve it, assume that this is what happening.
            return callback(err, {price: 0, amount: 0, date: moment(0)});
        }

        let price = parseFloat(order[`${this.asset}_${this.currency}`]);
        let amount = Math.abs(parseFloat(order[this.asset]));
        let date = moment(order.datetime);
        callback(err, {price, amount, date});
    };
    get.bind(this);
    this.bitstamp.user_transactions(this.market, {}, get);
};
trader.prototype.checkOrder = (order, callback)=>{
    let check = (err, result)=>{
        let stillThere = _.find(result, (o)=>{
            return o.id === order
        });
        callback(err, !stillThere);
    };
    check.bind(this);
    this.bitstamp.open_orders(this.market, check);
};
trader.prototype.cancelOrder = (order, callback)=>{
    let args = _.toArray(arguments);
    let cancel = (err, result)=>{
        if(err || !result){
            log.error('unable to cancel order', order, '(', err, result, ')');
            return this.retry(this.cancelOrder, args);
        }
        callback();
    };
    cancel.bind(this);
    this.bitstamp.cancel_order(order, cancel);
};
trader.prototype.getTraders = (since, callback, descending)=>{
    let args = _.toArray(arguments);
    let process = (err, trades)=>{
        if(err)
            return this.retry(this.getTrades, args);
        let result = _.map(trades, t=>{
            return{
                date: t.date,
                tid: +t.tid,
                price: +t.price,
                amount: +t.amount
            }
        });
        callback(null, result.reserve());
    };
    process.bind(this);
    this.bitstamp.transactions(this.market, process);
}
trader.getCapabilities = ()=>{
    return{
        name: 'Bitstamp',
        slug: 'bitstamp',
        currencies: ['USD', 'EUR', 'BTC'],
        assets: ['BTC', 'BCH', 'EUR', 'LTC', 'ETH', 'XRP'],
        maxTradesAge: 60,
        maxHistoryFetch: null,
        markets: [
            { pair: ['USD', 'EUR'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },

            { pair: ['USD', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['EUR', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },

            { pair: ['USD', 'BCH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['EUR', 'BCH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },

            { pair: ['USD', 'XRP'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 5 },
            { pair: ['EUR', 'XRP'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 5 },
            { pair: ['BTC', 'XRP'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },

            { pair: ['USD', 'LTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['EUR', 'LTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },

            { pair: ['USD', 'ETH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['EUR', 'ETH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
            { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },
        ],
        requires: ['key', 'secret', 'username'],
        fetchTimespan: 60,
        tid: 'tid',
        tradable: true
    };
};

module.exports = trader;








