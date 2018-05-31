let lodash = require('lodash');

let util = require('./util');

let dirs = util.dirs();
let log = require(dirs.core + 'log');

let EventLogger = function() {
	lodash.bindAll(this);
}

let subscriptions = require(dirs.core + 'subscriptions');

lodash.each(subscriptions, function(subscription) {
	EventLogger.prototype[subscription.handler] = function(e) {
    	if(subscription.event === 'tick')
      		log.empty();

    	if(lodash.has(e, 'data'))
      		log.debug('\tnew event:',subscription.event,'(' + lodash.size(e.data),'items)');
    	else
      		log.debug('\tnew event:',subscription.event);
  	}
});


module.exports = EventLogger;