/*
 * Backend partida butifarra
 *
 */
function Partida(creador){
  //propietats globals
  this.creador=creador; // socket.id usuari
  this.objectiu=101;    // 51 | 101 | 151 punts
  this.jugadors=1;      // 0-4

  //equips: jugadors N+S vs jugadors E+O
  this.equips={
    "1":{
      punts:0,
      jugadorN:creador,
      jugadorS:null,
    },
    "2":{
      punts:0,
      jugadorE:null,
      jugadorO:null,
    },
  };
};

//compta jugadors N+S vs E+O
Partida.prototype.comptaJugadors=function(){
  var jug=0;
  if(this.equips[1].jugadorN)jug++;
  if(this.equips[1].jugadorS)jug++;
  if(this.equips[2].jugadorE)jug++;
  if(this.equips[2].jugadorO)jug++;
  this.jugadors=jug;
  return jug;
}

//assigna socket id a nou jugador
Partida.prototype.afegirJugador=function(sock_id){
  //si ja hi ha 4 persones
  if(this.comptaJugadors()>=4){
    console.log("Partida plena ("+this.creador+")")
    return false;
  }
  //si el jugador ja és dins
  else if([
    this.equips[1].jugadorN,
    this.equips[1].jugadorS,
    this.equips[2].jugadorE,
    this.equips[2].jugadorO,
    ].indexOf(sock_id)+1
  ){
    console.log("Jugador ja forma part de partida ("+this.creador+")")
    return false;
  }else{
    if     (this.equips[1].jugadorN==null) this.equips[1].jugadorN=sock_id;
    else if(this.equips[1].jugadorS==null) this.equips[1].jugadorS=sock_id;
    else if(this.equips[2].jugadorE==null) this.equips[2].jugadorE=sock_id;
    else if(this.equips[2].jugadorO==null) this.equips[2].jugadorO=sock_id;
    else {
      console.log("No s'ha pogut afegir jugador (error desconegut)");
      return false;
    }
    console.log("Jugador afegit a ("+this.creador+")");
    this.jugadors++;
    return true;
  }
}

//elimina jugador socket id (=null)
Partida.prototype.esborraJugador=function(sock_id){
  if     (!sock_id) return;
  else if(this.equips[1].jugadorN==sock_id) this.equips[1].jugadorN=null;
  else if(this.equips[1].jugadorS==sock_id) this.equips[1].jugadorS=null;
  else if(this.equips[2].jugadorE==sock_id) this.equips[2].jugadorE=null;
  else if(this.equips[2].jugadorO==sock_id) this.equips[2].jugadorO=null;
  this.comptaJugadors();
}

//check if sock_id forma part de la partida
Partida.prototype.isPart=function(sock_id){
  if([
    this.equips[1].jugadorN, 
    this.equips[1].jugadorS,
    this.equips[2].jugadorE,
    this.equips[2].jugadorO,
    ].indexOf(sock_id)+1
  ){
    return true;
  }else{
    return false;
  }
};

//check if partida is ready
Partida.prototype.isReady=function(){
  if(
    this.equips[1].jugadorN && this.equips[1].jugadorS &&
    this.equips[2].jugadorE && this.equips[2].jugadorO
  ){
    return true;
  }else{
    return false;
  }
};

//continue here
function Ronda(){
  //ronda
  this.triomf=undefined; // oros | copes | espases | bastos | butifarra

  //baralla 48 cartes
  var cartes=[
    {pal:"or", num:1, propietari:undefined, jugada:false},
    {pal:"co", num:1, propietari:undefined, jugada:false},
    {pal:"es", num:1, propietari:undefined, jugada:false},
    {pal:"ba", num:1, propietari:undefined, jugada:false},
  ];

  //barreja les cartes (algoritme yates)
  function shuf(arr){
    //TODO
  }
}

module.exports = Partida;
