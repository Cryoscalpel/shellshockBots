const {encode, decode, commCodes, servers} = require('./network-interact.js');
const {BOT} = require('./bot.js');
const {pathfind} = require('./map_data/pathFinder.js');
const WebSocket = require('ws');

let c = new pathfind(8);

const options = {
    url: 'https://shellshock.io/#6k5sr5',
    count: 5,
    name: 'Jeraf',
    classID: 4,
    weaponID: 0, 
    canShoot: true,
    minShootDistance:2,
    maxAmmo: 50,
    accuracy: .95,
    stability: .33,
    firebaseId: null,
    firebaseSession:null,
    color: 12,
    map: c,
    useSmartAI:false,
};

Object.defineProperty(options, 'name', {get: ()=>{return 'PathFinder' + Math.floor(Math.random()*10)}})
for(var i = 0; i < 1; i ++){
    let bot = new BOT(options);
}


return;

for(var i = 0 ;i < 15; i++){
    setTimeout(function(){


        const packet = {"cmd":"auth","firebaseToken":`eyJhbGciOiJSUzI1NiIsImtpZCI6IjIxODQ1OWJiYTE2NGJiN2I5MWMzMjhmODkxZjBiNTY1M2UzYjM4YmYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vc2hlbGxzaG9ja2lvLTE4MTcxOSIsImF1ZCI6InNoZWxsc2hvY2tpby0xODE3MTkiLCJhdXRoX3RpbWUiOjE1OTQ1NjA3MjAsInVzZXJfaWQiOiJhUG1VdzQ1ZVAzWXl6MVNwcVUxaHdhMFJOdXgyIiwic3ViIjoiYVBtVXc0NWVQM1l5ejFTcHFVMWh3YTBSTnV4MiIsImlhdCI6MTU5NDU2NTUxNiwiZXhwIjoxNTk0NTY5MTE2LCJlbWFpbCI6ImhvdGNoaWxseXNhdWNlMTRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDczMDkxOTAwMzg1Mjk0ODU5MjUiXSwiZW1haWwiOlsiaG90Y2hpbGx5c2F1Y2UxNEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.wLOwMQBaUpy47-eRZ8Zo3nKU294zrnadzJU2cq7azDlS7MAh5CpiC90VzifTQFf4Xhd8jlJQbHYPgvRSouJG40k_LPYa5a8LSmksKwoffKaqtgfpf1ojadHDu3k67il_hW9gl_KXtrjhp3HLZKvlS8o7ChiJBWmffi3A6pCgByhrUM_27T09ljBsKrKsts0o6_16W3Tc6TwnB6YAzMgrPAqL3sVt3nNvBhknEx4LcTD8ixD1WhXi5Yu_sSkanNCBOKzqSsUwWX_QbNSDXGII5UJl9mcD9AQQZ783JjGg54o5LjnFpiEHeGEl-J_eedEUAu4_kNM3tslTlllfpQuuZQ`};

        let session = new WebSocket('wss://shellshock.io/services/', {
        followRedirects: true,
        perMessageDeflate: false,
        protocolVersion: 13,
        origin: 'https://shellshock.io',
        headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        session.on('open', ()=>{
            session.send(JSON.stringify(packet  ))
        })

        session.on('message', (data)=>{
            let json = JSON.parse(data);
            console.log(json);
            new BOT(options, {firebaseId:json.firebaseId, firebaseSession:json.session});
        })  
    },i*2000)
}

