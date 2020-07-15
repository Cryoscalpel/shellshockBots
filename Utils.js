const {encode, decode, commCodes} = require('./network-interact.js');
const { pbkdf2 } = require('crypto');
const BABYLON = require('babylonjs');

Math.mod = (e,t)=>{var r=e%t;return r>=0?r:r+t};
Math.radRange=(e)=>{return Math.mod(e,Math.PI*2)};
Math.clamp=(e,t,r)=>{return Math.max(Math.min(e,r),t)};






let activeGames = new Map();
let entities = new Map();
const urlToCode=(url)=>{
    url = url.replace(`https://shellshock.io/`, '').replace('#', "");
    serverIdx = Number.parseInt(url.substr(0, 1), 36),
    u = Number.parseInt(url.substr(1, 3), 36),
    d = Number.parseInt(url.substr(4, 2), 36);
    return {serverID:serverIdx, id: u, key:d };
}

const handshake=(options, caller)=>{
    var PACKET = encode.getBuffer();
    PACKET.packInt8(commCodes.joinGame)
    PACKET.packInt8(0)
	if(options.id && options.key){
	    PACKET.packInt8(commCodes.joinPrivateGame);
	}else{
		PACKET.packInt8(commCodes.joinPublicGame);
	}
    PACKET.packInt8(0)
    PACKET.packInt8(null)
    PACKET.packInt16(options.id )
    PACKET.packInt16(options.key)
    PACKET.packInt8(caller.options.classID || 4)
    PACKET.packInt8(0)
    PACKET.packInt8(0)
    PACKET.packInt8(caller.options.color || 0)
    PACKET.packInt8(0)
    PACKET.packInt8(0)
    PACKET.packString((caller.options.useRandomName ? randomName() : caller.options.name || 'BOT'))

    if(caller.firebase){
    PACKET.packInt32(caller.firebase.firebaseSession);
    PACKET.packString(caller.firebase.firebaseId);
    }

    PACKET.send(caller.ws)
    console.log('Engaged handhsake');
};

const clientReady=(caller)=>{
    var READY_PACKET = encode.getBuffer();
    READY_PACKET.packInt8(commCodes.clientReady);
    READY_PACKET.send(caller.ws);
}

const respawn=(caller, timeout)=>{
    
 
    if(caller.options.lagMode){return};
    setTimeout(function(){
        var READY_PACKET = encode.getBuffer();
        READY_PACKET.packInt8(commCodes.requestRespawn);
        READY_PACKET.send(caller.ws);
        //console.log('Requested Respawn');
    },timeout)
}

const reload=(caller, timeout)=>{
    setTimeout(function(){
        var RELOAD_PACKET = encode.getBuffer();
        RELOAD_PACKET.packInt8(commCodes.reload);
        RELOAD_PACKET.send(caller.ws);
        setTimeout(function(){
            caller.setAmmo = caller.maxAmmo;
        },2500)
    },timeout)
}

const getFloat=(caller, doUpdate=false)=>{
    if(!caller.seed){return false};
    if(doUpdate){
        let e = null; let t = null;
        return e = e || 0,
        t = t || 1,
        caller.setSeed = (9301 * caller.seed + 49297) % 233280,
        e + caller.seed / 233280 * (t - e);
    }else{
        let e = null; let t = null;
        return e = e || 0,
        t = t || 1,
        temp = (9301 * caller.seed + 49297) % 233280,
        e + temp / 233280 * (t - e);
    };
};

const adjustedTarget=(delta, caller)=>{
    delta = new BABYLON.Vector3(delta.x, delta.y, delta.z).normalize();
    const desiredMat = BABYLON.Matrix.Translation(delta.x, delta.y, delta.z);

    let spread = caller.spread + caller.weapon.inaccuracy;

    if(spread < 0.1){return delta};
    if (isNaN(spread)) {
        spread = 0;
    }

    const spreadInverseMat = BABYLON.Matrix.RotationYawPitchRoll(
        (getFloat(caller,false) - 0.5) * spread,
        (getFloat(caller,false)- 0.5) * spread,
        (getFloat(caller,false) - 0.5) * spread).invert();

    const newAimVector = desiredMat.multiply(spreadInverseMat).getTranslation();
    return newAimVector;
};

const spreadUpdate=(caller)=>{
    let h = Math.max(0, Math.sqrt(caller.dx**2 + caller.dy**2 + caller.dz**2) - .012);
    caller.weapon.shotSpread += caller.weapon.instability * h * 2;
    caller.weapon.shotSpread = Math.max(caller.weapon.shotSpread * caller.weapon.instability - .01 * caller.weapon.stability, 0);
}

const calcDist=(p1,p2)=>{return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2 + (p1.z-p2.z)**2)};

const getTargetAngle=(angle)=>{
    if (angle < 0) angle += Math.PI * 2;
    if (angle < 0) angle += Math.PI * 2;
    if (angle < 0) angle += Math.PI * 2;
    if (angle - Math.PI * 2 > 0) angle -= Math.PI * 2;
    if (angle - Math.PI * 2 > 0) angle -= Math.PI * 2;
    if (angle - Math.PI * 2 > 0) angle -= Math.PI * 2;
    return angle;
}

const getTargetDelta=(caller, player2)=>{
    return {x: caller.x - (player2.x),
            y: caller.y - (player2.y),
            z: caller.z - (player2.z),
           };
}

const calcAngle=(caller, options)=>{

    if(options.type === 'player'){
        let target = options.target;
        let distance = options.distance;
        let delta_ = {
            x: target.x -caller.x + target.dx * (distance),
            y: target.y-caller.y - 0.072,
            z: target.z-caller.z + target.dz * (distance),};
        let newAimVector = adjustedTarget(delta_, caller);
        const dif_yaw = Math.radRange(-Math.atan2(newAimVector.z, newAimVector.x) + Math.PI / 2)
        const dif_pitch = Math.clamp(-Math.asin(newAimVector.y), -1.5, 1.5);
        return {p: dif_pitch || 0, y: dif_yaw || 0}
    }

    if(options.type === 'point'){
        let target = options.target;
        let delta_ = {
            x: target.x -caller.x,
            y: target.y-caller.y - 0.072,
            z: target.z-caller.z};
        let newAimVector = adjustedTarget(delta_, caller);
        const dif_yaw = Math.radRange(-Math.atan2(newAimVector.z, newAimVector.x) + Math.PI / 2)
        const dif_pitch = Math.clamp(-Math.asin(newAimVector.y), -1.5, 1.5);
        return {p: dif_pitch || 0, y: dif_yaw || 0}
    }

    throw('Unknown aimbot target')
};

const randInt=(min, max)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getNearest=(caller)=>{
    
    //exploits.lagHack(caller);
    if(!caller.x || !caller.y || !caller.z){return {}};
    let nearest = {player: null, distance: null}    
    entities.forEach((entity, id)=>{
        if(caller.id != id && !entity.name.match(/BOT/) && entity.playing && entity.hp > 0 && !activeGames.get(caller.gamecode).get(id)){
            let distance = calcDist({x:caller.x, y:caller.y, z:caller.z}, {x:entity.x, y:entity.y, z:entity.z});
            if(!nearest.distance || distance < nearest.distance){
                nearest.player = entity;
                nearest.distance = distance;
            }   
        }
    });
    return nearest;
}

const handleINIT =(data, caller)=>{
    for (decode.init(data); decode.isMoreDataAvailable(); ) {
        var Fn = decode.unPackInt8U();
        switch (Fn) {
                case commCodes.clientReady:
                    respawn(caller, 2000);
                    caller.ready();
                    break;
                case commCodes.gameJoined:
                    console.log("CommCode.gameJoined received");
                    let teamScore = [0, 0, 0],
                    y = decode.unPackInt8U(),
                    S = decode.unPackInt8U(),
                    l = decode.unPackInt8U(),
                    h = decode.unPackInt16U(),
                    u = decode.unPackInt16U(),
                    x = decode.unPackInt8U(),
                    playerLimit = decode.unPackInt8U(),
                    P = 1 == decode.unPackInt8U();
                    teamScore[1] = decode.unPackInt16U();
                    teamScore[2] = decode.unPackInt16U();

                    let gamecode = String(h)+String(u);
                    caller.gamecode = gamecode;
                    if(!activeGames.get(gamecode)){
                        activeGames.set(gamecode, new Map());
                        activeGames.get(gamecode).set(y, Date.now())
                    }else{
                        activeGames.get(gamecode).set(y, Date.now())
                    }

                    caller.setID = y;

                    clientReady(caller);
                    break;
                case commCodes.musicInfo:
                    decode.unPackLongString();
                    break;
                case commCodes.pause:
                    let pauseID = decode.unPackInt8U();

                    if(pauseID === caller.id){
                        respawn(caller, 2000);
                    }else{
                        let entity = entities.get(pauseID);
                        if(entity){
                            entity.hp = 100;
                            entity.playing = false;
                        }
                    }

                    break;
                case commCodes.eventModifier:
                    console.log("eventModifier");
                    var o = encode.getBuffer();
                    o.packInt8(commCodes.eventModifier),
                    o.send(caller.ws);
                    break;
                case commCodes.spatula:
                    decode.unPackFloat(),
                    decode.unPackFloat(),
                    decode.unPackFloat()
                    
                    decode.unPackInt8U()
                    decode.unPackInt8U();
                    
                    break;
                case commCodes.addPlayer:
                    let addId = decode.unPackInt8U();
                    let addUniqueId = decode.unPackInt16U();
                    let addName = decode.unPackString();
                    let addClass = decode.unPackInt8U();
                    let addTeam = decode.unPackInt8U();
                    let addPrimary = decode.unPackInt8U();
                    let addSecondary = decode.unPackInt8U();
                    let addShellColor = decode.unPackInt8U();
                    let addHatItem = decode.unPackInt8U();
                    let addstampItem = decode.unPackInt8U();
                    let addX = decode.unPackFloat();
                    let addY = decode.unPackFloat();
                    let addZ = decode.unPackFloat();
                    let addDX = decode.unPackFloat();
                    let addDY = decode.unPackFloat();
                    let addDZ = decode.unPackFloat();
                    let addYAW = decode.unPackRadU();
                    let addPITCH = decode.unPackRad();
                    let addScore = decode.unPackInt32U();
                    let addKills = decode.unPackInt16U();
                    let addDeaths = decode.unPackInt16U();
                    let addstreak = decode.unPackInt16U();
                    let addtotalKills = decode.unPackInt32U();
                    let addtotalDeaths = decode.unPackInt32U();
                    let addbestGameStreak = decode.unPackInt16U();
                    let addbestOverallStreak = decode.unPackInt16U();
                    let addshield = decode.unPackInt8U();
                    let addhp = decode.unPackInt8U();
                    let addplaying = decode.unPackInt8U();
                    let addweaponIdx = decode.unPackInt8U();
                    let addcontrolKeys = decode.unPackInt8U();
                    let upgradeProductId = decode.unPackInt8U();

                    entities.set(addId, {x:addX, y:addY, z:addZ, ts:Date.now(), team: addTeam, name: addName, playing: addplaying, hp: addhp, dx:0,dy:0,dz:0});
                    break;
                case commCodes.removePlayer:
                    let removeID = decode.unPackInt8U();
                    entities.delete(removeID);
                    break;
                case commCodes.spawnItem:
                    decode.unPackInt16U();
                    decode.unPackInt8U()
                    decode.unPackFloat()
                    decode.unPackFloat()
                    decode.unPackFloat();
                    break;
                case commCodes.collectItem:
                    decode.unPackInt8U(),
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt16U();
                    break;
                case commCodes.die:
                    let dieReceiver = decode.unPackInt8U();
                    let dieGiver = decode.unPackInt8U();

                    decode.unPackInt8U();
                    //console.log(dieReceiver);
                    if(dieReceiver === caller.id){
                        respawn(caller, 2000);
                    }else{
                        let entity = entities.get(dieReceiver);
                        if(entity){
                            entity.hp = 0;
                            entity.dx = 0;
                            entity.dy = 0;
                            entity.dz = 0;
                            entity.playing = false;
                        }
                    }
                    break;
                case commCodes.chat:
                    let chat_id = decode.unPackInt8U();
                    let chat_msg = decode.unPackString();
                    console.log(`[${entities.get(chat_id).name}]: ${chat_msg}`)
                    break;
                case commCodes.syncMe:
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    let meServerState = decode.unPackInt8U();
                    let meX = decode.unPackFloat();
                    let meY = decode.unPackFloat();
                    let meZ = decode.unPackFloat();
                    decode.unPackInt8U();

                    caller.setDX = meX-caller.x;
                    caller.setDY = meY-caller.y;
                    caller.setDZ = meZ-caller.z;

                    caller.setX = meX;
                    caller.setY = meY;
                    caller.setZ = meZ;
                    caller.SetServerStateIdx = meServerState;
                    break;
                case commCodes.syncThem:
                    let themID;
                    let themX;
                    let themY;
                    let themZ;
                    if (themID=decode.unPackInt8U(),
                    themX=decode.unPackFloat(),
                    themY=decode.unPackFloat(),
                    themZ=decode.unPackFloat(),
                    decode.unPackInt8U())
                    {
                        for (ie = 0; ie < 3; ie++)
                        decode.unPackInt8U(),
                        decode.unPackRadU(),
                        decode.unPackRad();
                        break
                    }
                    for (ie = 0; ie < 3; ie++)
                    decode.unPackInt8U(),
                    decode.unPackRadU(),
                    decode.unPackRad();


                    
                    let entity = entities.get(themID)
                    if(entity){

                        entity.dx = themX - entity.x;
                        entity.dy = themY - entity.y;
                        entity.dz = themZ - entity.z;
                    
                        entity.x = themX;
                        entity.y = themY;
                        entity.z = themZ;
                        
                       // entity.playing = true;
                    }else{
                        entities.set(themID, {x:themX, y:themY, z:themZ, ts:Date.now(), team: null, name: null, playing: true, hp: 100, dx:0,dy:0,dz:0});
                    }                    
                    break;
                case commCodes.fire:
                    let fireID = decode.unPackInt8U();

                    decode.unPackFloat();
                    decode.unPackFloat();
                    decode.unPackFloat();
                    decode.unPackFloat();
                    decode.unPackFloat();
                    decode.unPackFloat();

                    if(fireID === caller.id){
                        getFloat(caller, true);
                        caller.setAmmo = caller.ammo - 1;
                        if(caller.ammo <= 0){
                            reload(caller, 1000);
                        };
                    }

                    break;
                case commCodes.throwGrenade:
                    decode.unPackInt8U(),
                    decode.unPackFloat(),
                    decode.unPackFloat(),
                    decode.unPackFloat();
                    decode.unPackFloat()
                    decode.unPackFloat()
                    decode.unPackFloat();
                    break;
                case commCodes.explode:
                    decode.unPackInt8U();
                    decode.unPackFloat();
                    decode.unPackFloat(); 
                    decode.unPackFloat(); 
                    decode.unPackInt8U(); 
                    decode.unPackFloat();
                    break;
                case commCodes.reload:
                    let reloadID = decode.unPackInt8U();
                    if(reloadID === caller.id){
                        caller.setAmmo = caller.maxAmmo;
                        console.log('Bot successfully reloaded');
                    }
                    break;
                case commCodes.swapWeapon:
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    break;
                case commCodes.hitMe:
                    decode.unPackInt8U();
                    decode.unPackFloat();
                    decode.unPackFloat();
                    break;
                case commCodes.hitThem:
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    break;
                case commCodes.respawn:
                    let respawnID = decode.unPackInt8U();
                    let respawnSeed = decode.unPackInt16U();
                    let respawnX = decode.unPackFloat();
                    let respawnY = decode.unPackFloat();
                    let respawnZ = decode.unPackFloat();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();

                    if(respawnID === caller.id){
                        caller.setDX = 0;
                        caller.setDY = 0;
                        caller.setDZ = 0;

                        caller.setX = respawnX;
                        caller.setY = respawnY;
                        caller.setZ = respawnZ;

                        caller.setSeed = respawnSeed;

                        caller.ammo = caller.maxAmmo;

                        caller.lastSpawned = +new Date;

                        reload(caller, 2000)
                    }else{
                        let entity = entities.get(respawnID);
                        if(entity){
                            entity.hp = 100;
                            entity.playing = true;
                        }
                    }

                    break;
                case commCodes.changeCharacter:
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    break;
                case commCodes.switchTeam:
                    decode.unPackInt8U();
                    decode.unPackInt8U();
                    break;
                case commCodes.switchTeamFail:
                   break;
                case commCodes.ping:
                    break;
                case commCodes.notification:
                    decode.unPackString();
                    decode.unPackInt8U();
                    break;
                case commCodes.gameLocked:
                    break;
                case commCodes.updateBalance:
                    decode.unPackInt32U();
                    break;
                case commCodes.expireUpgrade:
                    break;
                default:
                    console.log(Fn);
                    break;
            }
    }
}

const exploits = {
    teleport: function(caller){
    
        var teleportExploit = encode.getBuffer();
        teleportExploit.packInt8(commCodes.pause);
        teleportExploit.send(caller.ws);
        respawn(caller, 1000);
    },

    lagHack: function(caller){
        
        let s = encode.getBuffer();
        s.packInt8(commCodes.changeCharacter);
        s.packInt8(randInt(0,5));
        s.packInt8(0);
        s.packInt8(0);
        s.packInt8(0);
        s.packInt8(0);
        s.packInt8(0);
        s.send(caller.ws);
    }
}

module.exports = {
    urlToCode: urlToCode,
    handshake: handshake,
    handleINIT: handleINIT,
    activeGames: activeGames,
    clientReady: clientReady,
    getNearest: getNearest,
    calcAngle: calcAngle,
    spreadUpdate:spreadUpdate,
    reload: reload,
    exploits: exploits,
}