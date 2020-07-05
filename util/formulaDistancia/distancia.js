const distancia = (lat1, lon1, lat2, lon2) => {
    let rad = function (x) { return x * Math.PI / 180; }
    var R = 6378.137; //Radio de la tierra en km 
    var dLat = rad(lat2 - lat1);
    var dLong = rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(lat1)) *
        Math.cos(rad(lat2)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    //aquí obtienes la distancia en metros por la conversion 1Km =1000m
    var d = R * c;
    return d;
}

const getDayOfWeek = (date)=> {
    const dayOfWeek = new Date(date).getDay();
    return isNaN(dayOfWeek) ? null : 
      ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][dayOfWeek];
}
  

module.exports = { distancia, getDayOfWeek }