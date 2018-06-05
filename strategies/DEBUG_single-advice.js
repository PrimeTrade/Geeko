let settings = {
    wait: 0,
    advice: 'short'
};

const _ = require('lodash');
let log = require('../core/log');
let i = 0;
let method = {
    init: _.noop,
    update: _.noop,
    log: _.noop,
    check: ()=>{
        log.info('iteration:', i);
        if(settings.wait === i)
            this.advice(settings.advice);
        i++;
    }
};
module.exports = method;