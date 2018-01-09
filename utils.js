/* UTILS / tools */

//1. obtenir nom usuari a partir del socket id
function getUsername(usuaris,sock_id)
{
  var filtrats=usuaris.filter(u=>{return u.id==sock_id});
  if(filtrats.length){
    return filtrats[0].nom;
  }
  return false;
}

//2. crea date string
function novaData()
{
  return (new Date).toISOString().substr(11,8);
}

//3. get partida by sock id creador
function getPartida(partides,sock_id)
{
  var filtrats=partides.filter(p=>{return p.creador==sock_id});
  if(filtrats.length){
    return filtrats[0];
  }
  console.log('Partida ('+sock_id+') no existeix');
  return false;
}

//export
module.exports={
  getUsername,
  novaData,
  getPartida,
}
