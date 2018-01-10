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

  //variables de ronda
  this.canta=null;    //socket id del jugador que canta
  this.triomf=null;   //oros, copes, espases, bastos, butifarra, delegar
  this.actiu=null;    //socket id del jugador que ha de tirar
  this.basa=[];       //array de cartes tirades a la basa actual [{pal,num,jugador_id}] 
  this.bases=[];      //array de bases jugades 
  this.hanRecollit=0; //nº de jugadors que han recollit la basa
};

module.exports = Partida;

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

//retorna un jugador a l'atzar
Partida.prototype.quiCanta=function(){
  //si ja ha cantat algú abans, canta el següent
  if(this.canta){
    this.canta=this.getNextJugador(this.canta);
    return this.canta;
  }
  //si canta val null canta random
  var jug=[
    this.equips[1].jugadorN, 
    this.equips[1].jugadorS,
    this.equips[2].jugadorE, 
    this.equips[2].jugadorO,
  ];
  if(jug[0]&&jug[1]&&jug[2]&&jug[3]){
    this.canta=jug[Math.floor(Math.random()*4)]; //num aleatori de 0 a 3
    return this.canta;
  }else{
    return false;
  }
};

//assignar propietari cartes
Partida.prototype.repartir=function(){
  //check tothom connectat
  if(!this.checkJugadors())return;

  //algoritme yates barrejar array
  function barreja(arr){
    for(var i=arr.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var temp=arr[i];
      arr[i]=arr[j];
      arr[j]=temp;
    }
    return arr;
  }

  //baralla 48 cartes barrejada
  var cartes=barreja([
    {pal:"or", num: 1, propietari:undefined},
    {pal:"or", num: 2, propietari:undefined},
    {pal:"or", num: 3, propietari:undefined},
    {pal:"or", num: 4, propietari:undefined},
    {pal:"or", num: 5, propietari:undefined},
    {pal:"or", num: 6, propietari:undefined},
    {pal:"or", num: 7, propietari:undefined},
    {pal:"or", num: 8, propietari:undefined},
    {pal:"or", num: 9, propietari:undefined},
    {pal:"or", num:10, propietari:undefined},
    {pal:"or", num:11, propietari:undefined},
    {pal:"or", num:12, propietari:undefined},
    {pal:"co", num: 1, propietari:undefined},
    {pal:"co", num: 2, propietari:undefined},
    {pal:"co", num: 3, propietari:undefined},
    {pal:"co", num: 4, propietari:undefined},
    {pal:"co", num: 5, propietari:undefined},
    {pal:"co", num: 6, propietari:undefined},
    {pal:"co", num: 7, propietari:undefined},
    {pal:"co", num: 8, propietari:undefined},
    {pal:"co", num: 9, propietari:undefined},
    {pal:"co", num:10, propietari:undefined},
    {pal:"co", num:11, propietari:undefined},
    {pal:"co", num:12, propietari:undefined},
    {pal:"es", num: 1, propietari:undefined},
    {pal:"es", num: 2, propietari:undefined},
    {pal:"es", num: 3, propietari:undefined},
    {pal:"es", num: 4, propietari:undefined},
    {pal:"es", num: 5, propietari:undefined},
    {pal:"es", num: 6, propietari:undefined},
    {pal:"es", num: 7, propietari:undefined},
    {pal:"es", num: 8, propietari:undefined},
    {pal:"es", num: 9, propietari:undefined},
    {pal:"es", num:10, propietari:undefined},
    {pal:"es", num:11, propietari:undefined},
    {pal:"es", num:12, propietari:undefined},
    {pal:"ba", num: 1, propietari:undefined},
    {pal:"ba", num: 2, propietari:undefined},
    {pal:"ba", num: 3, propietari:undefined},
    {pal:"ba", num: 4, propietari:undefined},
    {pal:"ba", num: 5, propietari:undefined},
    {pal:"ba", num: 6, propietari:undefined},
    {pal:"ba", num: 7, propietari:undefined},
    {pal:"ba", num: 8, propietari:undefined},
    {pal:"ba", num: 9, propietari:undefined},
    {pal:"ba", num:10, propietari:undefined},
    {pal:"ba", num:11, propietari:undefined},
    {pal:"ba", num:12, propietari:undefined},
  ]);

  //assigna cartes jugador N,S,E,O
  for(var i=0 ;i<12;i++){cartes[i].propietari=this.equips[1].jugadorN;}
  for(var i=12;i<24;i++){cartes[i].propietari=this.equips[1].jugadorS;}
  for(var i=24;i<36;i++){cartes[i].propietari=this.equips[2].jugadorE;}
  for(var i=36;i<48;i++){cartes[i].propietari=this.equips[2].jugadorO;}

  return cartes;
};

//check if jugadors segueixen connectats
Partida.prototype.checkJugadors=function(){
  if(
    this.equips[1].jugadorN &&
    this.equips[1].jugadorS &&
    this.equips[2].jugadorE &&
    this.equips[2].jugadorO
  ){
    return true;
  }else{
    console.log("Algun jugador offline (partida "+this.creador+")");
    return false;
  }
};

//get array jugadors [N,S,E,O]
Partida.prototype.getJugadors=function(){
  return [
    this.equips[1].jugadorN,
    this.equips[1].jugadorS,
    this.equips[2].jugadorE,
    this.equips[2].jugadorO,
  ];
};

Partida.prototype.getCompany=function(jugador_id){
  if     (jugador_id==this.equips[1].jugadorN) return this.equips[1].jugadorS;
  else if(jugador_id==this.equips[1].jugadorS) return this.equips[1].jugadorN;
  else if(jugador_id==this.equips[2].jugadorE) return this.equips[2].jugadorO;
  else if(jugador_id==this.equips[2].jugadorO) return this.equips[2].jugadorE;
  else 
    return false;
};

Partida.prototype.getNextJugador=function(jugador_id){
  if     (jugador_id==this.equips[1].jugadorN) return this.equips[2].jugadorO;
  else if(jugador_id==this.equips[1].jugadorS) return this.equips[2].jugadorE;
  else if(jugador_id==this.equips[2].jugadorE) return this.equips[1].jugadorN;
  else if(jugador_id==this.equips[2].jugadorO) return this.equips[1].jugadorS;
  else 
    return false;
};
