//llibreries
var express=require('express'); //js server
var compression=require('compression'); //gzip
var socket=require('socket.io'); //websockets
var utils=require('./utils.js'); //(local) utils
var Partida=require('./partida.js'); //(local) classe Partida

//express setup
var app=express();
app.use(compression());
var server=app.listen(4000,function(){
  console.log("escoltant peticions al port 4000");});

//static files
app.use(express.static('public'));

//bind new server socket
var io=socket(server);

/*
  Array usuaris connectats [{nom,socketId}]
  Array partides creades (veure 'partida.js')
*/
var usuaris=[];
var partides=[];

//SERVER SOCKET: ESCOLTA CLIENT EVENTS
io.on('connection',function(sock){
  var ip=sock.conn.remoteAddress.split(':')[3]; //exemple "::ffff:192.168.1.131"
  utils.log('nou usuari anònim ('+sock.id+', '+ip+')');

  //envia llista usuaris i partides actuals
  sock.emit('refresca-usuaris',usuaris);
  sock.emit('refresca-partides',partides);

  //SOCKET CUSTOM EVENT LISTENERS

  //jugador anuncia ha recollit basa
  sock.on('basa-recollida',function(partida_id){
    utils.log('basa recollida (P '+partida_id+')');

    //get partida
    var p=utils.getPartida(partides,partida_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //augmenta comptador jugadors que han recollit
    p.hanRecollit++;

    //només si tothom ha recollit
    if(p.hanRecollit<4){return;}

    //afegeix basa a registre de bases
    p.bases.push(p.basa);

    //check si ronda ha acabat
    if(p.bases.length==12){
      //compta els punts
      var punts=p.comptaPunts(p.bases);
      utils.log(punts);

      //update punts
      p.equips[1].punts+=punts.equip1;
      p.equips[2].punts+=punts.equip2;

      //anuncia ronda acabada
      p.getJugadors().forEach(sock_id=>{
        if(sock_id==sock.id){
          sock.emit('ronda-acabada',punts);
        }else{
          sock.broadcast.to(sock_id).emit('ronda-acabada',punts);
        }
      });

      //mira si s'ha acabat la partida
      if(p.equips[1].punts>=p.objectiu || p.equips[2].punts>=p.objectiu){
        var p1=p.equips[1].punts;
        var p2=p.equips[2].punts;
        utils.log('partida acabada ('+p1+' a '+p2+')');

        //reseteja partida per poder tornar a començar
        p.reset();
        p.getJugadors().forEach(sock_id=>{
          if(sock_id==sock.id){
            sock.emit('refresca-partides',partides);
          }else{
            sock.broadcast.to(sock_id).emit('refresca-partides',partides);
          }
        });
      }
      return;
    }

    //DETERMINA QUI GUANYA PER PASSAR A LA SEGÜENT BASA
    var guanyador=p.getGuanyador(p.basa); //sock id guanyador
    utils.log('guanyador: '+guanyador);

    //anuncia a cada jugador següent tirada
    p.actiu=guanyador;
    p.getJugadors().forEach(sock_id=>{
      if(sock_id==sock.id){
        sock.emit('esperant-tirada',p.actiu);
      }else{
        sock.broadcast.to(sock_id).emit('esperant-tirada',p.actiu);
      }
    });

    //reset basa i jugadors que han recollit
    p.hanRecollit=0;
    p.basa=[];
  });

  //jugador intenta una tirada
  sock.on('tirada',function(data){
    utils.log('carta jugada (P '+data.partida_id+") (J "+sock.id+")");
    var pal=data.pal;
    var num=data.num;

    //get partida
    var p=utils.getPartida(partides,data.partida_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //si la basa ja té alguna carta amb id del jugador rebutja-la
    if(p.basa.filter(c=>{return c.jugador_id==sock.id}).length>0){
      utils.log('tirada rebutjada -- el jugador ja ha tirat');
      return;
    }

    //nou objecte tirada {id,pal,num}
    var tirada={jugador_id:sock.id,pal,num};

    //tirada acceptada
    p.basa.push(tirada);

    //anuncia la carta tirada al client
    //nota: la legalitat es comprova al client no al servidor
    p.getJugadors().forEach(sock_id=>{
      if(sock_id==sock.id){
        sock.emit('tirada-legal',tirada);
      }else{
        sock.broadcast.to(sock_id).emit('tirada-legal',tirada);
      }
    });

    //si la basa està plena: recollir
    if(p.basa.length==4){
      //emet event recollir basa
      p.getJugadors().forEach(sock_id=>{
        //anuncia a cada jugador que ja es pot recollir la basa
        if(sock_id==sock.id){
          sock.emit('recollir-basa');
        }else{
          sock.broadcast.to(sock_id).emit('recollir-basa');
        }
      });
      return;
    }

    //següent tirada
    p.actiu=p.getNextJugador(sock.id);
    p.getJugadors().forEach(sock_id=>{
      //anuncia a cada jugador que ja es pot tirar
      if(sock_id==sock.id){
        sock.emit('esperant-tirada',p.actiu);
      }else{
        sock.broadcast.to(sock_id).emit('esperant-tirada',p.actiu);
      }
    });
  });

  //creador starts partida
  sock.on('start-partida',function(){
    utils.log('creador vol iniciar partida ('+sock.id+')');
    /*INICI PARTIDA*/
    //get partida
    var p=utils.getPartida(partides,sock.id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //marca que la partida està en marxa
    p.en_marxa=true;

    //anuncia als jugadors que la partida comença
    p.getJugadors().forEach(sock_id=>{
      if(sock_id==sock.id){
        sock.emit('start-partida',sock.id);
      }else{
        sock.broadcast.to(sock_id).emit('start-partida',sock.id);
      }
    });
  });

  //creador starts ronda
  sock.on('start-ronda',function(){
    utils.log('creador vol iniciar ronda ('+sock.id+')');

    //get partida
    var p=utils.getPartida(partides,sock.id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    p.triomf=null;
    p.recontrar=null;
    p.santvicenç=null;
    p.multiplicador=null;
    p.actiu=null;
    p.basa=[];
    p.bases=[];
    p.hanRecollit=0;

    /*RONDA*/
    utils.log("repartint cartes ("+sock.id+")")

    //1. repartir cartes (=assignar propietari)
    var jugadors=p.getJugadors(); //[N,S,E,O]
    var cartes=p.repartir();
    jugadors.forEach(sock_id=>{
      //filtra cartes per propietari (sock id)
      var ma=cartes.filter(c=>{return c.propietari==sock_id});
      //reparteix a cada socket PER SEPARAT
      if(sock_id==sock.id){
        sock.emit('repartir',ma);
      }else{
        sock.broadcast.to(sock_id).emit('repartir',ma);
      }
    });

    //2. determina qui canta i emet sock_id
    var canta=p.quiCanta();
    utils.log("canta "+canta);
    jugadors.forEach(sock_id=>{
      if(sock_id==sock.id){
        sock.emit('anuncia-qui-canta',canta);
      }else{
        sock.broadcast.to(sock_id).emit('anuncia-qui-canta',canta);
      }
    });
  });

  //remote user tria triomf
  sock.on('triomf-triat',function(data){
    var creador=data.creador;
    var pal=data.pal;

    //get partida
    var p=utils.getPartida(partides,creador);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //seteja pal triat a la partida
    utils.log("pal triat: "+pal+" ("+creador+")");
    p.triomf=pal;

    //anuncia als jugadors el pal triat
    p.getJugadors().forEach(sock_id=>{
      if(sock_id==sock.id){
        sock.emit('triomf-triat',pal);
      }else{
        sock.broadcast.to(sock_id).emit('triomf-triat',pal);
      }
    });

    //el primer de tirar serà el següent al de cantar
    p.actiu=p.getNextJugador(p.canta);

    //si es delega emet 'delegar' al company
    if(pal=="delegar"){
      var company=p.getCompany(p.canta);
      utils.log("delegat a "+company);
      sock.broadcast.to(company).emit('delegar');
    }else{
      //CONTRAR/RECONTRAR/SANTVICENÇ
      //anuncia als rivals si volen contrar
      var rival1=p.getNextJugador(p.canta);
      var rival2=p.getCompany(rival1);
      sock.broadcast.to(rival1).emit('esperant-contro');
      sock.broadcast.to(rival2).emit('esperant-contro');
    }
  });

  //remote user vol contrar
  sock.on('contrar',function(data){
    utils.log('rebuda resposta contrar '+data.contrar);

    //get partida
    var p=utils.getPartida(partides,data.partida_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //get rivals
    var rival1=p.getNextJugador(sock.id);
    var rival2=p.getCompany(rival1);

    //processa resposta
    if(p.multiplicador==1){
      utils.log('company no vol contrar');
      if(data.contrar){
        utils.log('usuari vol contrar');
        p.multiplicador=2;
        //emet recontrar als rivals
        sock.broadcast.to(rival1).emit('esperant-recontro');
        sock.broadcast.to(rival2).emit('esperant-recontro');
      }else{
        //ningú vol contrar: començar partida
        //emet 'esperant-tirada'
        p.getJugadors().forEach(sock_id=>{
          if(sock_id==sock.id){
            sock.emit('anunci-multiplicador',p.multiplicador);
            sock.emit('esperant-tirada',p.actiu);
          }
          else{
            sock.broadcast.to(sock_id).emit('anunci-multiplicador',p.multiplicador);
            sock.broadcast.to(sock_id).emit('esperant-tirada',p.actiu);
          }
        });
      }
    }else if(p.multiplicador==2){
      utils.log('company vol contrar');
      //emet recontrar als rivals
      sock.broadcast.to(rival1).emit('esperant-recontro');
      sock.broadcast.to(rival2).emit('esperant-recontro');
    }else if(p.multiplicador==null){
      utils.log('resposta contrar rebuda. Esperant company');
      p.multiplicador = data.contrar ? 2 : 1;
      return;
    }
  });

  //remote user vol recontrar
  sock.on('recontrar',function(data){
    utils.log('respota jugador recontrar (P '+data.partida_id+')');

    //get partida
    var p=utils.getPartida(partides,data.partida_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //get rivals
    var rival1=p.getNextJugador(sock.id);
    var rival2=p.getCompany(rival1);

    //processa resposta
    if(p.recontrar==false){
      utils.log('company no vol recontrar');
      if(data.recontrar){
        utils.log('usuari vol recontrar');
        p.multiplicador=4;
        //emet santvicenç als rivals
        sock.broadcast.to(rival1).emit('esperant-santvicenç');
        sock.broadcast.to(rival2).emit('esperant-santvicenç');
      }else{
        //ningú vol recontrar: començar partida
        //emet 'esperant-tirada'
        p.getJugadors().forEach(sock_id=>{
          if(sock_id==sock.id){
            sock.emit('anunci-multiplicador',p.multiplicador);
            sock.emit('esperant-tirada',p.actiu);
          }
          else{
            sock.broadcast.to(sock_id).emit('anunci-multiplicador',p.multiplicador);
            sock.broadcast.to(sock_id).emit('esperant-tirada',p.actiu);
          }
        });
      }
    }else if(p.recontrar==true){
      utils.log('company vol recontrar');
      p.multiplicador=4;
      //emet santvicenç als rivals
      sock.broadcast.to(rival1).emit('esperant-santvicenç');
      sock.broadcast.to(rival2).emit('esperant-santvicenç');
    }else if(p.recontrar==null){
      utils.log('resposta recontrar rebuda. Esperant company');
      p.recontrar = data.recontrar;
      return;
    }
  });

  //remote user vol fer santvicenç
  sock.on('santvicenç',function(data){
    utils.log('respota jugador santvicenç');

    //get partida
    var p=utils.getPartida(partides,data.partida_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //processa resposta
    if(p.santvicenç==false){
      utils.log('company no vol santvicenç');
      if(data.santvicenç){
        utils.log('usuari vol santvicenç');
        p.santvicenç=true;
      }
    }else if(p.santvicenç==null){
      utils.log('resposta santvicenç rebuda. Esperant company');
      p.santvicenç = data.santvicenç;
      return;
    }

    //aplica santvicenç
    if(p.santvicenç){p.multiplicador=8;}

    //comença la partida
    //emet 'esperant-tirada'
    p.getJugadors().forEach(sock_id=>{
      //anuncia a cada jugador que ja es pot tirar
      if(sock_id==sock.id){
        sock.emit('anunci-multiplicador',p.multiplicador);
        sock.emit('esperant-tirada',p.actiu);
      }
      else{
        sock.broadcast.to(sock_id).emit('anunci-multiplicador',p.multiplicador);
        sock.broadcast.to(sock_id).emit('esperant-tirada',p.actiu);
      }
    });
  });

  //remote user crea partida
  sock.on('crear-partida',function(){
    utils.log('usuari vol crear partida ('+sock.id+')');

    //comprova si l'usuari té permís per crear la partida
    //comprova si ja ha creat una partida
    var permis=true;
    partides.forEach(p=>{
      if(p.creador==sock.id){permis=false;}
    });

    //no continuïs si no hi ha permís
    if(permis==false){
      utils.log('usuari no té permís per crear partida ('+sock.id+')');
      return;
    }

    //nova partida
    var p=new Partida(sock.id);
    partides.push(p);
    utils.log('partida creada ('+sock.id+')');

    //emet la nova llista de partides
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user esborra partida
  sock.on('esborrar-partida',function(){
    utils.log('creador vol esborrar partida (P '+sock.id+')');

    //get partida
    var p=utils.getPartida(partides,sock.id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //emet event "partida-abandonada"
    sock.emit('partida-abandonada');
    p.getJugadors().forEach(j_id=>{
      sock.broadcast.to(j_id).emit('partida-abandonada');
    });

    //esborra partides on p.creador == sock.id
    partides=partides.filter(p=>{return p.creador!=sock.id});
    utils.log('partida esborrada (P '+sock.id+')');

    //emet la nova llista de partides
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user joins partida "sock_id"
  sock.on('join-partida',function(sock_id){
    utils.log('(J '+sock.id+') vol unir-se a (P '+sock_id+')');

    //si usuari no té username no l'afegeixis
    if(!utils.getUsername(usuaris,sock.id)){
      utils.log("usuari fora del xat (J "+sock.id+")");
      return false;
    }

    //si usuari ja forma part d'una partida no afegeixis
    for(var i=0;i<partides.length;i++){
      if(partides[i].isPart(sock.id)){
        utils.log("usuari ja és dins una partida (J "+sock.id+")");
        return false;
      }
    }

    //obtenir partida des de "partides"
    var p=utils.getPartida(partides,sock_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //afegir jugador i emet canvis
    utils.log('(J '+sock.id+') afegit a (P '+sock_id+')');
    p.afegirJugador(sock.id);
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user exits partida
  sock.on('exit-partida',function(sock_id){
    utils.log('usuari ('+sock.id+') vol sortir de ('+sock_id+')');

    //obtenir partida des de "partides"
    var p=utils.getPartida(partides,sock_id);
    if(!p){utils.log("partida "+partida_id+" desconnectada");return;}

    //emet 'partida-abandonada'
    p.getJugadors().forEach(jugador_id=>{
      if(jugador_id==sock.id){
        sock.emit('partida-abandonada');
      }else{
        sock.broadcast.to(jugador_id).emit('partida-abandonada');
      }
    });

    //esborra jugador i emet canvis
    p.esborraJugador(sock.id);
    p.en_marxa=false;

    io.sockets.emit('refresca-partides',partides);
  });

  //remote user disconnected
  sock.on('disconnect',function(){
    utils.log('usuari desconnectat ('+sock.id+')');

    //emet event sortir a tothom
    var nick=utils.getUsername(usuaris,sock.id);
    if(nick){
      io.sockets.emit('sortir',{nom:nick,data:utils.novaData(),id:sock.id});
    }

    //elimina usuari desconnectat i emet la nova llista a tothom
    usuaris=usuaris.filter(u=>{return u.id!=sock.id});
    io.sockets.emit('refresca-usuaris',usuaris);

    //si forma part de partida avisa jugadors partida abandonada
    partides.forEach(p=>{
      if(p.isPart(sock.id)){
        p.getJugadors().forEach(sock_id=>{
          //emet event 'partida-abandonada' als altres jugadors
          sock.broadcast.to(sock_id).emit('partida-abandonada');
        });
      }
    });

    //elimina partides on es el creador
    partides=partides.filter(p=>{return p.creador!=sock.id});

    //deixa espai a les partides que s'havia unit
    partides.forEach(p=>{p.esborraJugador(sock.id);});

    //emet la nova llista de partides
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user entra al xat
  sock.on('entrar',function(nom_usuari){
    utils.log('"'+nom_usuari+'" nou nick ('+sock.id+')');

    //si l'usuari ja estava connectat canvia-li el nom
    var usuaris_filtrats=usuaris.filter(u=>{return u.id==sock.id});
    if(usuaris_filtrats.length){
      var antic=usuaris_filtrats[0].nom;
      var nou=nom_usuari;

      //si antic==nou no facis res
      if(antic==nou){return;}

      //canvia el nom
      usuaris_filtrats[0].nom=nom_usuari;
      //emet event canvi de nom
      io.sockets.emit('canvi-nom',{antic,nou,data:utils.novaData(),id:sock.id});
    }else{
      //si l'usuari no estava connectat, registra'l
      usuaris.push({
        nom:nom_usuari,
        id:sock.id,
      })
      //emet event entrar
      io.sockets.emit('entrar',{nom:nom_usuari,data:utils.novaData(),id:sock.id});
    }

    //emet la nova llista d'usuaris
    io.sockets.emit('refresca-usuaris',usuaris);

    //emet partides per refrescar els noms
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user està escrivint missatge
  sock.on('typing',function(nick){
    //debug:utils.log(nick+" is typing");
    //broadcast: emet a tothom menys a l'autor
    sock.broadcast.emit('typing',nick);
  });

  //remote user envia missatge
  sock.on('xat',function(missatge){
    utils.log("XAT '"+missatge+"' ("+sock.id+")");
    //emet nou missatge a tothom
    io.sockets.emit('xat',{id:sock.id,missatge,data:utils.novaData()});
  });
});
