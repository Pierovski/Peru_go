"use strict";

const tituloDepartamento = document.getElementById('titulo-departamento');
const btnVolver = document.getElementById('btn-volver');
const pantallaInfo = document.getElementById('pantalla-info');
const tarjetaContenidoInfo = document.querySelector('.info-contenido'); 
const tituloInfoProvincia = document.getElementById('info-provincia-titulo');
const contenedorLugares = document.getElementById('info-lugares');
const btnCerrarInfo = document.getElementById('btn-cerrar-info');

const btnIngresar = document.getElementById('btn-ingresar');
const inputPass = document.getElementById('pass');
const pantallaAcceso = document.getElementById('pantalla-acceso');
const contenedorMapa = document.getElementById('map');
const btnMute = document.getElementById('btn-mute');
const avatarGuia = document.getElementById('avatar-guia');
const tituloMapa = document.getElementById('titulo-mapa');
const contenedorProgreso = document.getElementById('contenedor-progreso');
const barraRelleno = document.getElementById('barra-relleno');
const mascotaProgreso = document.getElementById('mascota-progreso');
const textoProgreso = document.getElementById('texto-progreso');

let capaNacional; 
let capaProvincias; 
let datosProvinciasGenerales = null; 
let mapa;
let datosGeoJSON = null;
let datosViajes = {}; 

const coloresChichaPremium = [
    "#FF1493", "#00FA9A", "#FFD700", "#00FFFF", "#FF4500", "#9400D3"
];

const audios = [
    './assets/audio/musica-uno.mp3', 
    './assets/audio/musica-dos.mp3', 
    './assets/audio/musica-tres.mp3'
];
const audioAmbiental = new Audio();

function reproducirMusicaAleatoria() {
    const cancion = audios[Math.floor(Math.random() * audios.length)];
    audioAmbiental.src = cancion;
    audioAmbiental.play().catch(() => console.log("Audio bloqueado por el navegador"));
}
audioAmbiental.addEventListener('ended', reproducirMusicaAleatoria);


function inicializarMapa() {
    mapa = L.map('map', {
        zoomControl: false, dragging: true, scrollWheelZoom: true,
        doubleClickZoom: false, touchZoom: true, attributionControl: false
    }).setView([-9.5, -75.01], 5.0);

    Promise.all([
        fetch('./data/mis_viajes.json').then(res => res.json()).catch(() => ({})),
        fetch('./data/peru_provincial_simple.geojson').then(res => res.json()),
        fetch('./data/peru_departamental_simple.geojson').then(res => res.json())
    ]).then(([viajes, provs, deps]) => {
        
        // PROGRAMACIÓN DEFENSIVA: Limpieza del JSON de tus viajes
        datosViajes = {};
        for (let clave in viajes) {
            let claveLimpia = clave.trim().toUpperCase(); // Quita espacios y fuerza mayúsculas
            datosViajes[claveLimpia] = viajes[clave];
        }

        datosProvinciasGenerales = provs;
        datosGeoJSON = deps;

        dibujarMapaNacional();
        actualizarProgresoGlobal(); 
    }).catch(err => console.log("Error de carga:", err));
}

function dibujarMapaNacional() {
    capaNacional = L.geoJSON(datosGeoJSON, {
        style: function (feature) {
            // PROGRAMACIÓN DEFENSIVA
            const nombreDepLimpio = feature.properties.NOMBDEP.trim().toUpperCase();
            const provsDelDep = datosProvinciasGenerales.features.filter(p => 
                p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio
            );
            
            let tieneVisita = false;
            for(let p of provsDelDep) {
                let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
                if(datosViajes[provLimpia] && datosViajes[provLimpia].length > 0) {
                    tieneVisita = true; break;
                }
            }

            if (tieneVisita) {
                const c = coloresChichaPremium[nombreDepLimpio.length % coloresChichaPremium.length];
                return { color: "#FFFFFF", weight: 1.5, fillColor: c, fillOpacity: 0.8 };
            } else {
                return { color: "#f1c40f", weight: 1, fillColor: "transparent", fillOpacity: 0 };
            }
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function () {
                const nombreDep = feature.properties.NOMBDEP;
                const nombreDepLimpio = nombreDep.trim().toUpperCase();
                
                layer.setStyle({ color: "#00FFFF", weight: 3 });

                setTimeout(() => {
                    mapa.removeLayer(capaNacional);

                    const filtradas = {
                        type: "FeatureCollection",
                        features: datosProvinciasGenerales.features.filter(p => 
                            p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio
                        )
                    };

                    capaProvincias = L.geoJSON(filtradas, {
                        style: function(fProv) {
                            const c = coloresChichaPremium[fProv.properties.NOMBPROV.length % coloresChichaPremium.length];
                            return { color: c, weight: 2, fillColor: "#000", fillOpacity: 0.6 };
                        },
                        onEachFeature: function(fP, lP) {
                            const nombreProv = fP.properties.NOMBPROV;
                            const colorAsignado = coloresChichaPremium[nombreProv.length % coloresChichaPremium.length];
                            
                            lP.bindTooltip(`<span style="color: ${colorAsignado};">${nombreProv}</span>`, {
                                permanent: true, direction: 'center', className: 'etiqueta-provincia', interactive: false 
                            });

                            lP.on('click', () => abrirInformacionProvincia(nombreProv, colorAsignado));
                        }
                    }).addTo(mapa);

                    mapa.fitBounds(layer.getBounds());
                    tituloMapa.style.display = 'none';
                    tituloDepartamento.innerText = nombreDep; 
                    tituloDepartamento.style.display = 'block';
                    btnVolver.style.display = 'flex';
                    
                    actualizarProgresoDepartamental(nombreDepLimpio);
                }, 400);
            });
        }
    }).addTo(mapa);
}

// --- SISTEMAS DE PROGRESO ---
function actualizarProgresoGlobal() {
    if (!datosProvinciasGenerales) return;
    const total = datosProvinciasGenerales.features.length;
    let visitados = 0;
    datosProvinciasGenerales.features.forEach(p => {
        let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[provLimpia] && datosViajes[provLimpia].length > 0) visitados++;
    });
    reflejarProgresoUI(total, visitados);
}

function actualizarProgresoDepartamental(nombreDepLimpio) {
    const provsDelDep = datosProvinciasGenerales.features.filter(p => 
        p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio
    );
    const total = provsDelDep.length;
    if (total === 0) return;

    let visitados = 0;
    provsDelDep.forEach(p => {
        let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[provLimpia] && datosViajes[provLimpia].length > 0) visitados++;
    });
    reflejarProgresoUI(total, visitados);
}

function reflejarProgresoUI(total, visitados) {
    const porc = total === 0 ? 0 : Math.round((visitados / total) * 100);
    barraRelleno.style.width = porc + '%';
    textoProgreso.innerText = porc + '%';
    mascotaProgreso.style.left = porc + '%';
}

function abrirInformacionProvincia(nombreOriginal, colorProvincia) {
    // PROGRAMACIÓN DEFENSIVA: Usar el nombre limpio para buscar
    const nombreLimpio = nombreOriginal.trim().toUpperCase();
    
    tituloInfoProvincia.innerText = nombreOriginal;
    contenedorLugares.innerHTML = ''; 

    tarjetaContenidoInfo.style.borderColor = colorProvincia;
    tarjetaContenidoInfo.style.boxShadow = `0 0 20px ${colorProvincia}`;
    tituloInfoProvincia.style.webkitTextFillColor = colorProvincia; 
    tituloInfoProvincia.style.webkitBackgroundClip = "initial"; 
    tituloInfoProvincia.style.background = "none"; 

    const lugares = datosViajes[nombreLimpio];
    if (lugares && lugares.length > 0) {
        lugares.forEach(lugar => {
            contenedorLugares.innerHTML += `
                <div class="lugar-card" style="border-left-color: ${colorProvincia}">
                    <h3 style="color: #bbb">${lugar.nombre}</h3>
                    <p>Estado: ${lugar.estado}</p>
                    <p>Fecha: ${lugar.fecha}</p>
                    <p style="color: #bbb; margin-top: 8px;"><em>${lugar.info}</em></p>
                </div>
            `;
        });
    } else {
        contenedorLugares.innerHTML = `
            <div class="lugar-card" style="border-left-color: #FF4500;">
                <h3>📍 Zona por explorar</h3>
                <p>Aún no has registrado información ni proyectos en esta provincia.</p>
            </div>
        `;
    }
    pantallaInfo.style.display = 'flex';
}

btnCerrarInfo.onclick = () => { pantallaInfo.style.display = 'none'; };

btnVolver.onclick = () => {
    if (capaProvincias) { mapa.removeLayer(capaProvincias); }
    capaNacional.eachLayer(layer => capaNacional.resetStyle(layer));
    capaNacional.addTo(mapa);
    mapa.setView([-9.5, -75.01], 5.0); 
    tituloDepartamento.style.display = 'none';
    tituloMapa.style.display = 'block';
    btnVolver.style.display = 'none';
    actualizarProgresoGlobal(); 
};

btnIngresar.onclick = () => {
    if (inputPass.value === '1234') {
        avatarGuia.src = './assets/img/mascota-feliz.webp';
        setTimeout(() => {
            pantallaAcceso.style.opacity = '0';
            setTimeout(() => {
                pantallaAcceso.style.display = 'none';
                contenedorMapa.style.display = 'block';
                tituloMapa.style.display = 'block';
                btnMute.style.display = 'flex';
                contenedorProgreso.style.display = 'block';
                
                reproducirMusicaAleatoria();
                inicializarMapa();
            }, 800);
        }, 600);
    } else {
        avatarGuia.src = './assets/img/mascota-triste.webp';
        inputPass.value = '';
        setTimeout(() => {
            if (inputPass.value.length === 0) { avatarGuia.src = './assets/img/mascota-hola.webp'; }
        }, 2000); 
    }
};

inputPass.addEventListener('input', () => {
    avatarGuia.src = inputPass.value.length > 0 ? './assets/img/mascota-explora.webp' : './assets/img/mascota-hola.webp';
});

btnMute.onclick = () => {
    audioAmbiental.muted = !audioAmbiental.muted;
    btnMute.textContent = audioAmbiental.muted ? '🔇' : '🔊';
};
