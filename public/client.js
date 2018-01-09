var socket = io.connect('http://192.168.1.131:4000');

/* Element handlers (ordenat per seccions) */

//entrar
var nom_usuari=document.getElementById('nom_usuari');
var btn_entrar=document.getElementById('btn_entrar');
//usuaris
var comptador_usuaris=document.getElementById('comptador_usuaris')
var usuaris=document.getElementById('usuaris');
//xat
var feedback=document.getElementById('feedback');
var xat=document.getElementById('xat');
var xat_controls=document.getElementById('xat_controls');
var missatge=document.getElementById('missatge');
var btn_missatge=document.getElementById('btn_missatge');
//partides
var comptador_partides=document.getElementById('comptador_partides');
var btn_crear_partida=document.getElementById('btn_crear_partida');
var partides=document.getElementById('partides');
//info partida
//TODO
//log
var log=document.getElementById('log');

/* Utils */
//quan entra un usuari fes visible coses invisibles
function activaControlsXat(){
  //fes visible les següents parts
  [ 
    xat_controls,
    btn_crear_partida,
  ]
  .forEach(el=>{el.style.visibility='visible';});
}

function init(){
  btn_entrar.dispatchEvent(new CustomEvent('click'));
  //btn_crear_partida.dispatchEvent(new CustomEvent('click'));
}

/* Variables globals + default value */
var usuari=socket.id;
var usuaris_actuals=[];
var partides_actuals=[];
var timeout_typing_event=false; //per event typing

/* ESCOLTA EVENTS + EMET EVENTS SOCKET */

//button crear partida
btn_crear_partida.addEventListener('click',function(){
  //emet event crear_partida
  socket.emit('crear-partida');
});

//button entrar onclick
btn_entrar.addEventListener('click',function(){
  //comprova si el nom d'usuari ja existeix
  (function(){
    usuari=nom_usuari.value;
    while(usuaris_actuals.filter(u=>{return u.nom==usuari && u.id!=socket.id}).length){
      usuari=usuari+"2"; //modifica el nom
      nom_usuari.value=usuari;
    }
  })();

  btn_entrar.innerHTML="canviar nom";

  //emet event entrar
  socket.emit('entrar',usuari);
});

//nom usuari onkeypress
nom_usuari.addEventListener('keypress',function(e){
  //si prem enter envia el missatge
  var key = e.which || e.keyCode;
  if (key === 13) { // 13 is enter
    btn_entrar.dispatchEvent(new CustomEvent('click'));
  }
});

//btn_missatge onclick
btn_missatge.addEventListener('click',function(){
  if(missatge.value=="")return;
  //emet event xat
  socket.emit('xat',missatge.value);
  //reselect missatge
  missatge.value="";
  missatge.select();
});

//missatge onkeypress
missatge.addEventListener('keypress',function(e){
  //emet event typing
  socket.emit('typing',usuari);
  //si prem enter envia el missatge
  var key = e.which || e.keyCode;
  if (key === 13) { // 13 is enter
    btn_missatge.dispatchEvent(new CustomEvent('click'));
  }
});

/*ESCOLTA SOCKET EVENTS*/

socket.on('entrar',function(data){
  xat.innerHTML+="<div style=color:green title='"+data.id+"'>"+
    "["+data.data+"] "+
    "<em>"+data.nom+" ha entrat al xat</em>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;
});

socket.on('sortir',function(data){
  xat.innerHTML+="<div style=color:red title='"+data.id+"'>"+
    "["+data.data+"] "+
    "<em>"+data.nom+" ha sortit del xat</em>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;
});

socket.on('canvi-nom',function(data){
  xat.innerHTML+="<div style=color:green title='"+data.id+"'>"+
    "["+data.data+"] "+
    "<em>"+data.antic+" ara és "+data.nou+"</em>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;
});

//escolta event typing
socket.on('typing',function(nick){
  var str="<small>("+nick+" està escrivint...)</small>";
  feedback.innerHTML=str;
  //elimina el missatge al cap d'uns segons
  clearTimeout(timeout_typing_event);
  timeout_typing_event=setTimeout(function(){feedback.innerHTML=""},5000);
});

//escolta event xat
socket.on('xat',function(data){
  feedback.innerHTML="";
  xat.innerHTML+="<div>"+
    "["+data.data+"] "+
    "<strong>"+data.nick+"</strong>: "+
    "<span>"+data.missatge+"</span>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;
});

//escolta event refresca-usuaris
socket.on('refresca-usuaris',function(usuaris_connectats){
  comptador_usuaris.innerHTML=usuaris_connectats.length;
  usuaris_actuals=usuaris_connectats;
  usuaris.innerHTML="";
  usuaris_connectats.forEach(u=>{
    var nom=u.nom;
    if(u.id==socket.id){
      nom="<b>"+nom+"</b>";
      activaControlsXat();
    }
    usuaris.innerHTML+='<li title='+u.id+'>'+nom+'</li>';
  });
});

//escolta event refresca-partides
socket.on('refresca-partides',function(partides_arr){
  comptador_partides.innerHTML=partides_arr.length;
  partides_actuals=partides_arr;
  partides.innerHTML="";
  partides_arr.forEach((p,i)=>{
    //crea div partida
    var div_partida=document.createElement('div');
    partides.appendChild(div_partida);
    div_partida.style.fontSize='smaller';
    div_partida.innerHTML+="Partida "+(i+1);
    div_partida.innerHTML+=" ("+p.jugadors+"/4 jugadors) ";
    //afegeix botó esborrar partida si ets creador
    if(p.creador==socket.id){
      var btn=document.createElement('button');
      div_partida.appendChild(btn);
      btn.innerHTML='esborrar';
      btn.setAttribute('onclick','socket.emit("esborrar-partida")'); //no sé pq no funciona addEventListener
      //afegeix botó començar si ja hi ha 4 persones
      if(p.jugadors==4){
        div_partida.innerHTML+=" ";
        var btn=document.createElement('button');
        div_partida.appendChild(btn);
        btn.innerHTML='començar';
        btn.style.background='lightgreen';
        btn.setAttribute('onclick','socket.emit("start-partida")'); //no sé pq no funciona addEventListener
      }
    }else if(p.jugadors<4){
      //afegeix botó unir-se
      var btn=document.createElement('button');
      div_partida.appendChild(btn);
      btn.innerHTML='unir-se';
      btn.setAttribute('onclick','socket.emit("join-partida","'+p.creador+'")'); //no sé pq no funciona addEventListener
    }

    //llista els jugadors de la partida i posa un botó per sortir de la partida
    (function(){
      [
        p.equips[1].jugadorN,
        p.equips[1].jugadorS,
        p.equips[2].jugadorE,
        p.equips[2].jugadorO,
      ].forEach(id=>{
        var nick=getUsername(id); //pot ser socket id o "null"
        if(nick){
          var div_jugador=document.createElement('div');
          div_partida.appendChild(div_jugador)
          div_jugador.style.fontSize='smaller';
          div_jugador.innerHTML="- "+nick+" ";

          //afegeix botó "sortir de la partida"
          if(id==socket.id && p.creador!=socket.id){
            div_jugador.innerHTML+="<button onclick=socket.emit('exit-partida','"+p.creador+"')>sortir</button>";
          }
        }
      });
    })();
  });
});

//escolta event start-partida
socket.on('start-partida',function(sock_id){
  echo("la partida ("+sock_id+") comença");

  //get objecte partida
  var p=getPartida(sock_id);
  console.log(p);

});

/* Utils */

//log partida
function echo(missatge){
  log.innerHTML+="<div>· "+missatge+"</div>";
  log.scrollTop=log.scrollHeight;
}

//get nom usuari
function getUsername(sock_id){
  var filtrat=usuaris_actuals.filter(u=>{return u.id==sock_id});
  if(filtrat.length){
    return filtrat[0].nom;
  }
  return false;
}

//get partida
function getPartida(sock_id){
  var filtrat=partides_actuals.filter(p=>{return p.creador==sock_id});
  if(filtrat.length){
    return filtrat[0];
  }
  return false;
}
