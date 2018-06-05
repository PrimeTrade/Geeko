const _ = require('lodash');
const log = require('../core/log');

let settings = {
    wait: 0,
    each: 6
};
let i = 0;
let method = {
    init: _.noop,
    update: _.noop,
    log: _.noop,
    check: ()=>{
        if(settings.wait > i)
            return 0;
        log.info('iteration:', i);
        if(i % settings.each === 0)
            this.advice('short');
        else if(i % settings.each === settings.each / 2)
            this.advice('long');
        i++;
    }
};
module.exports = method;