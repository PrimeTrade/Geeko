let lodash = require("lodash");
let util = require("/util");

let pluginHelper = { 

// some plugin helper functions

//helper function to check for module that can't be load

	if(lodash.has(plugin, 'dependencies'))
      	let error = false;

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
        }
      });

    return error;
  },
  
