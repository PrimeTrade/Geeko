//file to configure plugins and check if they can be loaded or not
let lodash = require("lodash");
let util = require("./util");

let error, constructor;

let log = require(util.dirs().core + 'log');
//get configuration dirs plugin an the three different gekkomodes
let config = util.getConfig();
let pluginDir = util.dirs().plugins;
lets gekkoMode = util.gekkoMode();
//three geeko modes:- RealTime, BackTesting, importer

let pluginHelper = { 

// some plugin helper functions

//helper function to check for module that can't be load

	cannotLoad: function(plugin) {

		if(lodash.has(plugin, 'dependencies'))
      		error = false;

    	lodash.each(plugin.dependencies, function(dep) {
        	try {
          		let a = require(dep.module);
        	}
        	catch(e) {
          		log.error('ERROR LOADING DEPENDENCY', dep.module);

          		if(!e.message) {
            		log.error(e);
            		util.die();
          		}

          		if(!e.message.startsWith('Cannot find module'))
            		return util.die(e);
        		
        		if(!e.message.startsWith('Cannot find module'))
            		return util.die(e);

          		error = ['The plugin',plugin.slug,'expects the module',dep.module,'to be installed.','However it is not, install','it by running: \n\n','\tnpm install',dep.module + '@' + dep.version].join(' ');
          	}
      	});
	
		return error;
  	},
  	
  	//function when the plugin can be loaded
  	load: function(plugin, next) {

		//the configuration of the plugin
    	plugin.config = config[plugin.slug];

    	if(!plugin.config || !plugin.config.enabled)
      		return next();

		//mode enetered which is not suppored by the geeko
    	if(!_.contains(plugin.modes, gekkoMode)) {
      		log.warn('The plugin',plugin.name,'does not support the mode',gekkoMode + '.','It has been disabled.')
      		return next();
    	}

    	log.info('Setting up:');
    	log.info('\t', plugin.name);
    	log.info('\t', plugin.description);

    	let cannotLoad = pluginHelper.cannotLoad(plugin);
    	
    	if(cannotLoad)
      		return next(cannotLoad);

    	if(plugin.path)
      		Constructor = require(pluginDir + plugin.path(config));
    	else
      		Constructor = require(pluginDir + plugin.slug);
      		
      	if(plugin.async) {
      		let instance = new Constructor(util.defer(function(err) {
        		next(err, instance);
      		}), plugin);
      
      	instance.meta = plugin;
    	} 
    	else 
    	{
      		let instance = new Constructor(plugin);
      		instance.meta = plugin;
      		lodash.defer(function() {
        		next(null, instance); 
      		});
    	}

    	if(!plugin.silent)
      		log.info('\n');
  	},

}

//export the two functions
module.exports = pluginHelper;