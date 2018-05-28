//modeules required
let retry = require("retry");
let fs = require('fs');
let moment = require('moment');

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
},
  
//function to get gekToEnv
function gekkoEnv() {
    return _gekkoEnv || 'standalone';
},



console.log(equals(5,2));
console.log(getPackage());