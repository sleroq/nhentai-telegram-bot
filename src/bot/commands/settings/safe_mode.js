const {awful_tags} = require('../../config.json');
async function toggle_safe_mode(user) {
    let tags = user.ignored_random_tags
    if (isSafeModeOn(user)){
        console.log("turning off safe mode")
        for(let i=0; i<awful_tags.length; i++){
            for( let t = 0; t < tags.length; t++){ 
                if ( tags[t] === awful_tags[i]) { 
                    tags.splice(t, 1); 
                }
            }
        }
    } else {
        console.log("turning on safe mode")
        awful_tags.forEach(tag => {
            if(!tags.includes(tag)){
                tags.push(tag)
            }
        });
    }
    await user.save();
}
function isSafeModeOn(user) {
    const tags = user.ignored_random_tags
    let result = 0;
    tags.forEach(element=>{
        if (awful_tags.includes(element)){
            result+=1
        }
    })

    if (result === awful_tags.length){
        return true
    } else{
        return false
    }
}

module.exports = {
    toggle_safe_mode,
    isSafeModeOn,
}