let nt = function(e, t) {
    this.size = 0,
    this.originalSize = t,
    this.constructorFn = e,
    this.objects = [],
    this.idx = 0,
    this.numActive = 0,
    this.expand(t)
}

nt.prototype.expand = function(e) {
    for (var t = 0; t < e; t++) {
        var r = this.constructorFn();
        r.id = t + this.size,
        r.active = !1,
        this.objects.push(r)
    }
    this.size += e
}
,
nt.prototype.retrieve = function(e) {
    if (null != e) {
        for (; e >= this.size; )
            this.expand(this.originalSize);
        return this.numActive++,
        this.objects[e].active = !0,
        this.objects[e]
    }
    var t = this.idx;
    do {
        t = (t + 1) % this.size;
        var r = this.objects[t];
        if (!r.active)
            return this.idx = t,
            this.numActive++,
            r.active = !0,
            r
    } while (t != this.idx);return this.expand(this.originalSize),
    console.log("Expanding pool for: " + this.objects[0].constructor.name + " to: " + this.size),
    this.retrieve()
}
,
nt.prototype.recycle = function(e) {
    e.active = !1,
    this.numActive--
}
,
nt.prototype.forEachActive = function(e) {
    for (var t = 0; t < this.size; t++) {
        var r = this.objects[t];
        !0 === r.active && e(r, t)
    }
}

var St = {
    buffer: null,
    bufferPool: new nt((function() {
        return new Mt(2048)
    }
    ),2),
    getBuffer: function() {
        var e = this.bufferPool.retrieve();
        return e.idx = 0,
        e
    }
};
function Mt(e) {
    this.idx = 0,
    this.arrayBuffer = new ArrayBuffer(e),
    this.buffer = new Uint8Array(this.arrayBuffer,0,e)
}
Mt.prototype.send = function(e) {
    var t = new Uint8Array(this.arrayBuffer,0,this.idx);
    e.send(t),
    St.bufferPool.recycle(this)
}
,
Mt.prototype.packInt8 = function(e) {
    this.buffer[this.idx] = 255 & e,
    this.idx++
}
,
Mt.prototype.packInt16 = function(e) {
    this.buffer[this.idx] = 255 & e,
    this.buffer[this.idx + 1] = e >> 8 & 255,
    this.idx += 2
}
,
Mt.prototype.packInt32 = function(e) {
    this.buffer[this.idx] = 255 & e,
    this.buffer[this.idx + 1] = e >> 8 & 255,
    this.buffer[this.idx + 2] = e >> 16 & 255,
    this.buffer[this.idx + 3] = e >> 24 & 255,
    this.idx += 4
}
,
Mt.prototype.packRadU = function(e) {
    this.packInt16(1e4 * e)
}
,
Mt.prototype.packRad = function(e) {
    this.packInt16(1e4 * (e + Math.PI))
}
,
Mt.prototype.packFloat = function(e) {
    this.packInt16(300 * e)
}
,
Mt.prototype.packDouble = function(e) {
    this.packInt32(1e6 * e)
}
,
Mt.prototype.packString = function(e) {
    this.packInt8(e.length);
    for (var t = 0; t < e.length; t++)
        this.packInt16(e.charCodeAt(t))
}
,
Mt.prototype.packLongString = function(e) {
    this.packInt16(e.length);
    for (var t = 0; t < e.length; t++)
        this.packInt16(e.charCodeAt(t))
}
;
var Ct = {
    buffer: null,
    idx: 0,
    init: function(e) {
        this.buffer = new Uint8Array(e),
        this.idx = 0
    },
    isMoreDataAvailable: function() {
        return Math.max(0, this.buffer.length - this.idx)
    },
    unPackInt8U: function() {
        var e = this.idx;
        return this.idx++,
        this.buffer[e]
    },
    unPackInt8: function() {
        return (this.unPackInt8U() + 128) % 256 - 128
    },
    unPackInt16U: function() {
        var e = this.idx;
        return this.idx += 2,
        this.buffer[e] + (this.buffer[e + 1] << 8)
    },
    unPackInt32U: function() {
        var e = this.idx;
        return this.idx += 4,
        this.buffer[e] + 256 * this.buffer[e + 1] + 65536 * this.buffer[e + 2] + 16777216 * this.buffer[e + 3]
    },
    unPackInt16: function() {
        return (this.unPackInt16U() + 32768) % 65536 - 32768
    },
    unPackInt32: function() {
        return (this.unPackInt32U() + 2147483648) % 4294967296 - 2147483648
    },
    unPackRadU: function() {
        return this.unPackInt16U() / 1e4
    },
    unPackRad: function() {
        return this.unPackRadU() - Math.PI
    },
    unPackFloat: function() {
        return this.unPackInt16() / 300
    },
    unPackDouble: function() {
        return this.unPackInt32() / 1e6
    },
    unPackString: function(e) {
        e = e || 255;
        var t = Math.min(this.unPackInt8U(), e);
        return this.unPackStringHelper(t)
    },
    unPackLongString: function(e) {
        e = e || 16383;
        var t = Math.min(this.unPackInt16U(), e);
        return this.unPackStringHelper(t)
    },
    unPackStringHelper: function(e) {
        if (!(this.isMoreDataAvailable() < e)) {
            for (var t = new String, r = 0; r < e; r++) {
                var i = this.unPackInt16U();
                i > 0 && (t += String.fromCharCode(i))
            }
            return t
        }
    }
}


const commCodes = {
    gameJoined: 0,
    addPlayer: 1,
    removePlayer: 2,
    chat: 3,
    controlKeys: 4,
    keyUp: 5,
    syncThem: 6,
    jump: 7,
    die: 8,
    hitThem: 9,
    hitMe: 10,
    collectItem: 11,
    spawnItem: 12,
    respawn: 13,
    swapWeapon: 14,
    joinGame: 15,
    ping: 16,
    pong: 17,
    clientReady: 18,
    requestRespawn: 19,
    joinPublicGame: 21,
    joinPrivateGame: 22,
    createPrivateGame: 23,
    switchTeam: 25,
    notification: 26,
    changeCharacter: 27,
    playerCount: 28,
    pause: 30,
    announcement: 31,
    updateBalance: 32,
    reload: 33,
    refreshGameState: 34,
    switchTeamFail: 35,
    expireUpgrade: 36,
    bootPlayer: 37,
    loginRequired: 38,
    banned: 39,
    gameLocked: 40,
    bootPlayer: 42,
    banned: 43,
    spatula: 44,
    syncMe: 45,
    explode: 46,
    keepAlive: 47,
    musicInfo: 48,
    startReload: 51,
    fire: 49,
    throwGrenade: 50,
    info: 255,
    videoReward: 58,
    eventModifier: 63
}

const servers = [
    {
      "name": "US East",
      "subdom": "useast2.",
      "locKey": "server_useast",
      "id": "us-e1"
    },
    {
      "name": "US West",
      "subdom": "uswest2.",
      "locKey": "server_uswest",
      "id": "us-w1"
    },
    {
      "name": "US Central",
      "subdom": "uscentral2.",
      "locKey": "server_uscentral",
      "id": "us-c1"
    },
    {
      "name": "Brazil",
      "subdom": "brazil2.",
      "locKey": "server_brazil",
      "id": "br-1"
    },
    {
      "name": "Germany",
      "subdom": "frankfurt2.",
      "locKey": "server_germany",
      "id": "de-1"
    },
    {
      "name": "Singapore",
      "subdom": "singapore2.", 
      "locKey": "server_singapore",
      "id": "si-1"
    },
    {
      "name": "Sydney",
      "subdom": "sydney.",
      "locKey": "server_sydney",
      "id": "au-1"
    }
]

module.exports = {
    decode: Ct,
    encode: St,
    commCodes: commCodes,
    servers: servers,
}