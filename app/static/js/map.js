let map = L.map('map', {
  minZoom: 2.4,
  maxZoom: 18
}).setView([0, 0], 2.4);

let satelite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// Camada de sobreposição do OpenStreetMap
let openStreetMap = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    opacity: 0.5 
}).addTo(map);

// Adiciona o controle de busca (geocoder) ao mapa
L.Control.geocoder({
  defaultMarkGeocode: false
})
.on('markgeocode', function(e) {
  var bbox = e.geocode.bbox;
  map.fitBounds(bbox);
})
.addTo(map);

let ponto1 = null, ponto2 = null;
let marker1 = null, marker2 = null;
let routeLine = null; 

// Função para calcular pontos intermediários ao longo do grande círculo (rota direta)
function computeGreatCircle(p1, p2, numPoints) {
  let lat1 = p1.latitude * Math.PI / 180;
  let lon1 = p1.longitude * Math.PI / 180;
  let lat2 = p2.latitude * Math.PI / 180;
  let lon2 = p2.longitude * Math.PI / 180;
  
  let d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
  ));
  
  let points = [];
  for (let i = 0; i <= numPoints; i++) {
    let f = i / numPoints;
    let A = Math.sin((1 - f) * d) / Math.sin(d);
    let B = Math.sin(f * d) / Math.sin(d);
    let x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    let y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    let z = A * Math.sin(lat1) + B * Math.sin(lat2);
    let lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    let lon = Math.atan2(y, x);
    points.push({ latitude: lat * 180 / Math.PI, longitude: lon * 180 / Math.PI });
  }
  return points;
}

// Atualiza os dados de cada ponto usando a rota do backend
function updatePointInfo(lat, lon, pointNumber) {
  fetch(`/details?lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      const info = `Lat: ${data.latitude.toFixed(2)}
Lon: ${data.longitude.toFixed(2)}
Temp: ${data.temperatura}°C
Altitude: ${data.altitude} m
Local: ${data.local}
Hemisfério: ${data.hemisferio}`;
      if (pointNumber === 1) {
        document.getElementById("ponto1Info").innerText = info;
      } else if (pointNumber === 2) {
        document.getElementById("ponto2Info").innerText = info;
      }
    });
}

// Trata o clique no mapa para seleção dos pontos
map.on('click', function(e) {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;
  
  if (!ponto1) {
    ponto1 = { latitude: lat, longitude: lon };
    if (marker1) {
      marker1.setLatLng(e.latlng);
    } else {
      marker1 = L.marker(e.latlng).addTo(map);
    }
    updatePointInfo(lat, lon, 1);
    document.getElementById("ponto1Info").innerText += "\n(Ponto 1 selecionado)";
  } else if (!ponto2) {
    ponto2 = { latitude: lat, longitude: lon };
    if (marker2) {
      marker2.setLatLng(e.latlng);
    } else {
      marker2 = L.marker(e.latlng).addTo(map);
      const points = computeGreatCircle(ponto1, ponto2, 100);
      const latlngs = points.map(p => [p.latitude, p.longitude]);
      if (routeLine) {
        map.removeLayer(routeLine);
      }
      routeLine = L.polyline(latlngs, {
        color: 'blue',
        weight: 2,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(map);
    }
    updatePointInfo(lat, lon, 2);
    document.getElementById("ponto2Info").innerText += "\n(Ponto 2 selecionado)";
  } else {
    // Reinicia a seleção definindo novo Ponto 1 e removendo Ponto 2
    ponto1 = { latitude: lat, longitude: lon };
    ponto2 = null;
    if (marker1) {
      marker1.setLatLng(e.latlng);
    } else {
      marker1 = L.marker(e.latlng).addTo(map);
    }
    if (marker2) {
      map.removeLayer(marker2);
      marker2 = null;
    }
    document.getElementById("ponto2Info").innerText = "Clique no mapa para selecionar o Ponto 2";
    document.getElementById("resultadoInfo").innerText = "Distância e rota serão exibidos aqui";
    updatePointInfo(lat, lon, 1);
    document.getElementById("ponto1Info").innerText += "\n(Ponto 1 redefinido)";
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
  }
});

// Função para calcular a rota, de acordo com o tipo selecionado
function calcularRota() {
  if (!ponto1 || !ponto2) {
    document.getElementById("resultadoInfo").innerText = "Selecione dois pontos no mapa!";
    return;
  }
  
  const tipoRota = document.getElementById("rotaSelect").value;
  
  if (tipoRota === "direta") {
    // Rota direta (geodésica)
    fetch("/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ponto1: [ponto1.latitude, ponto1.longitude],
        ponto2: [ponto2.latitude, ponto2.longitude]
      })
    })
    .then(response => response.json())
    .then(data => {
      const info = `Distância: ${data.distancia_km.toFixed(2)} km
Ângulo: ${data.angulo_curvatura.toFixed(2)}°`;
      document.getElementById("resultadoInfo").innerText = info;
    });
    
    // Desenha a linha geodésica com pontos intermediários
    const points = computeGreatCircle(ponto1, ponto2, 100);
    const latlngs = points.map(p => [p.latitude, p.longitude]);
    if (routeLine) {
      map.removeLayer(routeLine);
    }
    routeLine = L.polyline(latlngs, {
      color: 'blue',
      weight: 2,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(map);
    
  } else if (tipoRota === "trafego") {
    // Rota via tráfego: utilizando a API OSRM para rotas de carro
    // O OSRM espera coordenadas no formato "lon,lat"
    const url = `http://router.project-osrm.org/route/v1/driving/${ponto1.longitude},${ponto1.latitude};${ponto2.longitude},${ponto2.latitude}?overview=full&geometries=geojson`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.code === "Ok") {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          if (routeLine) {
            map.removeLayer(routeLine);
          }
          routeLine = L.polyline(coords, {
            color: 'red',
            weight: 3,
            opacity: 0.9
          }).addTo(map);
          // Atualiza o painel com a distância (em km) e tempo estimado (em minutos)
          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.round(route.duration / 60);
          document.getElementById("resultadoInfo").innerText = `Distância: ${distance} km\nTempo estimado: ${duration} min`;
        } else {
          document.getElementById("resultadoInfo").innerText = "Não foi possível calcular a rota de tráfego.";
        }
      });
  }
}
