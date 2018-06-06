let _ = require('lodash');
let config = require('../../core/util').getConfig();
let sqlite = require('./handle');
let sqliteUtil = require('./util');
let util = require('../../core/util');
let log = require('../../core/log');

let Store = function (done,pluginMeta) {
    _.bindAll(this);
    this.done = done;
    this.db = sqlite.initDB(false);
    this.db.serialize(this.upsertTables);
    this.cache = [];
    this.buffered = util.gekkoMode() === "importer";
}
Store.prototype.upsertTables = function () {
    let createQueries = [`
        CREATE TABLE IF NOT EXISTS
        ${sqliteUtil.table('candles')}
        { id INTEGER PRIMARY KEY AUTOINCREMENT,
        start INTEGER UNIQUE,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        vwp REAL NOT NULL,
        volume REAL NOT NULL,
        trades INTEGER NOT NULL
        );
    `,
    ];
    let next = _.after(_.size(createQueries),this.done);

    _.each(createQueries,function (qu) {
        this.db.run(qu,next);
    },this);
}

Store.prototype.writeCandles = function () {
    if(_.isEmpty(this.cache))
        return;
    let transaction = function () {
        this.db.run("TRANSACTION BEGIN");

        let stmt = this.db.prepare(`
            INSERT OR IGNORE INTO ${sqliteUtil.table('candles')}
            VALUES (?,?,?,?,?,?,?,?,?)
            `,function (err,rows) {
            if(err){
                log.error(err);
                return util.die('At insert DB error: '+err);
            }
            });
        _.each(this.cache, candle => {
            stmt.run(
                null,
                candle.start.unix(),
                candle.open,
                candle.low,
                candle.high,
                candle.close,
                candle.vwp,
                candle.volume,
                candle.trades
            );
        });
        stmt.finalize();
        this.db.run("COMMIT");

        this.cache = [];
    }
    this.db.serialize(_.bind(transaction,this));
}

let processCandle = function (candle,done) {
    this.cache.push(candle);
    if(!this.buffered || this.cache.length > 1000)
        this.writeCandles();
    done();
};

let finalize = function (done) {
    this.writeCandles();
    this.db.close(() => { done(); });
    this.db = null;
}

if(config.candleWriter.enabled){
    Store.prototype.processCandle = processCandle;
    Store.prototype.finalize = finalize;
}

module.exports = Store;