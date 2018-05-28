//modules required
let retry = require("retry");
let fs = require('fs');
let moment = require('moment');
let program = require('commander');


let _config = false;
let _package = false;
let _nodeVersion = false;
let _gekkoMode = false;
let _gekkoEnv = false;
let _args = false;

let startTime = moment;
//helper functions

//check for 2 instances if same or not
//return true when same false when not same
function equals(a,b){
	if(a==b)
		return true;
	else
		return false;
}

//function to converts minutes to MM
function minToMs(min){
	return min*60*1000;
}

//set the config status
function setConfig(config){
	_config = config;
}

//return the current package
function getPackage(){
	if(_package)
	{
		return _package;
	}
	//_package = JSON.parse( fs.readFileSync(__dirname + '/../package.json', 'utf8') );
	return _package;
}

//function to get the starttime
function getStartTime(){
	return startTime;
}

//function for UI
function launchUI(){
	if(program['ui'])
      return true;
    return false;
}

//function to set the gekkoEnc variable
function setGekkoEnv(env) {
	_gekkoEnv = env;
}
  
//function to get gekToEnv
function gekkoEnv() {
    return _gekkoEnv || 'standalone';
}

//function to call retryHelper according to the parameter
function retryCustom(options, fn, callback) {
    retryHelper(fn, options, callback);
}

//function to call retryHelper setting maxTimeout and minTimeout
function retry1(fn, callback) {
    let options = {
      retries: 5,
      factor: 1.2,
      minTimeout: 1 * 1000,
      maxTimeout: 3 * 1000
    };
    retryHelper(fn, options, callback);
}

//function to declare all three modes of gekko
function gekkoModes() {
	let a=['importer','backtest','realtime']
    return a;
}

//check the mode of gekko if gekkomode is set
function gekkoMode() {
    if(_gekkoMode)
      return _gekkoMode;

    if(program.importer)
      return 'importer';
    else if(program.backtest)
      return 'backtest';
    else if(program.realtime)   
      return 'realtime';
}




//console.log(gekkoMode());