//Budfox is small part of gekko's core
//It aggregates realtime market data from any supported exchange into readable stream of candles

let a = require('lodash');
let asynch = require('async');

let budfox = function (config) {
    a.bindAll(this);
Readable.call( this,{objectMode:true});

}
let Readable = require('stream').Readable;
budfox.prototype = Object.create(Readable.prototype, {
    constructor:
        {
            value:budfox
        }
});
//No callback is given
budfox.prototype._read=function noop() {

}
budfox.prototype.pushCandles = function(candles){
    a.each(candles,this.push);
}