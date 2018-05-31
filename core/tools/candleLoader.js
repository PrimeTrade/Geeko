const batchSize = 1000;

const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');

const util = require('../../core/util');
const config = util.getConfig();
const dirs = util.dirs();
const log = require(dirs.core + '/log');

const adapter = config[config.adapter];
const Reader = require(dirs.Geeko + adapter.path + '/reader');
const daterange = config.daterange;

const candleBatcher = require(dirs.core + 'candleBatcher');

const to = moment.utc(daterange.to).startOf('minute');
const from = moment.utc(daterange.from).startOf('minute');
const toUnix = to.unix();

if(to <= from)
util.die('Daterange does not make sense');

if(!from.isValid())
    util.die('invalid `from` ');

if(!to.isValid())
    util.die('invalid `to` ');

let iterator = {
    from: from.clone(),
    to: from.clone().add(batchSize, 'min').subtract(1, 'sec')
}

let DONE = false;
let result = [];
let reader = new Reader();
let batcher;
let next;

let doneFn = () => {
    process.nextTick(() => {
        next(result);
    })
};

module.exports = function (candleSize,next) {
    next = _.once(_next);


    batcher= new candleBatcher(candleSize).on('candle', handleBatchedCandles);
    getBatch();
}


const getBatch = () => {
    reader.get(
        iterator.from.unix(),
        iterator.to.unix(),
        'full',
        handleCandles
    )


}
const shiftIterator = () => {
    iterator = {
        from: iterator.from.clone().add(batchSize,'min'),
        to: iterator.from.clone().add(batchSize * 2 ,'min').subtract(1,'sec')
    }
}

const handleCandles = () => {
    if(err)
    {
        console.error(err);
        util.die('Error encountered');

    }

    if(_.size[data]  && _.last(data).start >= toUnix)
        DONE = true;

    batcher.write(data);

    if(DONE)
    {
        reader.close();

        setTimeOut(doneFn,100);
    }
    else {
        shiftIterator();
        getBatch();
    }
}
const handleBatchedCandles = candle => {
    result.push(candle);
}



