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

//to get the configuration of Gekko
function getConfig() {

    if(_config)
      return _config;

    if(!program.config)
        util.die('Please specify a config file.', true);

    if(!fs.existsSync(util.dirs().gekko + program.config))
        util.die('Cannot find the specified config file.', true);

    _config = require(util.dirs().gekko + program.config);
    return _config;
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

function inherit(dest, source) {
    require('util').inherits(dest,source);
}
  
function makeEventEmitter(dest) {
    util.inherit(dest, require('events').EventEmitter);
}

function die(m, soft) {
    if(_gekkoEnv === 'standalone' || !_gekkoEnv)
      var logs = console.log.bind(console);
    else if(_gekkoEnv === 'child-process')
      var logs = m => process.send({type: 'error', error: m});

    if(m) {
      if(soft) {
        logs('\n ERROR: ' + m + '\n\n');
      } else {
        logs('\n\nGekko encountered an error and can\'t continue');
        logs('\nError:\n');
        logs(m, '\n\n');
        logs('\nMeta debug info:\n');
        logs(util.logVersion());
        logs('');
      }
    }
    process.exit(1);
}

//console.log(gekkoMode());