let _ = require('lodash');
let config = require('../../core/util').getConfig();
let handle = require('handle');
let postgresUtil = require('./util');

let Store = function (done,pluginMeta) {
    _.bindAll(this);
    this.done = done;
    this.db = handle;
    this.upsertTables();
    this.cache = [];
}
Store.prototype.upsertTables = function () {
    let createQueries = [
        `CREATE TABLE IF NOT EXISTS ${postgresUtil.table('candles')}(
        id BIGSERIAL PRIMARY KEY,
        start integer UNIQUE,
        open double precision NOT NULL,
        high double precision NOT NULL,
        low double precision NOT NULL,
        close double precision NOT NULL,
        vwp double precision NOT NULL,
        volume double precision NOT NULL,
        trades INTEGER NOT NULL
        );`
    ];
    let next = _.after(_.size(createQueries),this.done);
    _.each(createQueries,function (q) {
        this.db.query(q,next);
    },this);
}

Store.prototype.writeCandles = function () {
    if (_.isEmpty(this.cache)) {
        return;
    }
    let stmt = `
        INSERT INTO ${postgresUtil.table('candles')}
    (start,open,high,low,close,vwp,volume,trades)
    select $1, $2, $3, $4, $5, $6, $7, $8
    WHERE NOT EXISTS (select id from ${postgresUtil.table('candles')} where start=$1);
    `;
    _.each(this.cache, candle => {
        this.db.query(stmt, [
            candle.start.unix(),
            candle.open,
            candle.high,
            candle.low,
            candle.close,
            candle.vwp,
            candle.volume,
            candle.trades
        ]);
    });
    this.cache = [];
}
let processCandle = function (candle,done) {
    this.cache.push(candle);
    if(this.cache.length > 1)
        this.writeCandles();
    done();
};
let finalize = function (done) {
    this.writeCandles();
    this.db = null;
    done();
}
if (config.candleWriter.enabled){
    Store.prototype.processCandle = processCandle;
    Store.prototype.finalize = finalize;
}

module.exports = Store;