
const navInicio = document.getElementById('navInicio');
const navAyuda = document.getElementById('navAyuda');
const homeView = document.getElementById('homeView');
const helpView = document.getElementById('helpView');

let mapHome = null;
let mapForm = null;
let marcadorForm = null;
let marcadoresCasos = [];
let marcadoresForm = []; 

const PUNTOS_CRITICIDAD = {
    "atropella": 30, "convulsion": 30, "inconsciente": 30, "envenena": 30, "agoniza": 25, "parvovirus": 25, "dispar": 25,
    "sangra": 15, "fractura": 15, "golpe": 10, "herid": 10, "no mueve": 10, "no come": 10, "vomit": 10, "maltrat": 10,
    "sarna": 5, "desnutrido": 5, "enfermo": 5, "cojea": 5, "abandon": 3, "cachorro": 3
};

async function cargarCasosMysql() {
    try {
        const response = await fetch('/api/solicitudes');
        const casos = await response.json();

        const tbody = document.querySelector("#listaCasosTabla tbody");
        if (tbody.querySelector('.empty-state')) tbody.innerHTML = '';

        limpiarMarcadores();

        casos.forEach(caso => {
            const datos = {
                id: caso.id,
                nombre: caso.nombre,
                especie: caso.especie,
                raza: caso.raza,
                condicion: caso.condicion,
                latitud: parseFloat(caso.latitud),
                longitud: parseFloat(caso.longitud),
                telefono: caso.telefono,
                edad: caso.edad_animal,
                comportamiento: caso.comportamiento,
                fotoURL: caso.foto_animal ? `/uploads/${caso.foto_animal}` : null
            };

            datos.criticidad = calcularCriticidad(datos.condicion);
            const icono = crearIconoMarcador(datos.criticidad);
            const popupInfo = crearPopup(datos, datos.criticidad);

            if (mapHome) {
                const marker = L.marker([datos.latitud, datos.longitud], { icon: icono }).addTo(mapHome);
                marker.bindPopup(popupInfo);
                marcadoresCasos.push(marker);
            }

            if (mapForm) {
                const markerForm = L.marker([datos.latitud, datos.longitud], { icon: icono }).addTo(mapForm);
                markerForm.bindPopup(popupInfo);
                marcadoresForm.push(markerForm);
            }

            agregarCasoATabla(datos);
        });

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

function limpiarMarcadores() {
    if (mapHome) { marcadoresCasos.forEach(m => mapHome.removeLayer(m)); marcadoresCasos = []; }
    if (mapForm) { marcadoresForm.forEach(m => mapForm.removeLayer(m)); marcadoresForm = []; }
}

function agregarCasoATabla(datos) {
    if (document.getElementById(`fila-caso-${datos.id}`)) return; 

    const tabla = document.querySelector("#listaCasosTabla tbody");
    const tr = document.createElement("tr");
    tr.id = `fila-caso-${datos.id}`;

    const color = datos.criticidad.color === 'red' ? '#dc3545' : datos.criticidad.color === 'orange' ? '#ffc107' : '#007bff';
    const txtColor = datos.criticidad.color === 'orange' ? '#000' : '#fff';

    tr.innerHTML = `
        <td>${datos.nombre}</td>
        <td>${datos.especie}</td>
        <td>${datos.raza}</td>
        <td>
            ${datos.condicion} 
            <span style="background:${color}; color:${txtColor}; padding:2px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">
                ${datos.criticidad.nivel}
            </span>
        </td>
        <td>${datos.latitud.toFixed(4)}</td>
        <td>${datos.longitud.toFixed(4)}</td>
    `;

    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
        navInicio.click();
        setTimeout(() => { if (mapHome) mapHome.setView([datos.latitud, datos.longitud], 17); }, 300);
    });
    tabla.appendChild(tr);
}

function crearPopup(datos, criticidad) {
    const bg = criticidad.color === 'red' ? '#dc3545' : criticidad.color === 'orange' ? '#ffc107' : '#007bff';
    const color = criticidad.color === 'orange' ? '#000' : '#fff';
    
    let img = '';
    if (datos.fotoURL) {
        const src = datos.fotoURL.startsWith('http') ? datos.fotoURL : datos.fotoURL;
        img = `<img src="${src}" style="width:100%;max-width:250px;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`;
    }

    return `
        <div style="font-family:'Poppins', sans-serif; min-width:200px; text-align:left;">
            ${img}
            <h3 style="color:#007bff; margin:0 0 5px 0; font-size:18px;">${datos.nombre}</h3>
            
            <div style="background:${bg}; color:${color}; padding:4px 10px; border-radius:15px; display:inline-block; font-size:12px; font-weight:bold; margin-bottom:10px;">
                ${criticidad.nivel}
            </div>

            <div style="font-size:13px; line-height:1.6; color:#444;">
                <div><strong>🐾 Especie:</strong> ${datos.especie} (${datos.raza})</div>
                <div><strong>❤ Condición:</strong> ${datos.condicion}</div>
                <div><strong>🧠 Comportamiento:</strong> ${datos.comportamiento || 'No especificado'}</div>
                <div><strong>📞 Tel:</strong> ${datos.telefono}</div>
            </div>
        </div>
    `;
}

function calcularCriticidad(condicion) {
    const texto = (condicion || '').toLowerCase();
    let puntaje = 0;
    for (const [palabra, puntos] of Object.entries(PUNTOS_CRITICIDAD)) {
        if (texto.includes(palabra)) puntaje += puntos;
    }
    if (puntaje >= 20) return { nivel: 'CRÍTICO', color: 'red' };
    if (puntaje >= 8) return { nivel: 'URGENTE', color: 'orange' };
    if (puntaje > 0) return { nivel: 'MEDIO', color: 'blue' };
    return { nivel: 'ESTABLE', color: 'blue' };
}

function crearIconoMarcador(criticidad) {
    const colores = { 'red': '#dc3545', 'orange': '#ffc107', 'blue': '#007bff' };
    const svg = `<svg width="32" height="42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26c0-8.8-7.2-16-16-16z" fill="${colores[criticidad.color]}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`;
    return L.divIcon({ html: svg, iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42], className: 'custom-marker-icon' });
}

function initMapHome() {
    if (!mapHome) {
        mapHome = L.map('mapHome').setView([19.43668, -100.35829], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapHome);
        setTimeout(cargarCasosMysql, 500);
    }
}

function initMapForm() {
    if (!mapForm) {
        mapForm = L.map('mapForm').setView([19.43668, -100.35829], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapForm);

        mapForm.on('click', function (e) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            document.getElementById('coordeForm').innerHTML = `<i class="fa-solid fa-map-marker-alt"></i> Lat: ${lat} | Lon: ${lng}`;
            document.getElementById("latitud").value = lat;
            document.getElementById("longitud").value = lng;

            if (marcadorForm) mapForm.removeLayer(marcadorForm);
            const svgVerde = `<svg width="32" height="42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26c0-8.8-7.2-16-16-16z" fill="#28a745" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`;
            const iconoVerde = L.divIcon({ html: svgVerde, iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42], className: 'custom-marker-icon' });
            marcadorForm = L.marker([lat, lng], { icon: iconoVerde }).addTo(mapForm);
        });
        setTimeout(cargarCasosMysql, 500);
    }
}

navInicio.addEventListener('click', (e) => {
    e.preventDefault();
    homeView.classList.remove('hidden'); helpView.classList.remove('active');
    navInicio.classList.add('active'); navAyuda.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { initMapHome(); if (mapHome) mapHome.invalidateSize(); }, 100);
});

navAyuda.addEventListener('click', (e) => {
    e.preventDefault();
    homeView.classList.add('hidden'); helpView.classList.add('active');
    navAyuda.classList.add('active'); navInicio.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        initMapForm();
        if (mapForm) mapForm.invalidateSize();
        cargarCasosMysql();
    }, 100);
});

const form = document.getElementById('formSolicitud');
form.action = "/solicitud";
form.method = "POST";
form.enctype = "multipart/form-data";

form.addEventListener('submit', (e) => {
    if (!document.getElementById('latitud').value) {
        e.preventDefault();
        alert('⚠️ Selecciona la ubicación en el mapa.');
    }
});

window.addEventListener('load', () => setTimeout(initMapHome, 300));