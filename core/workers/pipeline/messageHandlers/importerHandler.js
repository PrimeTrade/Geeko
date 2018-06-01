module.exports = cb=>{
    return{
        message: msg=>{
            switch(msg.type){
                case 'update': cb(null, {
                    done: false,
                    latest: msg.latest
                });
                    break;
                case 'error': {
                    cb(msg.error);
                    console.error(msg.error);
                }
                case 'log': console.log(msg.log);
            }
        },
        exit: status=>{
           return status !==0 ? cb('Child process has died.') : cb(null, {done: true});
        }
    }
}