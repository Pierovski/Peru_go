"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
// IMPORTAMOS updateDoc para editar
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCx_mw5M7SrUt4hPrF5tOJdb0W6KdKLpLY",
  authDomain: "perugo-395f5.firebaseapp.com",
  projectId: "perugo-395f5",
  storageBucket: "perugo-395f5.firebasestorage.app",
  messagingSenderId: "433194088191",
  appId: "1:433194088191:web:978608a957b7c800687eca"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const IMGBB_API_KEY = "055cde6238b2cefe13e31dc43f2b2570";

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

const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
const formRegistro = document.getElementById('formulario-registro');
const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const mensajeCarga = document.getElementById('mensaje-carga');

const btnFiltro = document.getElementById('btn-filtro');
let filtroActualMundo = 'TODOS';
let indiceFiltro = 0;
const estadosFiltro = [
    { valor: 'TODOS', icono: '🌍', color: '#00FFFF' },
    { valor: 'TRABAJO', icono: '🚜', color: '#FF4500' },
    { valor: 'PERSONAL', icono: '🍹', color: '#00FA9A' }
];

let capaNacional; 
let capaProvincias; 
let datosProvinciasGenerales = null; 
let mapa;
let datosGeoJSON = null;
let datosViajes = {}; 

// ESTADO GLOBAL DE EDICIÓN
let idEdicionActual = null;

const coloresChichaPremium = [ "#FF1493", "#00FA9A", "#FFD700", "#00FFFF", "#FF4500", "#9400D3" ];
const audios = [ './assets/audio/musica-uno.mp3', './assets/audio/musica-dos.mp3', './assets/audio/musica-tres.mp3' ];
const audioAmbiental = new Audio();

function reproducirMusicaAleatoria() {
    audioAmbiental.src = audios[Math.floor(Math.random() * audios.length)];
    audioAmbiental.play().catch(() => console.log("Audio bloqueado"));
}
audioAmbiental.addEventListener('ended', reproducirMusicaAleatoria);

async function obtenerViajesDeFirebase() {
    const viajesObj = {};
    try {
        const querySnapshot = await getDocs(collection(db, "viajes"));
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const provLimpia = data.provincia.trim().toUpperCase();
            if (!viajesObj[provLimpia]) viajesObj[provLimpia] = [];
            viajesObj[provLimpia].push({ id: docSnap.id, ...data });
        });
    } catch(e) { console.log("Error al cargar de la nube:", e); }
    return viajesObj;
}

function inicializarMapa() {
    mapa = L.map('map', {
        zoomControl: false, dragging: true, scrollWheelZoom: true,
        doubleClickZoom: false, touchZoom: true, attributionControl: false
    }).setView([-9.5, -75.01], 5.0);

    Promise.all([
        obtenerViajesDeFirebase(),
        fetch('./data/peru_provincial_simple.geojson').then(res => res.json()),
        fetch('./data/peru_departamental_simple.geojson').then(res => res.json())
    ]).then(([viajesFirebase, provs, deps]) => {
        datosViajes = viajesFirebase;
        datosProvinciasGenerales = provs;
        datosGeoJSON = deps;
        dibujarMapaNacional();
        actualizarProgresoGlobal(); 
    }).catch(err => console.log("Error de carga:", err));
}

function dibujarMapaNacional() {
    capaNacional = L.geoJSON(datosGeoJSON, {
        style: function (feature) {
            const nombreDepLimpio = feature.properties.NOMBDEP.trim().toUpperCase();
            const provsDelDep = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio);
            
            let tieneVisita = false;
            for(let p of provsDelDep) {
                let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
                if(datosViajes[provLimpia]) {
                    const filtrados = datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo);
                    if(filtrados.length > 0) { tieneVisita = true; break; }
                }
            }

            if (tieneVisita) {
                const c = coloresChichaPremium[nombreDepLimpio.length % coloresChichaPremium.length];
                return { color: c, weight: 3, fillColor: c, fillOpacity: 0.35, className: 'poligono-vidrio' };
            } else {
                return { color: "#f1c40f", weight: 1, fillColor: "transparent", fillOpacity: 0 };
            }
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function () {
                const nombreDep = feature.properties.NOMBDEP;
                const nombreDepLimpio = nombreDep.trim().toUpperCase();
                layer.setStyle({ color: "#FFFFFF", weight: 4, fillOpacity: 0.5 });

                setTimeout(() => {
                    mapa.removeLayer(capaNacional);
                    const filtradas = {
                        type: "FeatureCollection",
                        features: datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio)
                    };

                    capaProvincias = L.geoJSON(filtradas, {
                        style: function(fProv) {
                            const nombreProv = fProv.properties.NOMBPROV;
                            const provLimpia = nombreProv.trim().toUpperCase();
                            const c = coloresChichaPremium[nombreProv.length % coloresChichaPremium.length];
                            
                            let tieneVisita = false;
                            if (datosViajes[provLimpia]) {
                                const filtrados = datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo);
                                if(filtrados.length > 0) tieneVisita = true;
                            }

                            if (tieneVisita) {
                                return { color: c, weight: 3, fillColor: c, fillOpacity: 0.35, className: 'poligono-vidrio' };
                            } else {
                                return { color: c, weight: 1, fillColor: "#000", fillOpacity: 0.4, dashArray: "4 5" };
                            }
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

if (btnFiltro) {
    btnFiltro.onclick = () => {
        indiceFiltro = (indiceFiltro + 1) % estadosFiltro.length;
        filtroActualMundo = estadosFiltro[indiceFiltro].valor;
        btnFiltro.innerText = estadosFiltro[indiceFiltro].icono;
        btnFiltro.style.borderColor = estadosFiltro[indiceFiltro].color;
        btnFiltro.style.boxShadow = `0 0 10px ${estadosFiltro[indiceFiltro].color}`;

        if (capaNacional && (!btnVolver.style.display || btnVolver.style.display === 'none')) {
            capaNacional.eachLayer(layer => capaNacional.resetStyle(layer));
            actualizarProgresoGlobal();
        } else if (capaProvincias) {
            capaProvincias.eachLayer(layer => capaProvincias.resetStyle(layer));
            const nombreDepLimpio = tituloDepartamento.innerText.trim().toUpperCase();
            actualizarProgresoDepartamental(nombreDepLimpio);
        }
    };
}

async function subirFotoImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.data.url; 
    } catch (e) { throw new Error("No se pudo subir la imagen."); }
}

function abrirInformacionProvincia(nombreOriginal, colorProvincia) {
    const nombreLimpio = nombreOriginal.trim().toUpperCase();
    tituloInfoProvincia.innerText = nombreOriginal;
    tarjetaContenidoInfo.style.borderColor = colorProvincia;
    tarjetaContenidoInfo.style.boxShadow = `0 0 20px ${colorProvincia}`;
    tituloInfoProvincia.style.webkitTextFillColor = colorProvincia; 
    
    limpiarFormulario(); // Cerramos cualquier edición pendiente
    
    renderizarLugares(nombreLimpio, colorProvincia);
    pantallaInfo.style.display = 'flex';
}

function renderizarLugares(nombreLimpio, colorProvincia) {
    contenedorLugares.innerHTML = ''; 
    let lugares = datosViajes[nombreLimpio] || [];
    lugares = lugares.filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo);
    
    if (lugares && lugares.length > 0) {
        lugares.forEach(lugar => {
            let htmlFotos = '';
            if (lugar.foto1 || lugar.foto2) {
                htmlFotos = `<div style="display: flex; gap: 4%; margin-top: 10px;">`;
                if(lugar.foto1) htmlFotos += `<img src="${lugar.foto1}" class="foto-viaje" onclick="window.open('${lugar.foto1}')">`;
                if(lugar.foto2) htmlFotos += `<img src="${lugar.foto2}" class="foto-viaje" onclick="window.open('${lugar.foto2}')">`;
                htmlFotos += `</div>`;
            }

            const vTipo = lugar.tipo || 'PERSONAL';
            const vCompania = lugar.compania || 'Solo';
            const tagTipo = vTipo === 'TRABAJO' ? '<span class="tag-info tag-trabajo">🚜 Trabajo</span>' : '<span class="tag-info tag-personal">🍹 Personal</span>';
            const tagCompania = `<span class="tag-info tag-compania">${vCompania}</span>`;
            const btnEnlace = lugar.link ? `<br><a href="${lugar.link}" target="_blank" class="btn-link">🔗 Ver Documentación / Vuelo</a>` : '';
            
            // BOTONES CRUD: EDITAR Y ELIMINAR
            const btnEditar = `<button class="btn-editar" onclick="prepararEdicion('${lugar.id}', '${nombreLimpio}')">✏️</button>`;
            const btnEliminar = `<button class="btn-eliminar" onclick="eliminarRegistro('${lugar.id}', '${nombreLimpio}')">🗑️</button>`;

            contenedorLugares.innerHTML += `
                <div class="lugar-card" style="border-left-color: ${colorProvincia}">
                    ${btnEditar}
                    ${btnEliminar}
                    <h3 style="color: #bbb; padding-right: 55px;">${lugar.nombre}</h3>
                    <div style="margin: 5px 0;">${tagTipo} ${tagCompania}</div>
                    <p>Estado: ${lugar.estado}</p>
                    <p>Fecha: ${lugar.fecha}</p>
                    <p style="color: #bbb; margin-top: 8px;"><em>${lugar.info}</em></p>
                    ${btnEnlace}
                    ${htmlFotos}
                </div>
            `;
        });
    } else {
        contenedorLugares.innerHTML = `
            <div class="lugar-card" style="border-left-color: #FF4500;">
                <h3>📍 Zona por explorar</h3>
                <p>No hay registros que coincidan con tu filtro actual en esta provincia.</p>
            </div>
        `;
    }
}

// LÓGICA DE EDICIÓN: Rellena el formulario
window.prepararEdicion = (idDocumento, provinciaLimpia) => {
    const viaje = datosViajes[provinciaLimpia].find(v => v.id === idDocumento);
    if(!viaje) return;

    idEdicionActual = idDocumento; // Activamos el modo edición

    document.getElementById('nuevo-tipo').value = viaje.tipo || 'PERSONAL';
    document.getElementById('nueva-compania').value = viaje.compania || 'Solo';
    document.getElementById('nuevo-nombre').value = viaje.nombre || '';
    document.getElementById('nuevo-estado').value = viaje.estado || '';
    document.getElementById('nueva-fecha').value = viaje.fecha || '';
    document.getElementById('nueva-info').value = viaje.info || '';
    document.getElementById('nuevo-link').value = viaje.link || '';
    // Las fotos no se rellenan por seguridad, pero el código sabe que si las dejas vacías, conserva las originales.

    btnGuardarRegistro.innerHTML = '🔄 Actualizar Registro';
    btnGuardarRegistro.style.background = 'linear-gradient(90deg, #FFD700, #FF4500)';
    btnCancelarEdicion.style.display = 'block';
    formRegistro.style.display = 'block';
    
    // Hacemos scroll suave hacia el formulario
    formRegistro.scrollIntoView({ behavior: "smooth" });
};

// LÓGICA PARA LIMPIAR Y SALIR DE EDICIÓN
function limpiarFormulario() {
    idEdicionActual = null;
    document.getElementById('nuevo-nombre').value = ''; 
    document.getElementById('nuevo-estado').value = '';
    document.getElementById('nueva-fecha').value = ''; 
    document.getElementById('nueva-info').value = '';
    document.getElementById('nuevo-link').value = '';
    document.getElementById('foto-1').value = ''; 
    document.getElementById('foto-2').value = '';
    
    btnGuardarRegistro.innerHTML = '💾 Guardar en la Nube';
    btnGuardarRegistro.style.background = 'linear-gradient(90deg, #00FFFF, #00FA9A)';
    btnCancelarEdicion.style.display = 'none';
    formRegistro.style.display = 'none';
}

if (btnCancelarEdicion) {
    btnCancelarEdicion.onclick = limpiarFormulario;
}

window.eliminarRegistro = async (idDocumento, provinciaLimpia) => {
    if (!confirm("⚠️ ¿Estás seguro de que quieres eliminar esta expedición? Esta acción no se puede deshacer.")) return;
    try {
        await deleteDoc(doc(db, "viajes", idDocumento));
        datosViajes[provinciaLimpia] = datosViajes[provinciaLimpia].filter(v => v.id !== idDocumento);
        const colorPanel = tituloInfoProvincia.style.webkitTextFillColor;
        renderizarLugares(provinciaLimpia, colorPanel);
        
        if(capaProvincias) { capaProvincias.eachLayer(layer => capaProvincias.resetStyle(layer)); }
        actualizarProgresoGlobal();
    } catch(e) { alert("Ocurrió un error al intentar eliminar: " + e.message); }
};

if (btnMostrarFormulario) {
    btnMostrarFormulario.onclick = () => { 
        if(formRegistro.style.display === 'block' && idEdicionActual) {
            limpiarFormulario(); // Si estaba editando y presiona el botón principal, cancela.
        } else {
            formRegistro.style.display = formRegistro.style.display === 'none' ? 'block' : 'none'; 
        }
    };
}

if (btnGuardarRegistro) {
    btnGuardarRegistro.onclick = async () => {
        const tipo = document.getElementById('nuevo-tipo').value;
        const compania = document.getElementById('nueva-compania').value;
        const nombre = document.getElementById('nuevo-nombre').value;
        const estado = document.getElementById('nuevo-estado').value;
        const fecha = document.getElementById('nueva-fecha').value;
        const info = document.getElementById('nueva-info').value;
        const link = document.getElementById('nuevo-link').value;
        const foto1 = document.getElementById('foto-1').files[0];
        const foto2 = document.getElementById('foto-2').files[0];

        if (!nombre) return alert("El nombre del lugar es obligatorio.");

        btnGuardarRegistro.disabled = true;
        mensajeCarga.style.display = 'block';

        try {
            const provinciaActual = tituloInfoProvincia.innerText.trim().toUpperCase();
            
            // LÓGICA DE FOTOS INTELIGENTE
            let url1 = "", url2 = "";
            let viajePrevio = null;

            if (idEdicionActual) {
                viajePrevio = datosViajes[provinciaActual].find(v => v.id === idEdicionActual);
                url1 = viajePrevio.foto1 || ""; // Rescatamos las viejas
                url2 = viajePrevio.foto2 || "";
            }

            // Si el usuario sube fotos nuevas, sobrescribimos. Si no, se quedan las rescatadas.
            if (foto1) url1 = await subirFotoImgBB(foto1);
            if (foto2) url2 = await subirFotoImgBB(foto2);

            const registroData = { 
                provincia: provinciaActual, tipo, compania, nombre, estado, fecha, info, link, foto1: url1, foto2: url2 
            };

            if (idEdicionActual) {
                // MODO ACTUALIZAR
                await updateDoc(doc(db, "viajes", idEdicionActual), registroData);
                const index = datosViajes[provinciaActual].findIndex(v => v.id === idEdicionActual);
                datosViajes[provinciaActual][index] = { id: idEdicionActual, ...registroData };
            } else {
                // MODO CREAR NUEVO
                const docRef = await addDoc(collection(db, "viajes"), registroData);
                registroData.id = docRef.id;
                if (!datosViajes[provinciaActual]) datosViajes[provinciaActual] = [];
                datosViajes[provinciaActual].push(registroData);
            }
            
            const colorPanel = tituloInfoProvincia.style.webkitTextFillColor;
            renderizarLugares(provinciaActual, colorPanel);
            
            if(capaProvincias) { capaProvincias.eachLayer(layer => capaProvincias.resetStyle(layer)); }
            actualizarProgresoGlobal();

            limpiarFormulario(); // Resetea todo

        } catch (error) { alert("Ocurrió un error al guardar: " + error.message); }

        btnGuardarRegistro.disabled = false;
        mensajeCarga.style.display = 'none';
    };
}

btnCerrarInfo.onclick = () => { pantallaInfo.style.display = 'none'; };
btnVolver.onclick = () => {
    if (capaProvincias) mapa.removeLayer(capaProvincias);
    capaNacional.eachLayer(layer => capaNacional.resetStyle(layer));
    capaNacional.addTo(mapa);
    mapa.setView([-9.5, -75.01], 5.0); 
    tituloDepartamento.style.display = 'none';
    tituloMapa.style.display = 'block';
    btnVolver.style.display = 'none';
    actualizarProgresoGlobal(); 
};

function actualizarProgresoGlobal() {
    if (!datosProvinciasGenerales) return;
    const total = datosProvinciasGenerales.features.length;
    let visitados = 0;
    const filtroActual = filtroMapa ? filtroMapa.value : 'TODOS';

    datosProvinciasGenerales.features.forEach(p => {
        let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[provLimpia]) {
            const filtrados = datosViajes[provLimpia].filter(v => filtroActual === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActual);
            if(filtrados.length > 0) visitados++;
        }
    });
    const porc = total === 0 ? 0 : Math.round((visitados / total) * 100);
    barraRelleno.style.width = porc + '%'; textoProgreso.innerText = porc + '%'; mascotaProgreso.style.left = porc + '%';
}
function actualizarProgresoDepartamental(nombreDepLimpio) {
    const provsDelDep = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio);
    const total = provsDelDep.length;
    let visitados = 0;
    const filtroActual = filtroMapa ? filtroMapa.value : 'TODOS';

    provsDelDep.forEach(p => {
        let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[provLimpia]) {
            const filtrados = datosViajes[provLimpia].filter(v => filtroActual === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActual);
            if(filtrados.length > 0) visitados++;
        }
    });
    const porc = total === 0 ? 0 : Math.round((visitados / total) * 100);
    barraRelleno.style.width = porc + '%'; textoProgreso.innerText = porc + '%'; mascotaProgreso.style.left = porc + '%';
}

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
                btnFiltro.style.display = 'flex';
                
                contenedorProgreso.style.display = 'block';
                reproducirMusicaAleatoria();
                inicializarMapa();
            }, 800);
        }, 600);
    } else {
        avatarGuia.src = './assets/img/mascota-triste.webp';
        inputPass.value = '';
        setTimeout(() => { if (inputPass.value.length === 0) avatarGuia.src = './assets/img/mascota-hola.webp'; }, 2000); 
    }
};
inputPass.addEventListener('input', () => { avatarGuia.src = inputPass.value.length > 0 ? './assets/img/mascota-explora.webp' : './assets/img/mascota-hola.webp'; });
btnMute.onclick = () => { audioAmbiental.muted = !audioAmbiental.muted; btnMute.textContent = audioAmbiental.muted ? '🔇' : '🔊'; };

const btnActualizar = document.getElementById('btn-actualizar-app');
if (btnActualizar) {
    btnActualizar.onclick = () => {
        btnActualizar.innerText = "⏳...";
        if ('caches' in window) {
            caches.keys().then((names) => {
                Promise.all(names.map(name => caches.delete(name))).then(() => { window.location.reload(true); });
            });
        } else { window.location.reload(true); }
    };
}
