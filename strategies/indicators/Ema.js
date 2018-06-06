let indicator = function(weight) {
  	this.input = 'price';
  	this.weight = weight;
  	this.result = false;
  	this.age = 0;
}

indicator.prototype.update = function(price) {
  	if(this.result === false)
    	this.result = price;

  	this.age++;
  	this.calculate(price);

  	return this.result;
}


indicator.prototype.calculate = function(price) {
  	let k = 2 / (this.weight + 1);
  	let y = this.result;
  	this.result = price * k + y * (1 - k);
}

module.exports = indicator;