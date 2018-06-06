let log = require('../../core/log');


let Indicator = function(settings) {
  	this.input = 'candle';
  	this.tp = 0.0;
  	this.result = false;
  	this.hist = []; 
  	this.mean = 0.0;
  	this.size = 0;
  	this.constant = settings.constant;
  	this.maxSize = settings.history;
  	for (let i = 0; i < this.maxSize; i++)
      	this.hist.push(0.0);
}


Indicator.prototype.update = function(candle) {

  	let tp = (candle.high + candle.close + candle.low) / 3;
  	if (this.size < this.maxSize) {
      	this.hist[this.size] = tp;
      	this.size++;
  	} 
  	else {
      	for (let i = 0; i < this.maxSize-1; i++) {
          	this.hist[i] = this.hist[i+1];
      	}
      	this.hist[this.maxSize-1] = tp;
  	}

  	if (this.size < this.maxSize) {
      	this.result = false;
  	} 
  	else {
      	this.calculate(tp);
  	}
}


Indicator.prototype.calculate = function(tp) {

   	let sumtp = 0.0
	
	for (let i = 0; i < this.size; i++) {
     	sumtp = sumtp + this.hist[i];
	}

    this.avgtp = sumtp / this.size;
   
    this.tp = tp;

    let sum = 0.0;

    for (let i = 0; i < this.size; i++) {
        let z = (this.hist[i] - this.avgtp);
        if (z < 0) z = z * -1.0;
        sum = sum + z;
    }

    this.mean = (sum / this.size);
    this.result = (this.tp - this.avgtp) / (this.constant * this.mean);

}

module.exports = Indicator;