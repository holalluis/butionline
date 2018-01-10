var socket = io.connect('http://192.168.1.129:4000');

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
  //tapete
  var tapet=document.getElementById('tapet');
  var jugadorN=document.getElementById('jugadorN');
  var jugadorS=document.getElementById('jugadorS');
  var jugadorE=document.getElementById('jugadorE');
  var jugadorO=document.getElementById('jugadorO');
  var ma=document.getElementById('ma');
  //status i triomf
  var status_partida=document.getElementById('status_partida');
  var triomf=document.getElementById('triomf');
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
    //btn_entrar.dispatchEvent(new CustomEvent('click'));
    //btn_crear_partida.dispatchEvent(new CustomEvent('click'));
    nom_usuari.select();
  }

/* Variables globals + default value */
  var timeout_typing_event=false; //per event typing
  var usuari=socket.id;
  var usuaris_actuals=[];
  var partida=null;
  var partides_actuals=[];
  var ma_actual=null;

/* ESCOLTA EVENTS + EMET EVENTS SOCKET */

//button crear partida
btn_crear_partida.addEventListener('click',function(){
  //emet event crear_partida
  socket.emit('crear-partida');
});

//button entrar onclick
btn_entrar.addEventListener('click',function(){

  //no facis res si nom està buit
  if(nom_usuari.value=="")return;

  //comprova si el nom d'usuari ja existeix
  (function(){
    usuari=nom_usuari.value;
    while(usuaris_actuals.filter(u=>{return u.nom==usuari && u.id!=socket.id}).length){
      usuari=usuari+"2"; //modifica el nom
      nom_usuari.value=usuari;
    }
  })();

  //canvia text botó
  btn_entrar.innerHTML="canviar nom";

  //canvia el <title></title>
  document.title="Butifarra - "+usuari;

  //fes la resta de la pàgina visible
  document.getElementById('main').style.visibility='visible';

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

socket.on('ronda-acabada',function(){
  //creador demana iniciar següent ronda al servidor
  if(socket.id==partida.creador){
    socket.emit('start-ronda');
  }
});

socket.on('recollir-basa',function(){
  echo("recull la basa fent doble-click al tapet");
  tapet.addEventListener('dblclick',function recollir(){
    this.removeEventListener('dblclick',recollir);
    var cartes=document.querySelectorAll('#tapet div.jugador img');
    for(var i=0;i<cartes.length;i++){
      var c=cartes[i];
      c.parentNode.removeChild(c);
    }
    echo("esperant que tothom reculli la basa");
    socket.emit('basa-recollida',partida.creador);
  });
});

socket.on('tirada-legal',function(data){
  var id=data.jugador_id;
  var pal=data.pal;
  var num=data.num;

  //fes apareixer la carta al tapete
  var carta=document.querySelector("#tapet div.jugador[socket='"+id+"']");
  carta.innerHTML+="<img src='/img/cartes/"+pal+(num<10?'0'+num:num)+".jpg'>";

  //fes desapareixer carta de la ma
  if(id==socket.id){
    var carta=document.querySelector('#ma img.carta[pal='+pal+'][num="'+num+'"]');
    carta.parentNode.removeChild(carta);

    //deixa de ser jugador actiu
    partida.actiu=null;
  }
});

socket.on('esperant-tirada',function(jugador_id){
  //treu emfasi anterior usuari actiu
  var carta=document.querySelector("#tapet div.jugador.actiu");
  if(carta)carta.classList.remove('actiu');

  //jugador actiu
  partida.actiu=jugador_id;

  //get nick jugador actiu
  var nick=getUsername(jugador_id);
  if(socket.id==jugador_id){
    echo("ÉS EL TEU TORN! Fes doble-click a una carta");
  }else{
    echo("esperant "+nick);
  }
  //futur: posa un so per indicar que et toca

  //posa emfasi al nou jugador actiu
  var carta=document.querySelector("#tapet div.jugador[socket='"+jugador_id+"']");
  carta.classList.add('actiu');

  //gestiona els listeners del doble clic per les cartes de la mà
  var cartes=document.querySelectorAll('#ma img.carta');

  //fx listener per cartes de la mà

  //elimina listeners de totes les cartes fent dblclick
  var temp_id=partida.actiu;
  partida.actiu=null;
  for(var i=0;i<cartes.length;i++){
    cartes[i].dispatchEvent(new CustomEvent('dblclick'));
  }
  partida.actiu=temp_id;

  //posa listeners a les cartes del jugador actiu
  if(socket.id==partida.actiu){
    for(var i=0;i<cartes.length;i++){
      cartes[i].addEventListener('dblclick',function listener(){
        this.removeEventListener('dblclick',listener);
        //impedeix jugar al jugador no actiu
        if(partida.actiu!=socket.id){return;}
        //emet tirada
        var pal=this.getAttribute('pal');
        var num=parseInt(this.getAttribute('num'));
        socket.emit('tirada',{partida_id:partida.creador, pal, num});
      });
    }
  }
});

socket.on('delegar',function(){
  var div_cantar=document.createElement('div');
  tapet.appendChild(div_cantar);
  div_cantar.classList.add('menu-cantar');
  div_cantar.innerHTML="<h5>T'han delegat. Selecciona triomf (doble-click)</h5>";

  //afegeix imatges asos de cada pal, buti
  ['oros','copes','espases','bastos','butifarra'].forEach(pal=>{
    var img=document.createElement('img');
    div_cantar.appendChild(img);
    img.title=pal;
    if(pal=='butifarra'){
      img.src="/img/butifarra.jpg";
    }else{
      img.src="/img/cartes/"+pal.substring(0,2)+"01.jpg";
    }
    img.addEventListener('dblclick',function(){
      socket.emit('triomf-triat',{creador:partida.creador,pal});
      div_cantar.parentNode.removeChild(div_cantar);
    });
  });
});

socket.on('triomf-triat',function(pal){
  if(pal=="delegar"){
    echo("s'ha delegat. Esperant company");
    return;
  }

  //si no és delegat, ja es pot començar
  partida.triomf=pal;
  echo(getUsername(partida.canta)+' ha cantat: '+pal);

  //seteja icona pal triat a triomf
  triomf.innerHTML="<img src='img/ico_"+pal.substring(0,2)+".jpg'>";
  triomf.style.visibility='visible';
});

socket.on('anuncia-qui-canta',function(sock_id){
  partida.canta=sock_id;
  var nick=getUsername(sock_id);
  echo("esperant que "+nick+" canti");
  //crea un menú per triar pal
  if(sock_id==socket.id){
    var div_cantar=document.createElement('div');
    tapet.appendChild(div_cantar);
    div_cantar.classList.add('menu-cantar');
    div_cantar.innerHTML="<h5>Selecciona triomf (doble-click)</h5>";

    //afegeix imatges asos de cada pal, buti i delegar
    ['oros','copes','espases','bastos','butifarra','delegar'].forEach(pal=>{
      var img=document.createElement('img');
      div_cantar.appendChild(img);
      img.title=pal

      if(pal=='butifarra'){
        img.src="/img/butifarra.jpg";
      }else if(pal=='delegar'){
        img.src="/img/delegar.jpg";
      }else{
        img.src="/img/cartes/"+pal.substring(0,2)+"01.jpg";
      }

      img.addEventListener('dblclick',function(){
        socket.emit('triomf-triat',{creador:partida.creador,pal});
        div_cantar.parentNode.removeChild(div_cantar);
      });
    });
  }
});

socket.on('repartir',function(cartes){
  ma.innerHTML="";
  ma_actual=cartes;
  //ordena la ma rebuda per pal (or,co,es,ba)
  ['or','co','es','ba'].forEach(pal=>{
    cartes
      .filter(c=>{return c.pal==pal})
      .forEach(c=>{
        var pal=c.pal;
        var num=(c.num<10)?"0"+c.num:c.num;
        ma.innerHTML+="<img class=carta pal="+pal+" num="+c.num+" src='/img/cartes/"+pal+num+".jpg'>";
      });
  });

  //amaga el botó començar
  var btn_start=document.querySelector('button.btn_start');
  if(btn_start)btn_start.parentNode.removeChild(btn_start);

  //comprova variable partida
  if(!partida){
    console.log('La partida no existeix');
    return;
  }

  //posa nom usuari sobre cada carta
  jugadorN.innerHTML=getUsername(partida.equips[1].jugadorN);
  jugadorS.innerHTML=getUsername(partida.equips[1].jugadorS);
  jugadorE.innerHTML=getUsername(partida.equips[2].jugadorE);
  jugadorO.innerHTML=getUsername(partida.equips[2].jugadorO);

  //posa atribut socket a cada carta
  jugadorN.setAttribute('socket',partida.equips[1].jugadorN);
  jugadorS.setAttribute('socket',partida.equips[1].jugadorS);
  jugadorE.setAttribute('socket',partida.equips[2].jugadorE);
  jugadorO.setAttribute('socket',partida.equips[2].jugadorO);
});

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
    div_partida.innerHTML+=" (jugadors: "+p.jugadors+"/4) ";
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
        btn.classList.add('btn_start');//cal fer desaparèixer després de repartir
        btn.setAttribute('onclick','socket.emit("start-partida")'); //no sé pq no funciona addEventListener
        btn.style.background='lightgreen';
      }
    }else if(p.jugadors<4){
      //afegeix botó unir-se
      var btn=document.createElement('button');
      div_partida.appendChild(btn);
      btn.classList.add('btn_join');
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

          if(id==p.creador){
            div_jugador.innerHTML+="(creador) ";
          }

          //afegeix botó "sortir de la partida"
          if(id==socket.id && p.creador!=socket.id){
            div_jugador.innerHTML+="<button onclick=socket.emit('exit-partida','"+p.creador+"')>sortir</button>";

            //amaga els botons "join"
            (function(){
              var btns=document.querySelectorAll('button.btn_join');
              for(var i=0;i<btns.length;i++){
                btns[i].parentNode.removeChild(btns[i]);
              }
            })();
          }
        }
      });
    })();
  });
});

//escolta event start-partida
socket.on('start-partida',function(sock_id){
  echo("començant partida '"+sock_id+"'");
  //get objecte partida
  partida=getPartida(sock_id);

  //creador demana iniciar ronda al servidor
  if(socket.id==partida.creador){
    socket.emit('start-ronda');
  }
});

/* Utils */

//log partida + status
function echo(missatge){
  log.innerHTML+="<div>-"+missatge+"</div>";
  log.scrollTop=log.scrollHeight;
  status_partida.innerHTML=missatge;
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
