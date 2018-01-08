//libraries
var express=require('express');
var socket=require('socket.io');

//express setup
var app=express();
var server=app.listen(4000,function(){
  console.log("escoltant peticions al port 4000");
});

//static files
app.use(express.static('public'));

/*UTILS*/
  /*
    array d'usuaris connectats
    {nom,socketId}
  */
  var usuaris=[];
  //obtenir nom usuari a partir del socket id
  function getUsername(sock_id){
    var filtrats=usuaris.filter(u=>{return u.id==sock_id});
    if(filtrats.length){
      return filtrats[0].nom;
    }
    return false;
  }
  //crea date string
  function novaData(){return (new Date).toISOString().substr(11,8);}
/*UTILS*/

//server socket setup
var io=socket(server);
io.on('connection',function(sock){
  console.log('usuari connectat (sock '+sock.id+')');

  //envia-li llista d'usuaris actual
  sock.emit('refresca-usuaris',usuaris);

  //if user disconnected
  sock.on('disconnect',function(){
    console.log('usuari desconnectat (sock '+sock.id+')')

    //emet event sortir
    var nick=getUsername(sock.id);
    if(nick){
      io.sockets.emit('sortir',{nom:nick,data:novaData(),id:sock.id});
    }

    //treu l'usuari desconnectat de la llista
    usuaris=usuaris.filter(u=>{return u.id!=sock.id});

    //emet la nova llista a tothom
    io.sockets.emit('refresca-usuaris',usuaris);
  });

  //si l'usuari clica el botó "entrar"
  sock.on('entrar',function(nom_usuari){
    console.log('"'+nom_usuari+'" ha entrat (sock '+sock.id+')');

    //si l'usuari ja estava connectat canvia-li el nom
    var usuaris_filtrats=usuaris.filter(u=>{return u.id==sock.id});
    if(usuaris_filtrats.length){
      usuaris_filtrats[0].nom=nom_usuari;
    }else{
      //si l'usuari no estava connectat, registra'l
      usuaris.push({
        nom:nom_usuari,
        id:sock.id,
      })
      //emet event entrar
      io.sockets.emit('entrar',{nom:nom_usuari,data:novaData(),id:sock.id});
    }

    //emet la nova llista d'usuaris
    io.sockets.emit('refresca-usuaris',usuaris);
  });

  //si l'usuari està escrivint un missatge
  sock.on('typing',function(nick){
    //console.log(nick+" is typing");
    sock.broadcast.emit('typing',nick);
  });

  //si l'usuari envia un missatge
  sock.on('xat',function(missatge){
    console.log("missatge '"+missatge+"' rebut al xat");

    var nick=getUsername(sock.id);
    if(!nick){
      nick="<i>anònim</i>";
    }
    nick="<span title='"+sock.id+"'>"+nick+"</span>";
    //yyyy-mm-dd hh:mm
    var data=novaData();
    io.sockets.emit('xat',{nick,missatge,data});
  });
});
