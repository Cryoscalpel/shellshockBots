var PF = require('pathfinding');
const {map} = require('./map.js');

console.log(PF)

const CPathFind = function(){
    const C = function(MAP){

        this.TILETYPE = {'EMPTY': 2, 'PASSABLE': 0, 'BLOCKED': 1}

        this.wH;
        this.wD;
        this.wX;

        this.map = null;
        this.nodes = [];

        this.finder = new PF.AStarFinder({
        });

        this.init(MAP);
    };

    C.prototype.init = function(id){
        this.map = map[id];
        //console.log(this.map.extents);
        this.wH = this.map.height;
        this.wW = this.map.width;
        this.wD = this.map.depth;

        this.buildNodes(this.parseMap(this.map));
    }

    C.prototype.THREE2ONE = function(x,y,z){
        return x * this.wH * this.wD + y * this.wD + z;
    };

    C.prototype.ONE2THREE = function(x,y,z){
        let z = Math.floor(i % wD);
        let y = Math.floor((i / wD) % wH);
        let x = Math.floor((i / wD / wH) % wW);
        return { x:x, y:y, z:z };
    };

    C.prototype.resetMap = function(map){
        for(var i = 0; i < map.length; i ++){
            delete map[i].g;
            delete map[i].f;
            delete map[i].opened;
            delete map[i].closed;
        }
        return map;
    };

    C.prototype.parseMap = function(map){
        let mapTiles = new Array(this.wW * this.wH * this.wD);
        for(var x = 0; x < this.wW; x++){
            for(var y = 0; y < this.wH; y++){
              for(var z = 0; z < this.wD; z++){
                  mapTiles[this.THREE2ONE(x,y,z)] = this.TILETYPE.EMPTY;
              }
            }
        } 
        for(var object in map.data){
            let isPassable = (object.match('stairs') || object.match('ladder'));
             let data_type = map.data[object];

             for(var tile in data_type){
                 let tile_data = data_type[tile];
                 if(isPassable){
                     mapTiles[this.THREE2ONE(tile_data.x, tile_data.y, tile_data.z)] = this.TILETYPE.PASSABLE;
                     mapTiles[this.THREE2ONE(tile_data.x, tile_data.y+1, tile_data.z)] = this.TILETYPE.PASSABLE;
                 }else{
                     if(mapTiles[this.THREE2ONE(tile_data.x, tile_data.y, tile_data.z)] === this.TILETYPE.EMPTY){
                        mapTiles[this.THREE2ONE(tile_data.x, tile_data.y, tile_data.z)] = this.TILETYPE.BLOCKED;
                     }
                 }
             }
        }

        for(var x = 0; x < this.wW; x++){
            for(var y = 0; y < this.wH; y++){
              for(var z = 0; z < this.wD; z++){
                  if(mapTiles[this.THREE2ONE(x,y,z)] == this.TILETYPE.BLOCKED){
                      if(mapTiles[this.THREE2ONE(x,y+1,z)] === this.TILETYPE.EMPTY){
                        mapTiles[this.THREE2ONE(x,y+1,z)] = this.TILETYPE.PASSABLE;
                      }
                  }
              }
            }
        }
        return mapTiles;
    }

    C.prototype.buildNodes = function(mapTiles){
        for(var x = 0; x < this.wW; x++){
            for(var y = 0; y < this.wH; y++){
              for(var z = 0; z < this.wD; z++){
                    if(mapTiles[this.THREE2ONE(x,y,z)] === 0){
                       let node = new PF.Node(x,y,z);
                        node.canGo = true;
                        this.nodes.push(node);

                        let index = this.nodes.length-1;
                        if(x>0){
                            let xIndex = this.THREE2ONE(x-1, y, z);
                            if(this.nodes[xIndex].canGo){
                                this.nodes[index].neighbors.push(this.nodes[xIndex]);
                                this.nodes[xIndex].neighbors.push(this.nodes[index]);
                            }
                        }
                        if(y>0){
                            let yIndex = this.THREE2ONE(x, y-1, z);
                            if(this.nodes[yIndex].canGo){
                                this.nodes[index].neighbors.push(this.nodes[yIndex]);
                                this.nodes[yIndex].neighbors.push(this.nodes[index]);
                            }
                        }
                        if(z>0){
                            let zIndex = this.THREE2ONE(x, y, z-1)
                            if(this.nodes[zIndex].canGo){
                                this.nodes[index].neighbors.push(this.nodes[zIndex]);
                                this.nodes[zIndex].neighbors.push(this.nodes[index]);
                            }
                        }
                    }else{
                        let node = new PF.Node(x,y,z);
                        node.canGo = false;
                        this.nodes.push(node)
                }
              }
            }
        }
        return this.nodes;
    }

    C.prototype.getPath = function(start,end){
        let path = this.finder.findPath(this.nodes[this.THREE2ONE(start.z,start.y,start.x)], this.nodes[this.THREE2ONE(end.z,end.y,end.x)], this.nodes ); 
        this.resetMap(this.nodes);
        return path ;
    }

    C.prototype.removeAllBefore = function(arr, item){
        for(var i = 0; i < arr.length; i++){
            if(item[0] === arr[i][0] && item[1] === arr[i][1] && item[2] === arr[i][2]){
                return arr.splice(i+1);
            }
        }
        return arr;
    }
    return C;
}();
module.exports = {
    pathfind: CPathFind,
}

/*
const THREE2ONE = (x,y,z, height, width, depth)=>{
    return x * wH * wD + y * wD + z
    return z + y * wD + x * wD * wH
}

//return (z * xMax * yMax) + (y * xMax) + x;

const ONE2THREE = (i)=>{
        let z = Math.floor(i % wD)
        let y = Math.floor((i / wD) % wH)
        let x = Math.floor((i / wD / wH) % wW);

        return { x:x, y:y, z:z };
}

const resetMap=(map)=>{
    for(var i = 0; i < map.length; i ++){
        delete map[i].g;
        delete map[i].f;
        delete map[i].opened;
        delete map[i].closed;
    }
    return;
}


function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }
  

const parseMap=(map)=>{
    var nodes = [
    ];

    let mapTiles = new Array(wW * wH * wD);

    for(var x = 0; x < wW; x++){
        for(var y = 0; y < wH; y++){
          for(var z = 0; z < wD; z++){
              mapTiles[THREE2ONE(x,y,z)] = 2;
          }
        }
    }

   for(var object in map.data){
       console.log(object);
       let isOk = false
       if(object.match('stairs') || object.match('ladder')){
           isOk = true;
       }
        let data_type = map.data[object];
        for(var tile in data_type){
            let tile_data = data_type[tile];
            if(isOk){
                mapTiles[THREE2ONE(tile_data.x, tile_data.y, tile_data.z)] = 0;
                mapTiles[THREE2ONE(tile_data.x, tile_data.y+1, tile_data.z)] = 0;
            }else{
                if(mapTiles[THREE2ONE(tile_data.x, tile_data.y, tile_data.z)] === 2){
                mapTiles[THREE2ONE(tile_data.x, tile_data.y, tile_data.z)] = 1;
                }
            }
            //mapTiles[THREE2ONE(tile_data.x, tile_data.y+1, tile_data.z)] = 0;
        }
    }

    for(var x = 0; x < wW; x++){
        for(var y = 0; y < wH; y++){
          for(var z = 0; z < wD; z++){
              if(mapTiles[THREE2ONE(x,y,z)] == 1){
                  if(x < 4 && z < 4){
                      console.log(mapTiles[THREE2ONE(x,y+1,z)], x, z)
                  }
                  if(mapTiles[THREE2ONE(x,y+1,z)] === 2){
                mapTiles[THREE2ONE(x,y+1,z)] = 0;
                  }
              }
          }
        }
    }
    console.log(wW, wH, wD)
    let POS = {x:19,y:5, z:3};
    console.log('testing', POS)
    let id = THREE2ONE(POS.x, POS.y, POS.z);
  //  console.log(ONE2THREE(mapTiles.length-1));
    console.log(JSON.stringify(mapTiles));

    

    for(var x = 0; x < wW; x++){
        for(var y = 0; y < wH; y++){
          for(var z = 0; z < wD; z++){
              //console.log(mapTiles[THREE2ONE(x,y,z)]);
                if(mapTiles[THREE2ONE(x,y,z)] === 0){
                   // mapTiles[THREE2ONE(x, y+1, z)] = 0;
                   let node = new PF.Node(x,y,z);
                    node.canGo = true;
                    nodes.push(node);
                    let index = nodes.length-1;
                    if(x>0){
                        let xIndex = THREE2ONE(x-1, y, z);
                        if(nodes[xIndex].canGo){
                            nodes[index].neighbors.push(nodes[xIndex]);
                            nodes[xIndex].neighbors.push(nodes[index]);
                        }
                    }
                    if(y>0){
                        let yIndex = THREE2ONE(x, y-1, z);
                        if(nodes[yIndex].canGo){
                            nodes[index].neighbors.push(nodes[yIndex]);
                            nodes[yIndex].neighbors.push(nodes[index]);
                        }
                    }
                    if(z>0){
                        let zIndex = THREE2ONE(x, y, z-1)
                        if(nodes[zIndex].canGo){
                            nodes[index].neighbors.push(nodes[zIndex]);
                            nodes[zIndex].neighbors.push(nodes[index]);
                        }
                    }
                }else{
                    let node = new PF.Node(x,y,z);
                    node.canGo = false;
                    nodes.push(node)
            }
          }
        }
      }


      console.log('Filled in map placeholders');
      let derp = [];
      for(var i = 0; i < nodes.length; i++){
          
          if(typeof(nodes[i]) === 'boolean'){
              console.log('removing')
              console.log(typeof(nodes[i]));
              nodes[i] = undefined
              //nodes.splice(i, 1);
              //nodes.delete[i]
              console.log(nodes[i]);
          }else{
            derp.push(nodes[i]);
          }
      }
      //console.log(nodes);
      var finder = new PF.AStarFinder({
 
        //heuristic: function(dx, dy, dz) {
        //    return Math.min(dx, dy);
       // }
      });
      //console.log(nodes[0])

      
      _wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            console.log(lastPosition);
            let data = JSON.parse(message);
            var path = finder.findPath(nodes[THREE2ONE(lastPosition.x,lastPosition.y,lastPosition.z)], nodes[THREE2ONE(data.x,data.y,data.z)], nodes );
            //if(path.length > 0){
           // lastPosition.x = data.x;
           // lastPosition.y = data.y;
           // lastPosition.z = data.z;
           // }
            //lastPosition = {x:data.x,y:data.y,z:data.z}
            resetMap(nodes);
            this.send(JSON.stringify(path));
        });
       })

}

const loadMap=(id)=>{
   let map_ = map[id];
   wH = map_.height;
   wW = map_.width;
    wD = map_.depth;


  // wH = 3;
   //wW = 3;
   //wD = 3;
   
   console.log('Making a map of dimensions', wH, wW, wD);
   console.log('Loading map data...');

   let mapData = parseMap(map_);
   return {data: mapData, height: wH, width: wW, depth: wD};

}

loadMap(mapIDX);*/