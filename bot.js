const WebSocket = require('ws');
var PF = require('pathfinding');
const {world2Array, loadMap} = require('./map_data/map_manager.js');

const { urlToCode, handshake, handleINIT, getNearest, calcAngle, spreadUpdate, reload, exploits} = require("./Utils.js");
const {servers, commCodes, encode} = require('./network-interact.js');

var finder = new PF.AStarFinder();
Math.mod = (e,t)=>{var r=e%t;return r>=0?r:r+t};

class Bot{

    constructor(options, firebase=false){
        this.options = options;
        this.firebase = firebase;
        this.url = options.url;

        this.gameID = null;
        this.gameKEY = null;
        this.ws = null;
        this.isready = false;

        this.entity = {
            id: null,
            x:null,
            y:null,
            z:null,
            team: null,
            pitch: 0,
            yaw: 0,
            dx:0,
            dy:0,
            dz:0,
            state: 0,
            serverStateIdx:0,
        };

        this.weapon = {
            maxAmmo: options.maxAmmo,
            currentAmmo: Number(options.maxAmmo)+0,
            seed: null,
            shotSpread: 0,
            accuracy: options.accuracy,
            stability: options.stability,
            inaccuracy: 1 - options.accuracy,
            instability: 1 - options.stability,
        }

        this.pathFinder = {
            currentPath: null,
            lastUpdate: +new Date,
            canWalk: true,
        };

        this.connect();
        this.interval = setInterval(this.tick.bind(this), 1000/30);
        this.lastReload = +new Date;
        this.lastSpawned = +new Date;

        this.path = null;

        this.timeout = +new Date;

    }

    set setID(id){this.entity.id = id};
    set setX(x){this.entity.x = x};
    set setY(y){this.entity.y = y};
    set setZ(z){this.entity.z = z};
    set setDX(x){this.entity.dx = x};
    set setDY(y){this.entity.dy = y};
    set setDZ(z){this.entity.dz = z};
    set setPitch(p){this.entity.pitch = p};
    set setYaw(y){this.entity.yaw = y};
    set setState(s){this.entity.state = s};
    set SetServerStateIdx(state){this.entity.serverStateIdx = state};
    set setAmmo(n){this.weapon.currentAmmo = n};
    set setSeed(n){this.weapon.seed = n};
    set setPath(s){this.pathFinder.currentPath = s};
    set setPathUpdate(s){this.pathFinder.lastUpdate = s};
    set setWalk(s){this.pathFinder.canWalk=s};

    get id(){return this.entity.id};
    get x(){return this.entity.x};
    get pitch(){return this.entity.pitch};
    get yaw(){return this.entity.yaw};
    get y(){return this.entity.y};
    get z(){return this.entity.z};
    get dx(){return this.entity.dx};
    get dy(){return this.entity.dy};
    get dz(){return this.entity.dz};
    get state(){return this.entity.state};
    get serverStateIdx(){return this.entity.serverStateIdx};
    get ammo(){return this.weapon.currentAmmo};
    get maxAmmo(){return this.weapon.maxAmmo};
    get seed(){return this.weapon.seed};
    get spread(){return this.weapon.shotSpread}
    //get path(){return this.pathFinder.currentPath}
    get pathUpdate(){return this.pathFinder}
    get canWalk(){return this.pathFinder.canWalk};


    ready(){
        this.isready = true;
        console.log('BOT IS READY');
    }

    tick(){
        if(!this.isready){return};
        if(!this.ws.readyState === 1){return};

        let now = +new Date;
        
        spreadUpdate(this);

        let entity = getNearest(this);

        if(!this.path && this.x && this.y && this.z && (+new Date) - this.timeout > 5000){
        
            //console.log({z:Math.floor(this.x), y:Math.floor(this.y), x:Math.floor(this.z)})
           this.path = this.options.map.getPath({z:Math.floor(this.x), y:Math.floor(this.y), x:Math.floor(this.z)}, {x:19,y:1,z:19});
        }
        

        if(this.path && this.path.length > 0){
            let target = this.path[0];
            let angle = calcAngle(this, 
                {type: 'point',
                target: {x: this.path[0][0]+0.5, y: this.path[0][1]+0.5, z:this.path[0][2]+0.5},
                });

            if(angle.p){this.setPitch = angle.p};
            if(angle.y){this.setYaw = angle.y};
            this.setWalk = true;

            this.path = this.options.map.removeAllBefore(this.path, [Math.floor(this.x), Math.floor(this.y), Math.floor(this.z)])
           // console.log(this.path.length);
        }else{
           // console.log('Completed Path')
        }
        //exploits.lagHack(this);

        if(entity.player && false){
            if(Math.floor(this.y) === Math.floor(entity.player.y) && this.options.useSmartAI){ //our y level is the same as theirs, lets use path finding :);

                this.setWalk = false;
                if(this.path && this.path.length > 0){ //we are already following a path

                    //console.log(this.path);
                    let angle = calcAngle(this, 
                            {type: 'point',
                            target: {x: this.path[0][0], y: this.path[0][1], z:this.path[0][2]},
                            });

                    if(angle.p){this.setPitch = angle.p};
                    if(angle.y){this.setYaw = angle.y};
                    //console.log(angle.p, angle.y);

                }else{ //lets create a path
                    let meth = loadMap(0);
                    let result = finder.findPath(meth.data[0], meth.data[5], meth.data);
                    this.setPath = result;
                    this.setPathUpdate = +new Date;
                }
            }else{    //destroy the path
                this.setPath = null;
                this.setWalk = true;
                let angle = calcAngle(this, 
                    {type: 'player',
                    target: entity.player,
                    distance: entity.distance,
                    });
                //if(angle.p){this.setPitch = angle.p};
                //if(angle.y){this.setYaw = angle.y};
            } 
            

            if((entity.distance > 10 && now-this.lastReload > 1000 * 10)){
                exploits.teleport(this)
                this.lastReload = now;
            }else if(now-this.lastSpawned > 1000 * 15){
                exploits.teleport(this)
                this.lastSpawned =now;
            }
        }

        let Xe = Math.ceil(3);
        let ct = 256;

        this.setState = Math.round(Math.mod(this.state + 1, ct));
        if((this.path && this.path.length > 0)){
            var updatePACKET = encode.getBuffer();
            updatePACKET.packInt8(commCodes.syncMe),
            updatePACKET.packInt8(Math.mod(this.state - Xe, ct)),
            updatePACKET.packInt8(this.serverStateIdx);
            for (var t = Math.mod(this.state - Xe, ct), r = 0; r < Xe; r++) {
                var i = Math.mod(t + r, ct);
                updatePACKET.packInt8(((this.canWalk) ? 17 : 0));
                
                updatePACKET.packInt8(((
                    this.options.canShoot 
                    && this.ammo > 0
                    && entity.distance < this.options.minShootDistance && false) ? (this.state%5==0 ? 1 : 0) : 0)) 				
                updatePACKET.packRadU(this.yaw)
                updatePACKET.packRad(this.pitch)
            }
            updatePACKET.send(this.ws)
        }
    }

    connect(){

        let server;
        let gameData;
        if(this.url.match(`#`)){
			gameData = urlToCode(this.url);
            server = `wss://${servers[gameData.serverID].subdom}shellshock.io`
        }

        this.ws = new WebSocket(server,  {
            followRedirects: true,
            perMessageDeflate: false,
            protocolVersion: 13,
            origin: 'https://shellshock.io',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        this.ws.on('open', (e)=>{
            console.log('Connection Established to ', server);
            handshake(gameData, this);
        })

        this.ws.on('message', (e)=>{
            handleINIT(e, this);
        })

        this.ws.on('close', (e)=>{
            console.log('Conenction Terminated');
            clearInterval(this.interval);
        })
    }

}

module.exports = {
    BOT: Bot,
}