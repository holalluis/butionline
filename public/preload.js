/*Preload media*/

/* Imatges:
  millor no fer preload
  pq tarda molt a carregar
  es millor que tardi una mica
  cada carta a la primera partida
*/

/* Sons */
var Sons={
  crear_partida: new Audio("snd/crear_partida.mp3"),
  et_toca:       new Audio("snd/et_toca.mp3"),
  join_partida:  new Audio("snd/join_partida.mp3"),
  menu_contrar:  new Audio("snd/menu_contrar.mp3"),
  recollir:      new Audio("snd/recollir.mp3"),
  start_partida: new Audio("snd/start_partida.mp3"),
  xat_entra:     new Audio("snd/xat_entra.mp3"),
  xat_surt:      new Audio("snd/xat_surt.mp3"),
  xat:           new Audio("snd/xat.mp3"),
  carta:{
    carta1:  new Audio("snd/carta1.mp3"),
    carta2:  new Audio("snd/carta2.mp3"),
    carta3:  new Audio("snd/carta3.mp3"),
    carta4:  new Audio("snd/carta4.mp3"),
    carta5:  new Audio("snd/carta5.mp3"),
    carta6:  new Audio("snd/carta6.mp3"),
    carta7:  new Audio("snd/carta7.mp3"),
    carta8:  new Audio("snd/carta8.mp3"),
    carta9:  new Audio("snd/carta9.mp3"),
    carta10: new Audio("snd/carta10.mp3"),
    play:function(){
      var n=Math.floor(Math.random()*10)+1;
      this['carta'+n].play();
    },
  },
};
