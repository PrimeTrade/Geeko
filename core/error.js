let lodash = require('lodash');

let name,message;

let RetryError = function(message) {
    lodash.bindAll(this);

    this.name = "RetryError";
    this.message = message;
}

RetryError.prototype = new Error();

let AbortError = function(message) {
    lodash.bindAll(this);

    this.name = "AbortError";
    this.message = message;
}

AbortError.prototype = new Error();

module.exports = {'RetryError': RetryError,'AbortError': AbortError};
