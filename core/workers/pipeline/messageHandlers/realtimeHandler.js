module.exports = cb=>{
    return{
        message:msg=>{
            if(msg.type === 'error'){
                cb(msg.error);
                console.error(msg.error);
            }
            else
                cb(null, msg);
        },
        exit: status=>{
            return status !==0 ? cb('Child process has died.') : cb(null, {done: true});
        }
    }
}