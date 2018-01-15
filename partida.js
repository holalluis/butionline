/*
 * Backend partida botifarra
 *
 */
function Partida(creador){
  //propietats globals
  this.creador=creador; //sock id usuari
  this.objectiu=101;    //51 | 101 | 151 punts
  this.jugadors=1;      //0-4
  this.en_marxa=false;  //partida en marxa

  //equips: jugadors N+S vs E+O
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
  this.canta=null;         //socket id del jugador que canta
  this.delegat=false;      //cantar delegat a company o no
  this.triomf=null;        //oros, copes, espases, bastos, botifarra, delegar
  this.recontrar=null;     //true, false
  this.santvicenç=null;    //true, false
  this.multiplicador=null; //contrar:2, recontrar:4, santvicenç:8
  this.actiu=null;         //socket id del jugador que ha de tirar
  this.basa=[];            //array de cartes tirades a la basa actual [{pal,num,jugador_id}]
  this.bases=[];           //array de bases jugades
  this.hanRecollit=0;      //nº de jugadors que han recollit la basa
};

//export (require)
module.exports=Partida;

//reset variables per poder recomençar partida
Partida.prototype.reset=function(){
  this.equips[1].punts=0;
  this.equips[2].punts=0;
  this.en_marxa=false;
  this.canta=null;
  this.triomf=null;
  this.multiplicador=null;
  this.recontrat=null;
  this.sanvicentat=null;
  this.actiu=null;
  this.basa=[];
  this.bases=[];
  this.hanRecollit=0;
};

//compta jugadors N+S vs E+O
Partida.prototype.comptaJugadors=function(){
  var jug=0;
  if(this.equips[1].jugadorN) jug++;
  if(this.equips[1].jugadorS) jug++;
  if(this.equips[2].jugadorE) jug++;
  if(this.equips[2].jugadorO) jug++;
  this.jugadors=jug;
  return jug;
}

//assigna socket id a nou jugador
Partida.prototype.afegirJugador=function(sock_id){
  //si ja hi ha 4 persones
  if(this.comptaJugadors()>=4){
    console.log("partida plena ("+this.creador+")")
    return false;
  }
  //si el jugador ja és dins
  else if(this.isPart(sock_id)){
    console.log("jugador ja forma part de partida ("+this.creador+")")
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

  if(this.comptaJugadors()<4){
    this.reset();}
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

//retorna un jugador a l'atzar o el següent jugador
Partida.prototype.quiCanta=function(){
  //si ja ha cantat algú abans canta el següent
  if(this.canta){
    this.canta=this.getNextJugador(this.canta);
    return this.canta;
  }
  //si canta==null canta random
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

//guanyador basa
Partida.prototype.getGuanyador=function(basa){
  /*
    Algoritme determinar guanyador d'una basa. Es mira:
      1) si tota la basa és del mateix pal: carta alta
      2) si hi ha algun triomf: carta alta triomf
      3) pal inicial: carta alta pal inicial
  */

  //comprovacions input
  if(basa.length!=4){
    console.log('error: basa incorrecta');
    return false;
  }

  //retorn
  var guanyador;

  //triomf string
  var triomf=this.triomf.substring(0,2); //'or','co','es','ba','bo'

  //converteix As i Manilla a "13" i "14" per comparar fàcilment número
  basa.forEach(c=>{
    if     (c.num==9) c.num=14;
    else if(c.num==1) c.num=13;
  });

  //1. Determina si la basa és tota del mateix pal
  if(
    basa[0].pal==basa[1].pal &&
    basa[1].pal==basa[2].pal &&
    basa[2].pal==basa[3].pal
  ){
    var cartaMesAlta=0;
    basa.forEach(c=>{
      if(c.num>cartaMesAlta){
        cartaMesAlta=c.num;
        guanyador=c.jugador_id;
      }
    });
  }else if(
    //2. Mira si alguna carta és triomf
    basa[0].pal==triomf ||
    basa[1].pal==triomf ||
    basa[2].pal==triomf ||
    basa[3].pal==triomf
  ){
    var cartaMesAlta=0;
    basa
      .filter(c=>{return c.pal==triomf})
      .forEach(c=>{
      if(c.num>cartaMesAlta){
        cartaMesAlta=c.num;
        guanyador=c.jugador_id;
      }
    });
  }else{
    //3. Carta alta pal inicial
    var cartaMesAlta=0;
    basa
      .filter(c=>{return c.pal==basa[0].pal})
      .forEach(c=>{
      if(c.num>cartaMesAlta){
        cartaMesAlta=c.num;
        guanyador=c.jugador_id;
      }
    });
  }

  return guanyador;
};

Partida.prototype.getEquip=function(jugador_id){
  if     (jugador_id==this.equips[1].jugadorN) return 1;
  else if(jugador_id==this.equips[1].jugadorS) return 1;
  else if(jugador_id==this.equips[2].jugadorE) return 2;
  else if(jugador_id==this.equips[2].jugadorO) return 2;
  else return false;
};

//compta punts ronda
Partida.prototype.comptaPunts=function(bases){
  //separar les bases en 2 pilons
  var bases_equip1=[];
  var bases_equip2=[];

  //guanyador és jugador_id primera carta base següent
  //es pot saber amb les 11 primeres bases
  //la base 12 s'ha de determinar amb "this.getGuanyador"
  for(var i=0;i<12;i++){
    var guanyador;
    if(i==11){ guanyador=this.getGuanyador(bases[11]);}
    else{      guanyador=bases[i+1][0].jugador_id;}

    //determina equip i piló bases
    var equip=this.getEquip(guanyador);
    if(equip==1){
      bases_equip1.push(bases[i]);
    }else if(equip==2){
      bases_equip2.push(bases[i]);
    }else{
      console.log('error equip bases');
      return;
    }
  }

  //només cal comptar un piló (equip 1)
  var punts_e1=0;
  var punts_e2=0;
  bases_equip1.forEach(b=>{
    //1 punt basa
    punts_e1++;
    //punts per carta
    b.forEach(c=>{
      if     (c.num==10) punts_e1+=1; //puta
      else if(c.num==11) punts_e1+=2; //cavall
      else if(c.num==12) punts_e1+=3; //rei
      else if(c.num==13) punts_e1+=4; //as
      else if(c.num==14) punts_e1+=5; //manilla
    });
  });

  //determina els punts equip 2
  if(punts_e1>36){
    punts_e1 = punts_e1-36;
    punts_e2 = 0;
  }else{
    punts_e2 = 36-punts_e1;
    punts_e1 = 0;
  }

  //botifarra val per 2
  if(this.triomf=="botifarra"){
    punts_e1*=2;
    punts_e2*=2;
  }

  //aplica multiplicador (contrar,recontrar,santvicenç);
  punts_e1*=this.multiplicador;
  punts_e2*=this.multiplicador;

  return {
    equip1:punts_e1,
    equip2:punts_e2,
  }
};
