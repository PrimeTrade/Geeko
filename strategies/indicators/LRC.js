let log = require('../../core/log');

let indicator = function(settings) {
  	this.input = 'price';
  	this.depth = settings;
  	this.result = false;
  	this.age = 0;
  	this.history = [];
  	this.x = [];

  	for (let i = 0; i < this.depth; i++) {
      	this.history.push(0.0);
      	this.x.push(i);
  	}

}


indicator.prototype.update = function(price) {
  
  	if(this.result === false && this.age < this.depth) {

    	this.history[this.age] = price;
    	this.age++;
    	this.result = false;
    	
    	return;
  	}

  	this.age++;

  	for (let i = 0; i < (this.depth - 1); i++) {
      
    	this.history[i] = this.history[i+1];
  	}
  	this.history[this.depth-1] = price;

  	this.calculate(price);
  	return;
}


function linreg(values_x, values_y) {
    	let sum_x = 0;
    	let sum_y = 0;
    	let sum_xy = 0;
    	let sum_xx = 0;
    	let count = 0;
    	
    	let x = 0;
    	let y = 0;
    	let values_length = values_x.length;

    	if (values_length != values_y.length) {
        	throw new Error('The parameters values_x and values_y need to have same size!');
    	}

    
    	if (values_length === 0) {
        	return [ [], [] ];
    	}

    
    	for (let v = 0; v < values_length; v++) {
        	x = values_x[v];
        	y = values_y[v];
        	sum_x = sum_x + x;
        	sum_y = sum_y + y;
        	sum_xx = sum_xx + x*x;
        	sum_xy = sum_xy + x*y;
        	count++;
    	}

    	let m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
    	let b = (sum_y/count) - (m*sum_x)/count;

    	return [m, b];
}


indicator.prototype.calculate = function(price) {
    let reg = linreg(this.x, this.history);

    this.result = ((this.depth-1) * reg[0]) + reg[1];
}


module.exports = Indicator;