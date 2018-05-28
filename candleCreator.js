let a = require('lodash');
let moment=require('moment');

let candleCreator = function () {
    a.bindAll(this);
//Remove fixed date
    this.threshold = moment("1970-01-01","YYYY-MM-DD");

    //Hold the leftover between fetches
    this.buckets={

    };
}
candleCreator.prototype.write=function (batch) {
    let trade=batch.data;
    if(a.isEmpty(trade))
        return;
    trade=this.filter(trade);
    this.fillBuckets(trade);

}