let lodash = require("lodash");
let util = require("./util");

let error, constructor;

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
  	
  	
  	load: function(plugin, next) {

    	plugin.config = config[plugin.slug];

    	if(!plugin.config || !plugin.config.enabled)
      		return next();

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
  	},

}