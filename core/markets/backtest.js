let _ = require('loadash');
let util = require('../util');
let moment = require('moment');
let to = moment.utc(daterange.to);
let from = moment.utc(daterange.from);
if(to <= from)
    util.die('This daterange does not make sense.');
if(!from.isValid())
    util.die('invalid' + from);
if(!to.isValid())
    util.die('invalid' + to);
