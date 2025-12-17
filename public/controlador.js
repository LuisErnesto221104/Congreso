const PUNTOS_CRITICIDAD = {
    "atropella": 30, "convulsion": 30, "inconsciente": 30, "envenena": 30, "agoniza": 25,
    "sangra": 15, "fractura": 15, "golpe": 10, "herid": 10, "maltrat": 10,
    "sarna": 5, "desnutrido": 5, "enfermo": 5, "abandon": 3
};

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
    const colores = { red: '#dc3545', orange: '#ffc107', blue: '#007bff' };
    const fill = colores[criticidad.color] || '#007bff';
    const svgIcon = `
        <svg width="36" height="46" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.1 0 0 8.1 0 18c0 12.4 18 29 18 29s18-16.6 18-29C36 8.1 27.9 0 18 0z" fill="${fill}" stroke="#fff" stroke-width="2"/>
            <circle cx="18" cy="18" r="7" fill="#fff"/>
        </svg>`;
    return L.divIcon({ html: svgIcon, iconSize: [36, 46], iconAnchor: [18, 46], popupAnchor: [0, -46], className: 'custom-marker-icon' });
}

function crearPopup(datos) {
    const criticidad = datos.criticidad;
    const colorFondo = criticidad.color === 'red' ? '#dc3545' : 
                        criticidad.color === 'orange' ? '#ffc107' : '#007bff';
    const colorTexto = criticidad.color === 'orange' ? '#000' : '#fff';
    
    let imgTag = '';
    if (datos.fotoURL) {
        imgTag = `<img src="${datos.fotoURL}" style="width:100%;max-width:250px;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`;
    }

    return `
        <div style="font-family:'Poppins', sans-serif; text-align:left; min-width: 200px;">
            ${imgTag}
            <h3 style="color:#007bff; margin:0 0 5px 0; font-size:18px;">${datos.nombre}</h3>
            
            <div style="background:${colorFondo}; color:${colorTexto}; padding:4px 10px; border-radius:15px; display:inline-block; font-size:12px; font-weight:bold; margin-bottom:10px;">
                ${criticidad.nivel}
            </div>

            <div style="font-size:13px; line-height:1.6; color:#444;">
                <div><strong>🐾 Especie:</strong> ${datos.especie} (${datos.raza})</div>
                <div><strong>🎂 Edad:</strong> ${datos.edad || 'Desconocida'}</div>
                <div><strong>❤ Condición:</strong> ${datos.condicion}</div>
                <div><strong>🧠 Comportamiento:</strong> ${datos.comportamiento || 'No especificado'}</div>
                <div><strong>📞 Teléfono:</strong> ${datos.telefono || 'No disponible'}</div>
            </div>
        </div>
    `;
}

async function cargarCasos() {
    try {
        const response = await fetch('/api/solicitudes');
        const rawData = await response.json();

        return rawData.map(caso => ({
            nombre: caso.nombre,
            especie: caso.especie,
            raza: caso.raza,
            condicion: caso.condicion,
            latitud: parseFloat(caso.latitud),
            longitud: parseFloat(caso.longitud),
            edad: caso.edad_animal,
            comportamiento: caso.comportamiento,
            telefono: caso.telefono,
            fotoURL: caso.foto_animal ? `/uploads/${caso.foto_animal}` : null,
            criticidad: calcularCriticidad(caso.condicion)
        }));
    } catch (error) {
        console.error("Error obteniendo casos:", error);
        return [];
    }
}

let mapCasos = null;

function inicializarMapa() {
    if (!mapCasos) {
        mapCasos = L.map('mapCasos').setView([19.43668, -100.35829], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19, attribution: '© OpenStreetMap'
        }).addTo(mapCasos);
    }
}

function mostrarCampos(tipo) {
    document.getElementById('campos_estudiante').classList.remove('active');
    document.getElementById('campos_veterinario').classList.remove('active');
    document.getElementById('campos_otro').classList.remove('active');

    if (tipo === 'estudiante_veterinaria') {
        document.getElementById('campos_estudiante').classList.add('active');
    } else if (tipo === 'veterinario') {
        document.getElementById('campos_veterinario').classList.add('active');
    } else if (tipo === 'otro_profesional') {
        document.getElementById('campos_otro').classList.add('active');
    }
}

async function mostrarVistaCasos() {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('casosView').classList.add('active');

    inicializarMapa();

    const casos = await cargarCasos();
    const tbody = document.getElementById('casosViewTableBody');

    if (casos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay casos registrados aún.</td></tr>`;
    } else {
        tbody.innerHTML = ''; 
        const group = L.featureGroup();

        casos.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.nombre}</td>
                <td>${c.especie} (${c.raza})</td>
                <td>${c.condicion} <span style="color:${c.criticidad.color};font-weight:bold">(${c.criticidad.nivel})</span></td>
                <td>${c.latitud.toFixed(4)}, ${c.longitud.toFixed(4)}</td>
            `;
            tr.style.cursor = 'pointer';
            tr.onclick = () => {
                mapCasos.setView([c.latitud, c.longitud], 16);
                marker.openPopup();
            };
            tbody.appendChild(tr);

            const marker = L.marker([c.latitud, c.longitud], { icon: crearIconoMarcador(c.criticidad) })
                .addTo(mapCasos)
                .bindPopup(crearPopup(c));
            group.addLayer(marker);
        });

        if (casos.length > 0) mapCasos.fitBounds(group.getBounds().pad(0.1));
    }

    setTimeout(() => mapCasos.invalidateSize(), 200);
}
document.getElementById('formVoluntario').addEventListener('submit', function (e) {
    e.preventDefault();

    alert("✅ ¡Registro exitoso! Ahora podrás ver los casos activos.");
    mostrarVistaCasos();
});

