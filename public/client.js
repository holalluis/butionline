/*DEBUG*/
var debug=true;
var debug=false;

/* Nou client socket
var socket=io.connect('http://164.132.111.240:4000'); //servidor
var socket=io.connect('http://192.168.001.130:4000'); //local
*/
var socket=io.connect('http://127.000.000.001:4000'); //loopback

/* Variables globals */
  var timeout_typing_event=false; //per event typing
  var timeout_recollir_event=false; //per recollir basa
  var usuari=socket.id; //nom usuari valor inicial
  var usuaris_actuals=[];
  var partida=null;
  var partides_actuals=[];
  var ma_actual=null; //array cartes [{num,pal,propietari}]


/* DOM handlers (ordenat per seccions) */
  var ico_loading=document.getElementById('ico_loading');
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
  //tapet
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
  var punts_e1=document.getElementById('punts_e1');
  var punts_e2=document.getElementById('punts_e2');
  var tipus_partida=document.getElementById('tipus_partida');
  var log=document.getElementById('log');


/* utils */
  //fx <body onload=init()>
  function init(){
    if(debug){
      //entrar automàticament
      btn_entrar.dispatchEvent(new CustomEvent('click'));
      //disable auto scroll
      if(history && ('scrollRestoration' in history)){
        history.scrollRestoration='manual';
      }
    }
    //amaga indicador loading
    ico_loading.parentNode.removeChild(ico_loading);
    //focus a canviar nom usuari
    nom_usuari.select();
  }

  //log partida + status
  function echo(missatge,afegir_a_log){
    afegir_a_log=afegir_a_log||false;
    //status
    status_partida.innerHTML=missatge;
    //log
    if(afegir_a_log){
      log.innerHTML+="<div>-"+missatge+"</div>";
      log.scrollTop=log.scrollHeight;
    }
  }

  //get nom usuari
  function getUsername(sock_id){
    var filtrat=usuaris_actuals.filter(u=>{return u.id==sock_id});
    if(filtrat.length){
      return filtrat[0].nom;
    }
    return false;
  }

  //get company
  function getCompany(sock_id){
    if     (sock_id==partida.equips[1].jugadorN) return partida.equips[1].jugadorS;
    else if(sock_id==partida.equips[1].jugadorS) return partida.equips[1].jugadorN;
    else if(sock_id==partida.equips[2].jugadorE) return partida.equips[2].jugadorO;
    else if(sock_id==partida.equips[2].jugadorO) return partida.equips[2].jugadorE;
    else
      return false;
  }

  //get partida (event 'start-partida')
  function getPartida(sock_id){
    var filtrat=partides_actuals.filter(p=>{return p.creador==sock_id});
    if(filtrat.length){
      return filtrat[0];
    }
    return false;
  }

  //mira si sock_id forma part de la partida p
  function isPart(p,sock_id){
    if([
        p.equips[1].jugadorN,
        p.equips[1].jugadorS,
        p.equips[2].jugadorE,
        p.equips[2].jugadorO,
      ].indexOf(sock_id)+1
    ){
      return true;
    }else{
      return false;
    }
  }

  function veure_ultima_basa(){
    if(!partida){return;}
    if(partida.bases.length==0){return;}

    var ultima=partida.bases[partida.bases.length-1];

    //menu veure basa
    var div=document.createElement('div');
    tapet.appendChild(div);
    div.classList.add('menu-cantar');
    div.innerHTML="<h5>Última basa</h5>";
    //imatges cartes
    ultima.forEach(c=>{
      var img=document.createElement('img');
      img.src="/img/cartes/"+c.pal+(c.num<10?"0"+c.num:c.num)+".jpg";
      div.appendChild(img);
    });
    //boto ok
    var btn=document.createElement('button');
    div.appendChild(btn);
    btn.style.display='block';
    btn.style.margin='auto';
    btn.innerHTML="ok";
    btn.addEventListener('click',function(){
      div.parentNode.removeChild(div);
    });
  }


/* Notificacions */
  var notif_pendent=false;
  function crea_notificacio(){
    if(notif_pendent==false){
      document.title="(1) "+document.title;
    }
    notif_pendent=true;
  }
  function esborra_notificacio(){
    if(notif_pendent){
      document.title=document.title.substring(4);
    }
    notif_pendent=false;
  }


/* Sons */
var Sons={
  xat:function(){
    var a=new Audio("snd/xat.mp3");
    a.play();
  },
  xat_entra:function(){
    var a=new Audio("snd/xat_entra.mp3");
    a.play();
  },
  xat_surt:function(){
    var a=new Audio("snd/xat_surt.mp3");
    a.play();
  },
  crear_partida:function(){
    var a=new Audio("snd/crear_partida.wav");
    a.play();
  },
  join_partida:function(){
    var a=new Audio("snd/join_partida.wav");
    a.play();
  },
  start_partida:function(){
    var a=new Audio("snd/start_partida.mp3");
    a.play();
  },
  menu_contrar:function(){
    var a=new Audio("snd/menu_contrar.mp3");
    a.play();
  },
  et_toca:function(){
    var a=new Audio("snd/et_toca.mp3");
    a.play();
  },
  carta:function(){
    var n=Math.floor(Math.random()*10)+1;
    var a=new Audio("snd/carta"+n+".wav");
    a.play();
  },
  recollir:function(){
    var a=new Audio("snd/recollir.mp3");
    a.play();
  },
};


/* DOM events */
  //btn crear partida
  btn_crear_partida.addEventListener('click',function(){
    //emet event crear_partida
    socket.emit('crear-partida');

    //reprodueix so
    Sons.crear_partida();
  });

  //btn entrar onclick
  btn_entrar.addEventListener('click',function(){
    //no facis res si nom està buit
    if(nom_usuari.value=="")return;

    //comprova si nom usuari ja existeix
    (function(){
      usuari=nom_usuari.value;
      while(usuaris_actuals.filter(u=>{return u.nom==usuari && u.id!=socket.id}).length){
        usuari=usuari+"2"; //modifica nom
        nom_usuari.value=usuari;
      }
    })();

    //canvia text botó
    btn_entrar.innerHTML="canviar nom";

    //canvia el <title></title>
    document.title="Botifarra - "+usuari;

    //si hi havia notif pendent posa-la un altre cop
    if(notif_pendent){
      document.title="(1) "+document.title;
    }

    //fes visible la pàgina
    document.getElementById('main').style.display='block';

    //emet event entrar
    socket.emit('entrar',usuari);

    //guarda usuari al cookie "nom_usuari"
    document.cookie="nom_usuari="+usuari;
  });

  //nom usuari onkeypress
  nom_usuari.addEventListener('keypress',function(e){
    //si prem enter envia el missatge
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 is enter
      btn_entrar.dispatchEvent(new CustomEvent('click'));
    }
  });

  //btn missatge onclick
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
    var key=e.which||e.keyCode;
    if(key===13){
      btn_missatge.dispatchEvent(new CustomEvent('click'));}
  });


/* Escolta events socket emesos pel servidor */
socket.on('partida-abandonada',function(){
  //1. missatge partida abandonada
  if(partida && partida.en_marxa){
    echo('Un jugador ha abandonat la partida.',true);
  }

  //esborra partida
  partida=null;

  //2. esborra menus cantar/contrar
  var menus=document.querySelectorAll('div.menu-cantar');
  for(var i=0;i<menus.length;i++){
    menus[i].parentNode.removeChild(menus[i]);}

  //3. esborra les cartes del tapet
  var cartes=document.querySelectorAll('#tapet img.carta');
  for(var i=0;i<cartes.length;i++){
    cartes[i].parentNode.removeChild(cartes[i]);}

  //4. marcadors de punts a 0
  punts_e1.innerHTML=0;
  punts_e2.innerHTML=0;

  //5. tipus partida reset
  tipus_partida="Partida NO contrada";
});

socket.on('anunci-multiplicador',function(m){
  partida.multiplicador=m;
  var msg;
  switch(m){
    case 1: msg="Partida NO contrada (x1)"; break;
    case 2: msg="Partida CONTRADA (x2)"; break;
    case 4: msg="Partida RECONTRADA (x4)"; break;
    case 8: msg="Partida SANT VICENÇ (x8)"; break;
  }
  tipus_partida.innerHTML=msg;
  echo(msg,true);
});

socket.on('esperant-santvicenç',function(){
  //crea menú santvicenç
  var div=document.createElement('div');
  tapet.appendChild(div);
  div.classList.add('menu-cantar');
  div.innerHTML="<h5>Els rivals han recontrat. Vols fer Sant Vicenç (x8)?</h5>";
  crea_notificacio();

  //reprodueix so
  Sons.menu_contrar();

  //afegir botons "Sí" i "No"
  var btn_y=document.createElement('button');
  var btn_n=document.createElement('button');
  div.appendChild(btn_y);
  div.appendChild(btn_n);
  btn_y.innerHTML="Sí";
  btn_n.innerHTML="No";
  btn_y.addEventListener('click',function(){
    socket.emit('santvicenç',{partida_id:partida.creador,santvicenç:true});
    div.parentNode.removeChild(div);
    esborra_notificacio();
  });
  btn_n.addEventListener('click',function(){
    socket.emit('santvicenç',{partida_id:partida.creador,santvicenç:false});
    div.parentNode.removeChild(div);
    esborra_notificacio();
  });
});

socket.on('esperant-recontro',function(){
  //crea menú recontrar
  var div=document.createElement('div');
  tapet.appendChild(div);
  div.classList.add('menu-cantar');
  div.innerHTML="<h5>Els rivals han contrat. Vols recontrar (x4)?</h5>";
  crea_notificacio();

  //reprodueix so
  Sons.menu_contrar();

  //afegir botons "Sí" i "No"
  var btn_y=document.createElement('button');
  var btn_n=document.createElement('button');
  div.appendChild(btn_y);
  div.appendChild(btn_n);
  btn_y.innerHTML="Sí";
  btn_n.innerHTML="No";
  btn_y.addEventListener('click',function(){
    socket.emit('recontrar',{partida_id:partida.creador,recontrar:true});
    div.parentNode.removeChild(div);
    esborra_notificacio();
  });
  btn_n.addEventListener('click',function(){
    socket.emit('recontrar',{partida_id:partida.creador,recontrar:false});
    div.parentNode.removeChild(div);
    esborra_notificacio();
  });
});

socket.on('esperant-contro',function(){
  //crea menú contrar
  var div=document.createElement('div');
  tapet.appendChild(div);
  div.classList.add('menu-cantar');
  div.innerHTML="<h5>Han cantat "+partida.triomf+". Vols contrar (x2)?</h5>";
  crea_notificacio();

  //reprodueix so
  Sons.menu_contrar();

  //afegir botons "Sí" i "No"
  var btn_y=document.createElement('button');
  var btn_n=document.createElement('button');
  div.appendChild(btn_y);
  div.appendChild(btn_n);
  btn_y.innerHTML="Sí";
  btn_n.innerHTML="No";
  btn_y.addEventListener('click',function(){
    socket.emit('contrar',{partida_id:partida.creador,contrar:true});
    div.parentNode.removeChild(div);
    esborra_notificacio();
  });
  btn_n.addEventListener('click',function(){
    socket.emit('contrar',{partida_id:partida.creador,contrar:false});
    div.parentNode.removeChild(div);
    esborra_notificacio();
  });

  //debug: click automàtic a no contrar
  if(debug){btn_n.dispatchEvent(new CustomEvent('click'));}
});

socket.on('ronda-acabada',function(punts){
  var e1=punts.equip1;
  var e2=punts.equip2;

  //echo fi ronda
  echo("<b>fi ronda. E1: "+e1+" punts, E2: "+e2+" punts</b>",true);

  //update objecte partida
  partida.equips[1].punts+=e1;
  partida.equips[2].punts+=e2;
  partida.bases=[];
  partida.delegada=false;

  //update view
  punts_e1.innerHTML=partida.equips[1].punts;
  punts_e2.innerHTML=partida.equips[2].punts;

  //check if partida acabada
  if(partida.equips[1].punts>=partida.objectiu || partida.equips[2].punts>=partida.objectiu){
    var p1=partida.equips[1].punts;
    var p2=partida.equips[2].punts;
    echo('<big><b>partida acabada ('+p1+' a '+p2+')</b></big>',true);

    //reset per poder recomençar partida
    partida.delegat=false;
    partida.en_marxa=false;
    partida.equips[1].punts=0;
    partida.equips[2].punts=0;
    partida.actiu=null;
    partida.basa=[];
    partida.bases=[];
    partida.canta=null;
    partida.hanRecollit=0;
    partida.multiplicador=null;
    partida.triomf=null;

    //update view
    punts_e1.innerHTML=0;
    punts_e2.innerHTML=0;
    tipus_partida.innerHTML="Partida NO contrada";

    //final partida
    return;
  }

  //creador demana iniciar següent ronda
  if(socket.id==partida.creador){socket.emit('start-ronda');}
});

socket.on('recollir-basa',function(){
  //recollir basa automàtic en x segons
  var segons_espera=5;

  echo('Recull la basa fent click al tapet ('+segons_espera+'s)');
  crea_notificacio();

  //listener click tapet recollir
  tapet.addEventListener('click',function recollir(){
    this.removeEventListener('click',recollir);
    clearTimeout(timeout_recollir_event);

    var cartes=document.querySelectorAll('#tapet div.jugador img');
    for(var i=0;i<cartes.length;i++){
      var c=cartes[i];
      c.parentNode.removeChild(c);
    }
    echo('Esperant que tothom reculli la basa',true);
    socket.emit('basa-recollida',partida.creador);
    esborra_notificacio();

    //reprodueix so
    Sons.recollir();
  });

  //timeout: recollir basa automàtic en x segons
  timeout_recollir_event=setTimeout(function(){
    tapet.dispatchEvent(new CustomEvent('click'));
  },segons_espera*1000);

  //treu ressaltat jugador actiu
  var actiu=document.querySelector('div.jugador.actiu');
  if(actiu){actiu.classList.remove('actiu');}

  //guarda la basa
  partida.bases.push(partida.basa);

  //buida la basa
  partida.basa=[];

  //debug: recollir basa automàtic
  if(debug){
    tapet.dispatchEvent(new CustomEvent('click'));
  }
});

socket.on('tirada-legal',function(data){
  var id=data.jugador_id;
  var pal=data.pal;
  var num=data.num;

  echo(getUsername(id)+" ha jugat una carta",true);

  //fes apareixer carta al tapet
  var carta=document.querySelector("#tapet div.jugador[socket='"+id+"']");
  if(carta) carta.innerHTML+="<img src='/img/cartes/"+pal+(num<10?'0'+num:num)+".jpg'>";

  //afegeix carta a basa
  partida.basa.push({pal,num});

  //treu carta de la ma
  if(id==socket.id){
    var carta=document.querySelector('#ma img.carta[pal='+pal+'][num="'+num+'"]');

    //elimina la carta
    if(carta) carta.parentNode.removeChild(carta);

    //deixa de ser jugador actiu
    partida.actiu=null;

    //treu carta de la ma actual
    ma_actual=ma_actual.filter(c=>{
      return c.pal!=pal || c.num!=num;
    });
  }

  //reprodueix so
  Sons.carta();
});

socket.on('esperant-tirada',function(jugador_id){
  //jugador actiu
  partida.actiu=jugador_id;

  //get nick jugador actiu
  var nick=getUsername(jugador_id);
  if(socket.id==jugador_id){
    echo("ÉS EL TEU TORN! Juga una carta");
    crea_notificacio();

    //reprodueix so
    Sons.et_toca();

    //mini animació per cridar atenció
    status_partida.style.transition='background 1s';
    status_partida.style.background='yellow';
    setTimeout(function(){status_partida.style.background='lightgreen';},1000);
    //fi animació
  }else{
    echo("Esperant "+nick);
  }
  //futur: posa un so per indicar que et toca

  //treu ressaltat jugador actiu
  var actiu=document.querySelector('div.jugador.actiu');
  if(actiu){actiu.classList.remove('actiu');}

  //posa emfasi al nou jugador actiu
  var carta=document.querySelector("#tapet div.jugador[socket='"+jugador_id+"']");
  if(carta) carta.classList.add('actiu');

  //gestiona els listeners del clic per les cartes de la mà
  var cartes=document.querySelectorAll('#ma img.carta');

  //elimina listeners de totes les cartes fent click
  var temp_id=partida.actiu;
  partida.actiu=null;
  for(var i=0;i<cartes.length;i++){
    cartes[i].dispatchEvent(new CustomEvent('click'));
    cartes[i].classList.remove('legal');
  }
  partida.actiu=temp_id;

  //posa listeners a les cartes permeses del jugador actiu
  if(socket.id==partida.actiu){
    //NORMES OBLIGAR A TIRAR
    function es_legal(carta){
      /*inputs:
          ma_actual
          partida.triomf
          pal inicial
      */
      //casos extrems on no cal ni mirar la carta
      if(ma_actual.length==1 || partida.basa.length==0){return true;}

      //info necessària
      var triomf=partida.triomf.substring(0,2);
      var basa=partida.basa;

      //tradueix manilla i as per poder comparar números
      //cal desfer un cop acabada la funció
      ma_actual.concat(basa).concat(carta).forEach(c=>{
        if(c.num==1) c.num=13;
        if(c.num==9) c.num=14;
      });

      //info necessària
      //pal inicial, falles pal inicial i falles triomf (bool)
      var pal_inicial=basa[0].pal;
      var falles_p=ma_actual.filter(c=>{return c.pal==pal_inicial}).length==0;
      var falles_t=ma_actual.filter(c=>{return c.pal==triomf}).length==0;

      //determina qui guanya entre 2 primeres cartes tirades
      function qui_guanya(c0,c1){
        //mateix pal
        if(c0.pal==c1.pal){
          return (c0.num>c1.num) ? 0:1; //carta alta
        }else{//pal diferent
          if     (c0.pal==triomf){return 0;}
          else if(c1.pal==triomf){return 1;}
          else{
            //cap dels dos és triomf: guanya el 0
            return 0;
          }
        }
      }

      //determina qui guanya entre 3 primeres cartes tirades
      function qui_guanya2(c0,c1,c2){
        var i=qui_guanya(c0,c1);//index de la basa
        if(qui_guanya(basa[i],c2)==0){
          return i;
        }else{
          return 2;
        }
      }

      //determina si cal matar (bool)
      var cal_matar=(function(){
        if     (basa.length==1){return true;} //a la 2na carta sempre s'ha de matar
        else if(basa.length==2){              //a la 3ra carta no sempre cal matar
          if(qui_guanya(basa[0],basa[1])==0){return false;} //guanya el company: no cal matar
          else{                              return true; } //guanya el rival: cal matar
        }else if(basa.length==3){ //a la quarta carta no sempre cal matar
          if(qui_guanya2(basa[0],basa[1],basa[2])==1){
            return false;} //guanya el company: no cal matar
          else{
            return true;} //guanya algun rival: cal matar
        }
      })();

      /*ALGORITME*/
      //BASA == 1 CARTA OK
      if(basa.length==1){
        if(falles_p==false){//=no fallo
          //pots matar la carta?
          var pots_matar=ma_actual.filter(c=>{return c.pal==pal_inicial && c.num>basa[0].num}).length>0;
          if(pots_matar){
            //no fallo i puc matar: qualsevol carta del pal inicial que mati la primera
            return (carta.pal==pal_inicial && carta.num>basa[0].num)
          }else{
            //no fallo i no puc matar: la més petita
            return (
              carta.pal==pal_inicial &&
              carta.num==Math.min.apply(null,ma_actual.filter(c=>{return c.pal==pal_inicial}).map(c=>{return c.num}))
            );
          }
        }else{//=fallo
          if(falles_t){//=no tens triomf
            return true;//descarte
          }else{//tens triomf
            return carta.pal==triomf;
          }
        }
      }

      //BASA == 2 CARTES OK
      if(basa.length==2){
        if(falles_p==false){//=no fallo
          if(cal_matar==false){//=no cal matar
            //no fallo i no cal matar: qualsevol carta del pal inicial
            return carta.pal==pal_inicial;
          }else{//cal matar
            //pots matar la segona carta?
            var pots_matar=ma_actual.filter(c=>{
              //només si és del pal inicial i la tinc més gran
              return c.pal==pal_inicial && basa[1].pal==pal_inicial && c.num>basa[1].num
            }).length>0;

            if(pots_matar){
              //no fallo, cal matar i puc matar:
              //carta del pal més alta que la guanyadora
              return (carta.pal==pal_inicial && carta.num>basa[1].num);
            }else{
              //no fallo i no puc matar: la més petita
              return (
                carta.pal==pal_inicial &&
                carta.num==Math.min.apply(null,ma_actual.filter(c=>{return c.pal==pal_inicial}).map(c=>{return c.num}))
              );
            }
          }
        }else{//=fallo
          if(falles_t){//=no tens triomf
            return true;//fallo i no trinc triomf: qualsevol carta
          }else{//=tens triomf
            if(cal_matar==false){
              return true;//fallo i tinc triomf però no cal matar: qualsevol carta
            }else{//=cal matar
              //pots matar la segona carta?
              var pots_matar=ma_actual.filter(c=>{
                return (
                  //si jo tinc triomf i ell no
                  (c.pal==triomf && basa[1].pal!=triomf) ||
                  //o si la segona és triomf i jo la tinc més gran
                  (c.pal==triomf && basa[1].pal==triomf && c.num>basa[1].num)
                )
              }).length>0;

              if(pots_matar){
                //fallo, tinc triomf, cal matar i puc matar
                return (
                  //si la segona carta no és triomf i la meva sí
                  (carta.pal==triomf && basa[1].pal!=triomf) ||
                  //o si la segona carta és triomf i jo la tinc més alta
                  (carta.pal==triomf && basa[1].pal==triomf && carta.num>basa[1].num)
                )
              }else{
                //fallo, trinc triomf i no puc matar: qualsevol carta
                return true;
              }
            }
          }
        }
      }

      //BASA == 3 CARTES OK
      //troba la carta guanyadora
      var cg=basa[qui_guanya2(basa[0],basa[1],basa[2])];
      if(basa.length==3){
        if(falles_p==false){//=no fallo
          if(cal_matar==false){//=no cal matar
            //no fallo i no cal matar: qualsevol carta del pal inicial
            return carta.pal==pal_inicial;
          }else{//cal matar
            //pots matar la guanyadora?
            var pots_matar=ma_actual.filter(c=>{
              //només si és del pal inicial i la tinc més gran
              return c.pal==pal_inicial && cg.pal==pal_inicial && c.num>cg.num
            }).length>0;
            if(pots_matar){
              //no fallo, cal matar i puc matar:
              //carta del pal més alta que la guanyadora
              return (carta.pal==pal_inicial && carta.num>cg.num);
            }else{
              //no fallo i no puc matar: la més petita
              return (
                carta.pal==pal_inicial &&
                carta.num==Math.min.apply(null,ma_actual.filter(c=>{return c.pal==pal_inicial}).map(c=>{return c.num}))
              );
            }
          }
        }else{//=fallo
          if(falles_t){//=no tens triomf
            return true;//fallo i no trinc triomf: qualsevol carta
          }else{//=tens triomf
            if(cal_matar==false){
              return true;//fallo i tinc triomf però no cal matar: qualsevol carta
            }else{//=cal matar
              //pots matar la guanyadora?
              var pots_matar=ma_actual.filter(c=>{
                return (
                  //si jo tinc triomf i ell no
                  (c.pal==triomf && cg.pal!=triomf) ||
                  //o si la guanyadora és triomf i jo la tinc més gran
                  (c.pal==triomf && cg.pal==triomf && c.num>cg.num)
                )
              }).length>0;

              if(pots_matar){
                //fallo, tinc triomf, cal matar i puc matar
                return (
                  //si la guanyadora no és triomf i la meva sí
                  (carta.pal==triomf && cg.pal!=triomf) ||
                  //o si la guanyadora és triomf i jo la tinc més alta
                  (carta.pal==triomf && cg.pal==triomf && carta.num>cg.num)
                )
              }else{
                //fallo, trinc triomf i no puc matar: qualsevol carta
                return true;
              }
            }
          }
        }
      }

      //no es pot arribar mai aquí
      console.error("error normes obligar: apunta la basa");
      return true;
    };

    //recorre totes les cartes de la ma
    for(var i=0;i<cartes.length;i++){
      var pal=cartes[i].getAttribute('pal');
      var num=parseInt(cartes[i].getAttribute('num'));

      //comprova si seria legal jugar la carta
      var jugada_legal=es_legal({num,pal});
      //desfer canvis valor manilla i as
      ma_actual.concat(partida.basa).forEach(c=>{
        if(c.num==13) c.num=1;
        if(c.num==14) c.num=9;
      });

      //si no es legal STOP
      if(!jugada_legal){continue;}

      //la carta és legal: posa indicador
      cartes[i].classList.add('legal');

      //listener jugar carta
      function listener_tirar(){
        this.removeEventListener('click',listener_tirar);

        //frena jugador no actiu
        if(partida.actiu!=socket.id){return;}

        //només pots tirar cartes no preseleccionades
        if(false==this.classList.contains('preseleccionada')){return;}

        //emet tirada
        var pal=this.getAttribute('pal');
        var num=this.getAttribute('num');
        num=parseInt(num);
        socket.emit('tirada',{partida_id:partida.creador,pal,num});
        esborra_notificacio();
      };

      //afegeix listener per preseleccionar carta
      cartes[i].addEventListener('click',function listener_preseleccio(){
        this.removeEventListener('click',listener_preseleccio);

        //frena jugador no actiu
        if(partida.actiu!=socket.id){return;}

        //listener per jugar carta preseleccionada
        this.addEventListener('click',listener_tirar);

        //treu preseleccionada a totes
        (function(){
          var cartes_pre=document.querySelectorAll('#ma img.carta.preseleccionada');
          for(var j=0;j<cartes_pre.length;j++){
            cartes_pre[j].classList.remove('preseleccionada');
            cartes_pre[j].removeEventListener('click',listener_tirar);
            cartes_pre[j].addEventListener('click',listener_preseleccio);
          }
        })();

        //afegeix classe preseleccionada a la carta clicada
        this.classList.add('preseleccionada');

        //reprodueix so
        Sons.carta()
      });
    }
    //debug: tira automàticament carta random
    //if(debug){cartes[0].dispatchEvent(new CustomEvent('click'));}
  }
});

socket.on('delegar',function(){
  //crea menu delegar
  var div=document.createElement('div');
  tapet.appendChild(div);
  div.classList.add('menu-cantar');
  div.innerHTML="<h5>T'han delegat. Selecciona triomf (click)</h5>";
  crea_notificacio();

  //afegeix imatges asos de cada pal i buti
  ['oros','copes','espases','bastos','botifarra'].forEach(pal=>{
    var img=document.createElement('img');
    div.appendChild(img);
    img.title=pal;
    if(pal=='botifarra'){
      img.src="/img/botifarra.jpg";
    }else{
      img.src="/img/cartes/"+pal.substring(0,2)+"01.jpg";
    }
    img.addEventListener('click',function(){
      socket.emit('triomf-triat',{creador:partida.creador,pal});
      div.parentNode.removeChild(div);
      esborra_notificacio();
    });
  });
});

socket.on('triomf-triat',function(pal){
  //missatge esperant delegat
  var nick_delegat=getUsername(getCompany(partida.canta));
  if(pal=="delegar"){
    echo("S'ha delegat. Esperant que "+nick_delegat+" canti",true);
    partida.delegat=true;
    return;
  }

  //mostra pal triat
  partida.triomf=pal;
  var cantant = partida.delegat ? nick_delegat+" (DELEGAT)" : getUsername(partida.canta);
  echo(cantant+' ha cantat '+pal+'. Esperant si es contra',true);

  //posa icona pal triat a element triomf
  triomf.innerHTML="<img src='img/ico_"+pal.substring(0,2)+".jpg'>";
  triomf.style.visibility='visible';

  //visible boto veure_ultima_basa
  document.getElementById('veure_ultima_basa').style.visibility='visible';
});

socket.on('anuncia-qui-canta',function(sock_id){
  partida.canta=sock_id;
  var nick=getUsername(partida.canta);
  echo("Esperant que "+nick+" canti");

  //crea menú triar pal
  if(sock_id==socket.id){
    var div=document.createElement('div');
    tapet.appendChild(div);
    div.classList.add('menu-cantar');
    div.innerHTML="<h5>Selecciona triomf (click)</h5>";
    crea_notificacio();

    //afegeix: imatges asos de cada pal, buti i delegar
    ['oros','copes','espases','bastos','botifarra','delegar'].forEach(pal=>{
      var img=document.createElement('img');
      div.appendChild(img);
      img.title=pal;

      if(pal=='botifarra'){
        img.src="/img/botifarra.jpg";
      }else if(pal=='delegar'){
        img.src="/img/delegar.jpg";
      }else{
        img.src="/img/cartes/"+pal.substring(0,2)+"01.jpg";
      }

      //listener dir al servidor què cantes
      img.addEventListener('click',function(){
        socket.emit('triomf-triat',{creador:partida.creador,pal});
        div.parentNode.removeChild(div);
        esborra_notificacio();
      });

      //debug: canta oros sempre
      if(debug && pal=='oros'){img.dispatchEvent(new CustomEvent('click'));}
    });
  }
});

socket.on('repartir',function(cartes){
  ma.innerHTML="";
  ma_actual=cartes;

  //ordena ma rebuda per pal (or,co,es,ba)
  ['or','co','es','ba'].forEach(pal=>{
    cartes
      .filter(c=>{return c.pal==pal})
      .filter(c=>{
        if(c.num==1){c.num=13;}
        if(c.num==9){c.num=14;}
        return true;
      })
      .sort((c1,c2)=>{return c2.num-c1.num})
      .filter(c=>{
        if(c.num==13){c.num=1;}
        if(c.num==14){c.num=9;}
        return true;
      })
      .forEach(c=>{
        var pal=c.pal;
        var num=(c.num<10)?"0"+c.num:c.num;
        ma.innerHTML+="<img class=carta pal="+pal+" num="+c.num+" src='/img/cartes/"+pal+num+".jpg'>";
      });
  });

  //amaga botó començar
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
    "["+data.data.substring(0,5)+"] "+
    "<em>"+data.nom+" ha entrat al xat</em>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;

  //reprodueix so
  Sons.xat_entra();
});

socket.on('sortir',function(data){
  xat.innerHTML+="<div style=color:red title='"+data.id+"'>"+
    "["+data.data.substring(0,5)+"] "+
    "<em>"+data.nom+" ha sortit del xat</em>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;

  //reprodueix so
  Sons.xat_surt();
});

socket.on('canvi-nom',function(data){
  xat.innerHTML+="<div style=color:green title='"+data.id+"'>"+
    "["+data.data.substring(0,5)+"] "+
    "<em>"+data.antic+" ara és "+data.nou+"</em>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;

  //canvia el nom del tapet si s'escau
  var div_jugador=document.querySelector('div.jugador[socket="'+data.id+'"]');
  if(div_jugador){
    div_jugador.firstChild.nodeValue=data.nou;
  }
});

socket.on('typing',function(nick){
  var str="<small>("+nick+" està escrivint...)</small>";
  feedback.innerHTML=str;
  //elimina el missatge al cap d'uns segons
  clearTimeout(timeout_typing_event);
  timeout_typing_event=setTimeout(function(){feedback.innerHTML=""},5000);
});

socket.on('xat',function(data){
  feedback.innerHTML="";
  xat.innerHTML+="<div>"+
    "["+data.data.substring(0,5)+"] "+
    "<strong>"+data.nick+"</strong>: "+
    "<span>"+data.missatge+"</span>"+
  "</div>";
  //scroll al top
  xat.scrollTop=xat.scrollHeight;

  //reprodueix so
  Sons.xat();
});

socket.on('refresca-usuaris',function(usuaris_connectats){
  comptador_usuaris.innerHTML=usuaris_connectats.length;
  usuaris_actuals=usuaris_connectats;
  usuaris.innerHTML="";
  usuaris_connectats.forEach(u=>{
    var nom=u.nom;
    if(u.id==socket.id){
      nom="<b>"+nom+"</b>";}
    usuaris.innerHTML+='<li title='+u.id+'>'+nom+'</li>';
  });
});

socket.on('refresca-partides',function(partides_arr){
  //update array partides_actuals
  partides_actuals=partides_arr;

  //actualitza comptador partides
  comptador_partides.innerHTML=partides_arr.length;
  partides.innerHTML="";
  if(partides_arr.length==0){
    partides.innerHTML="<small><i style=color:#666>~no hi ha partides</i></small>";
  }

  //mira si el client està dins alguna una partida
  var esta_dins_una_partida=(function(){
    for(var i=0; i<partides_actuals.length; i++){
      if(isPart(partides_actuals[i],socket.id)){
        return true;
      }
    }
    return false;
  })();

  //amaga o mostra el botó crear partida
  if(esta_dins_una_partida){
    btn_crear_partida.style.visibility='hidden';
  }else{
    btn_crear_partida.style.visibility='visible';
  }

  //recorre les partides
  partides_arr.forEach((p,i)=>{
    //div partida
    var div_partida=document.createElement('div');
    partides.appendChild(div_partida);
    div_partida.style.fontSize='smaller';
    div_partida.innerHTML+="Partida "+(i+1);
    div_partida.innerHTML+=" (jugadors: "+p.jugadors+"/4) ";

    //pinta verd si hi ha lloc (<4)
    if(p.jugadors<4){div_partida.style.color='green';}

    //si el client és el creador
    if(p.creador==socket.id){
      //afegeix botó esborrar partida
      (function(){
        var btn=document.createElement('button');
        div_partida.appendChild(btn);
        btn.innerHTML='esborrar';
        //no sé pq no funciona addEventListener
        btn.setAttribute('onclick','socket.emit("esborrar-partida")');
      })();

      //afegeix botó començar
      if(p.jugadors==4){
        div_partida.innerHTML+=" ";
        /*
          //FUTUR: CREA SELECT TRIAR PUNTS (51, 101, 151)
          (function(){
            var select=" <select id=select_punts><option>51<option selected>101<option>151</select> ";
            div_partida.innerHTML+=select;
          })();
        */

        //crea btn començar
        if(p.en_marxa==false){
          var btn=document.createElement('button');
          div_partida.appendChild(btn);
          btn.innerHTML='començar';
          btn.classList.add('btn_start');
          //no sé pq no funciona addEventListener
          btn.setAttribute('onclick','socket.emit("start-partida");if(debug){status_partida.onclick();}');
          btn.style.background='lightgreen';
        }
      }
    }else if(p.jugadors<4 && partida==null && esta_dins_una_partida==false){
      //afegeix botó unir-se
      var btn=document.createElement('button');
      div_partida.appendChild(btn);
      btn.classList.add('btn_join');
      btn.innerHTML='unir-se';
      btn.setAttribute('onclick','socket.emit("join-partida","'+p.creador+'");if(debug){status_partida.onclick();};Sons.join_partida()'); //no sé pq no funciona addEventListener
    }

    //llista jugadors partida i posa botó per sortir partida
    (function(){
      [
        p.equips[1].jugadorN,
        p.equips[1].jugadorS,
        p.equips[2].jugadorE,
        p.equips[2].jugadorO,
      ].forEach(id=>{
        var nick=getUsername(id); //pot ser socket id o "null"
        if(!nick){return;}

        //crea div jugador
        var div_jugador=document.createElement('div');
        div_partida.appendChild(div_jugador)
        div_jugador.style.fontSize='smaller';
        div_jugador.innerHTML="- "+nick+" ";
        if(id==p.creador){div_jugador.innerHTML+="(creador) ";}

        //afegeix botó "sortir de la partida"
        if(id==socket.id && p.creador!=socket.id){
          div_jugador.innerHTML+="<button onclick=socket.emit('exit-partida','"+p.creador+"')>sortir</button>";
        }
      });
    })();

    //mini detall estètic
    partides.innerHTML+='<hr>';
  });
});

socket.on('start-partida',function(sock_id){
  //reset log
  log.innerHTML='';

  //log i status
  echo("Començant partida '"+sock_id+"'",true);

  //get objecte partida
  partida=getPartida(sock_id);

  //inicia partida
  partida.en_marxa=true;

  //creador demana al servidor iniciar ronda
  if(socket.id==partida.creador){
    socket.emit('start-ronda');
  }

  //reprodueix so
  Sons.start_partida();
});
