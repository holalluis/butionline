//llibreries
var express=require('express'); //js server
var socket=require('socket.io'); //websockets
var utils=require('./utils'); //utils (local)
var Partida=require('./partida'); //normes butifarra. var p=new Partida();

//express setup
var app=express();
var server=app.listen(4000,function(){
  console.log("escoltant peticions al port 4000");
});

//static files
app.use(express.static('public'));

/*
  Array usuaris connectats
  {nom, id:socketId}
*/
var usuaris=[];

/*
  Array partides creades (veure 'partida.js')
*/
var partides=[];

//server socket setup
var io=socket(server);

//SOCKET CONNECTION LISTENER
io.on('connection',function(sock){
  var ip=sock.conn.remoteAddress.split(':')[3]; //remoteAddress = "::ffff:192.168.1.131"
  console.log('nou usuari anònim ('+sock.id+', '+ip+')');

  //1. envia llista usuaris i partides actual
  sock.emit('refresca-usuaris',usuaris);
  sock.emit('refresca-partides',partides);

  //SOCKET CUSTOM EVENT LISTENERS

  //remote user crea partida
  sock.on('crear-partida',function(){
    console.log('usuari vol crear partida ('+sock.id+')');

    //comprova si l'usuari té permís per crear la partida
    //comprova si ja ha creat una partida
    var permis=true;
    partides.forEach(p=>{
      if(p.creador==sock.id){permis=false;}
    });

    //no continuïs si no hi ha permís
    if(permis==false){
      console.log('usuari no té permís per crear partida ('+sock.id+')');
      return;
    }

    //nova partida
    var p=new Partida(sock.id);
    partides.push(p);
    console.log('partida creada ('+sock.id+')');

    //emet la nova llista de partides
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user esborra partida
  sock.on('esborrar-partida',function(){
    console.log('usuari vol esborrar partida ('+sock.id+')');
    //esborra partides que tenen creador == sock.id
    partides=partides.filter(p=>{return p.creador!=sock.id});
    //emet la nova llista de partides
    io.sockets.emit('refresca-partides',partides);
    console.log('partida esborrada ('+sock.id+')');
  });

  //remote user joins partida "sock_id"
  sock.on('join-partida',function(sock_id){
    console.log('('+sock.id+') vol unir-se a ('+sock_id+')');

    //si usuari no té username no l'afegeixis
    if(!utils.getUsername(usuaris,sock.id)){
      console.log("Usuari no té nom ("+sock.id+")");
      return false;
    }

    //si usuari ja forma part no afegeixis
    for(var i=0;i<partides.length;i++){
      if(partides[i].isPart(sock.id)){
        return false;
      }
    }

    //obtenir partida des de "partides"
    var p=utils.getPartida(partides,sock_id);
    if(p){
      p.afegirJugador(sock.id);
      io.sockets.emit('refresca-partides',partides);
    }
  });

  //remote user exits partida
  sock.on('exit-partida',function(sock_id){
    console.log('usuari ('+sock.id+') vol sortir de ('+sock_id+')');

    //obtenir partida des de "partides"
    var p=utils.getPartida(partides,sock_id);

    if(p){
      p.esborraJugador(sock.id);
      io.sockets.emit('refresca-partides',partides);
    }
  });

  //host starts partida
  sock.on('start-partida',function(){
    console.log('creador vol iniciar partida ('+sock.id+')'); 

    //continuar aqui here

    //obtenir partida des de "partides"
    var p=utils.getPartida(partides,sock.id);

    io.sockets.emit('start-partida',sock.id);
  });

  //remote user disconnected
  sock.on('disconnect',function(){
    console.log('usuari desconnectat ('+sock.id+')');

    //emet event sortir a tothom
    var nick=utils.getUsername(usuaris,sock.id);
    if(nick){
      io.sockets.emit('sortir',{nom:nick,data:utils.novaData(),id:sock.id});
    }

    //elimina usuari desconnectat i emet la nova llista a tothom
    usuaris=usuaris.filter(u=>{return u.id!=sock.id});
    io.sockets.emit('refresca-usuaris',usuaris);

    //elimina partides on es el creador i deixa espai a les que s'ha unit
    //i emet la nova llista
    partides=partides.filter(p=>{return p.creador!=sock.id});
    partides.forEach(p=>{
      p.esborraJugador(sock.id);
    });
    io.sockets.emit('refresca-partides',partides);
  });

  //remote user entra al xat
  sock.on('entrar',function(nom_usuari){
    console.log('"'+nom_usuari+'" nou nick ('+sock.id+')');

    //si l'usuari ja estava connectat canvia-li el nom
    var usuaris_filtrats=usuaris.filter(u=>{return u.id==sock.id});
    if(usuaris_filtrats.length){
      var antic=usuaris_filtrats[0].nom;
      var nou=nom_usuari;
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
    //debug:console.log(nick+" is typing");
    //broadcast: emet a tothom menys a l'autor
    sock.broadcast.emit('typing',nick);
  });

  //remote user envia missatge
  sock.on('xat',function(missatge){
    console.log("missatge '"+missatge+"' al xat ("+sock.id+")");

    //busca nick autor missatge
    var nick=utils.getUsername(usuaris,sock.id);
    if(!nick){
      nick="<i>anònim</i>";
    }
    nick="<span title='"+sock.id+"'>"+nick+"</span>";

    //emet nou missatge a tothom
    io.sockets.emit('xat',{nick,missatge,data:utils.novaData()});
  });
});
