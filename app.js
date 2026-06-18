"use strict";

// 1. IMPORTACIONES FIREBASE
import { db, auth, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "./firebase.js";
const IMGBB_API_KEY = "055cde6238b2cefe13e31dc43f2b2570"; 

// 2. REFERENCIAS AL DOM
const tituloDepartamento = document.getElementById('titulo-departamento');
const btnVolver = document.getElementById('btn-volver');
const pantallaInfo = document.getElementById('pantalla-info');
const tarjetaContenidoInfo = document.querySelector('.info-contenido'); 
const tituloInfoProvincia = document.getElementById('info-provincia-titulo');
const rangoProvincia = document.getElementById('rango-provincia'); 
const contenedorLugares = document.getElementById('info-lugares');
const btnCerrarInfo = document.getElementById('btn-cerrar-info');
const pantallaCarga = document.getElementById('pantalla-carga');
const pantallaDashboard = document.getElementById('pantalla-dashboard');
const fondoDashboard = document.getElementById('fondo-dashboard');
const btnCerrarDashboard = document.getElementById('btn-cerrar-dashboard');
const contenidoDashboard = document.getElementById('contenido-dashboard');
const btnIngresar = document.getElementById('btn-ingresar');
const inputEmail = document.getElementById('email');
const inputPass = document.getElementById('pass');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const pantallaAcceso = document.getElementById('pantalla-acceso');
const contenedorMapa = document.getElementById('map');

const barraNavegacion = document.getElementById('contenedor-bottom-bar');
const btnMute = document.getElementById('btn-mute');
const btnFiltro = document.getElementById('btn-filtro');
const btnDashboard = document.getElementById('btn-dashboard');
const btnBuscar = document.getElementById('btn-buscar');
const btnCapas = document.getElementById('btn-capas'); 

const pantallaFiltros = document.getElementById('pantalla-filtros');
const btnCerrarFiltros = document.getElementById('btn-cerrar-filtros');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
const inputFiltroInicio = document.getElementById('filtro-fecha-inicio');
const inputFiltroFin = document.getElementById('filtro-fecha-fin');

const avatarGuia = document.getElementById('avatar-guia');
const tituloMapa = document.getElementById('titulo-mapa');
const contenedorProgreso = document.getElementById('contenedor-progreso');
const barraRelleno = document.getElementById('barra-relleno');
const mascotaProgreso = document.getElementById('mascota-progreso');
const textoProgreso = document.getElementById('texto-progreso');
const pantallaBuscador = document.getElementById('pantalla-buscador');
const inputBuscador = document.getElementById('input-buscador');
const resultadosBuscador = document.getElementById('resultados-buscador');
const btnBackup = document.getElementById('btn-backup');
const btnImportar = document.getElementById('btn-importar');
const inputImportar = document.getElementById('input-importar');
const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
const formRegistro = document.getElementById('formulario-registro');
const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const mensajeCarga = document.getElementById('mensaje-carga');
const selectTipo = document.getElementById('nuevo-tipo');
const camposTrabajo = document.getElementById('campos-trabajo');
const camposPersonal = document.getElementById('campos-personal');
const camposFutbol = document.getElementById('campos-futbol');
const btnWrapped = document.getElementById('btn-wrapped');
const btnRuleta = document.getElementById('btn-ruleta');

// 3. ESTADO GLOBAL
let diccCentrosProvincias = {};
let idEdicionActual = null;
let seleccionClima = ''; let seleccionTransporte = '';
let estrellasValor = { empresa: 0, gastro: 0, hosp: 0, atrac: 0, ambiente: 0 };
let filtroActualMundo = 'TODOS'; let filtroFechaInicio = null; let filtroFechaFin = null;
let capaNacional; let capaProvincias; let mapa; let datosGeoJSON = null; let datosProvinciasGenerales = null; let datosViajes = {}; 
let temporizadorBuscador; let capaSatelite; let sateliteActivo = false;
let capaPinesProvincia; let capaPinTemporal; let tempLat = null; let tempLng = null; let seleccionandoUbicacion = false; let markerDraggable = null;
let mapaYaInicializado = false;
let tabVisitaActiva = 'TODAS';

const coloresChichaPremium = [ "#FF1493", "#00FA9A", "#FFD700", "#00FFFF", "#FF4500", "#9400D3" ];
const audios = [ './assets/audio/musica-uno.mp3', './assets/audio/musica-dos.mp3', './assets/audio/musica-tres.mp3' ];
const audioAmbiental = new Audio();
const iconosFiltro = { 'TODOS': '🌍', 'TRABAJO': '🚜', 'PERSONAL': '🍹', 'FUTBOL': '⚽', 'SABOR': '🍜' };

// BANCO DE DESAFÍOS NÓMADAS
const desafiosNomadas = [
    "Prueba el plato o bebida más rara que encuentres en el mercado local.",
    "Busca el punto más alto del lugar y toma una foto panorámica.",
    "Pregúntale a un local sobre un mito o leyenda de esta zona.",
    "Tómate un selfie curioso con el letrero de bienvenida o la Plaza de Armas.",
    "Encuentra una calle sin asfaltar y anota algo que te llame la atención."
];

// 4. FUNCIONES UX Y FILTROS
function pasaFiltros(viaje) {
    const vTipo = viaje.tipo || 'PERSONAL';
    if (filtroActualMundo === 'SABOR') return viaje.gastro === 5; 
    if (filtroActualMundo !== 'TODOS' && vTipo !== filtroActualMundo) return false;
    if (filtroFechaInicio && (!viaje.fecha || viaje.fecha < filtroFechaInicio)) return false;
    if (filtroFechaFin && (!viaje.fecha || viaje.fecha > filtroFechaFin)) return false;
    return true;
}

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    toast.className = `toast ${tipo}`; toast.innerHTML = tipo === 'success' ? `✅ ${mensaje}` : `⚠️ ${mensaje}`;
    container.appendChild(toast); setTimeout(() => { if(toast.parentNode) toast.remove(); }, 4000); 
}

function habilitarSwipeToClose(elSel, cb) {
    const el = document.querySelector(elSel); if (!el) return; let startY = 0; let currentY = 0;
    el.addEventListener('touchstart', (e) => { if (el.scrollTop <= 0) startY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (!startY) return; currentY = e.touches[0].clientY; const diffY = currentY - startY; if (diffY > 0) { el.style.transition = 'none'; el.style.transform = `translateY(${diffY}px)`; } }, { passive: true });
    el.addEventListener('touchend', () => { if (!startY || !currentY) return; const diffY = currentY - startY; el.style.transition = 'transform 0.3s'; if (diffY > 120) cb(); else el.style.transform = ''; startY = 0; currentY = 0; });
}

function mostrarSkeletonLoading() { contenedorLugares.innerHTML = `<div class="lugar-card esqueleto" style="height: 100px; border-left-color: #333;"><div class="esqueleto-titulo" style="background: rgba(255,255,255,0.1); margin-top: 15px;"></div><div class="esqueleto-texto" style="background: rgba(255,255,255,0.05);"></div></div>`; }

async function comprimirYSubirImagen(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); const MAX = 1200; const scale = MAX / img.width;
                canvas.width = img.width > MAX ? MAX : img.width; canvas.height = img.width > MAX ? img.height * scale : img.height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    const fd = new FormData(); fd.append('image', blob, 'foto.jpg');
                    try { const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: fd }); const d = await r.json(); res(d.data.url); } catch (e) { rej(e); }
                }, 'image/jpeg', 0.8); 
            };
        };
    });
}

function comprobarEfemerides() {
    const hoy = new Date(); const mesDia = `${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    let hallado = null; let anios = 0;
    Object.values(datosViajes).forEach(p => p.forEach(v => {
        if(v.fecha && (v.estado||'VISITADO')==='VISITADO' && !hallado) {
            const part = v.fecha.split('-');
            if(part.length===3 && `${part[1]}-${part[2]}`===mesDia && parseInt(part[0])<hoy.getFullYear()) { hallado = v; anios = hoy.getFullYear() - parseInt(part[0]); }
        }
    }));
    if(hallado) setTimeout(() => mostrarToast(`Cápsula del Tiempo: Hace ${anios} año(s) estabas en ${hallado.nombre} 🕰️`, 'success'), 2000);
}

// =========================================
// 5. INICIALIZACIÓN MAPA Y GIS
// =========================================
function insertarTarjetaLugarSegura(htmlString) { contenedorLugares.insertAdjacentHTML('beforeend', htmlString); }
document.querySelectorAll('.btn-opcion:not(#filtro-categoria .btn-opcion)').forEach(btn => { btn.onclick = function() { const parent = this.parentElement; parent.querySelectorAll('.btn-opcion').forEach(b => b.classList.remove('seleccionado')); this.classList.add('seleccionado'); if(parent.id==='selector-clima') seleccionClima=this.dataset.valor; if(parent.id==='selector-transporte') seleccionTransporte=this.dataset.valor; }; });
function inicializarEstrellas(id, clave) { const c = document.getElementById(id); if(!c) return; const s = c.querySelectorAll('span'); s.forEach((e, idx) => { e.onclick = () => { estrellasValor[clave] = idx + 1; s.forEach((x, i) => { x.classList.toggle('activa', i <= idx); }); }; }); }
['empresa','gastro','hosp','atrac','ambiente'].forEach(k => inicializarEstrellas(`estrellas-${k}`, k));

function resetUIFormulario() { document.querySelectorAll('#formulario-registro .btn-opcion').forEach(b => b.classList.remove('seleccionado')); document.querySelectorAll('.contenedor-estrellas span').forEach(s => s.classList.remove('activa')); seleccionClima = ''; seleccionTransporte = ''; estrellasValor = { empresa:0, gastro:0, hosp:0, atrac:0, ambiente:0 }; }
function reproducirMusicaAleatoria() { audioAmbiental.src = audios[Math.floor(Math.random() * audios.length)]; audioAmbiental.play().catch(()=>{}); } audioAmbiental.addEventListener('ended', reproducirMusicaAleatoria);

async function obtenerViajesDeFirebase() { const obj = {}; try { const q = await getDocs(collection(db, "viajes")); q.forEach(d => { const data=d.data(); const p=data.provincia.trim().toUpperCase(); if(!obj[p]) obj[p]=[]; obj[p].push({id:d.id, ...data}); }); } catch(e){} return obj; }

function inicializarMapa() {
    if (mapaYaInicializado) return; mapaYaInicializado = true;
    mapa = L.map('map', { zoomControl: false, dragging: true, scrollWheelZoom: true, doubleClickZoom: false, touchZoom: true, attributionControl: false }).setView([-9.5, -75.01], 5.0);
    capaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    capaPinesProvincia = L.layerGroup().addTo(mapa); capaPinTemporal = L.layerGroup().addTo(mapa);

    mapa.on('click', (e) => {
        if (seleccionandoUbicacion && !markerDraggable) {
            tempLat = e.latlng.lat; tempLng = e.latlng.lng; capaPinTemporal.clearLayers();
            const icon = L.divIcon({ className: 'chinche-premium', html: '📍', iconSize: [28, 28], iconAnchor: [14, 28] });
            markerDraggable = L.marker([tempLat, tempLng], {icon: icon, draggable: true}).addTo(capaPinTemporal);
            markerDraggable.on('dragend', function(ev) { tempLat = ev.target.getLatLng().lat; tempLng = ev.target.getLatLng().lng; });
            mostrarToast("Chinche colocado. Arrástralo al punto exacto.", "success");
        }
    });

    Promise.all([ obtenerViajesDeFirebase(), fetch('./data/peru_provincial_simple.geojson').then(r => r.json()), fetch('./data/peru_departamental_simple.geojson').then(r => r.json()) ]).then(([v, p, d]) => { 
        datosViajes = v; datosProvinciasGenerales = p; datosGeoJSON = d;
        L.geoJSON(p, { onEachFeature: function(f, l) { diccCentrosProvincias[f.properties.NOMBPROV.trim().toUpperCase()] = l.getBounds().getCenter(); } });
        dibujarMapaNacional(); actualizarProgresoGlobal(); pantallaCarga.style.display = 'none'; if(barraNavegacion) barraNavegacion.style.display = 'flex'; 
        comprobarEfemerides(); 
    });
}

function dibujarMapaNacional() {
    capaNacional = L.geoJSON(datosGeoJSON, {
        style: function (f) {
            const nomD = f.properties.NOMBDEP.trim().toUpperCase(); const provs = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nomD);
            let visitadas=0; let wishlist=0;
            for(let p of provs) {
                let nP = p.properties.NOMBPROV.trim().toUpperCase();
                if(datosViajes[nP]) {
                    const filt = datosViajes[nP].filter(pasaFiltros);
                    if(filt.some(v => (v.estado||'VISITADO')==='VISITADO')) visitadas++;
                    else if(filt.some(v => v.estado==='WISHLIST')) wishlist++;
                }
            }
            if (visitadas === provs.length && provs.length>0) return { color: "#FFF", weight: 3, fillColor: "#FFD700", fillOpacity: 0.6, className: 'poligono-dorado' };
            else if (visitadas > 0) return { color: coloresChichaPremium[nomD.length % coloresChichaPremium.length], weight: 3, fillColor: coloresChichaPremium[nomD.length % coloresChichaPremium.length], fillOpacity: 0.35, className: 'poligono-vidrio' }; 
            else if (wishlist > 0) return { color: "#00FFFF", weight: 2, fillColor: "#00FFFF", fillOpacity: 0.15, className: 'poligono-wishlist' };
            else return { color: "#555", weight: 1, fillColor: "#222", fillOpacity: 0.8, className: 'poligono-raspadita' }; 
        },
        onEachFeature: function (f, l) {
            l.on('click', function () {
                const nD = f.properties.NOMBDEP; l.setStyle({ color: "#FFFFFF", weight: 4, fillOpacity: 0.5 });
                setTimeout(() => {
                    mapa.removeLayer(capaNacional);
                    const filt = { type: "FeatureCollection", features: datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nD.trim().toUpperCase()) };
                    capaProvincias = L.geoJSON(filt, {
                        style: function(fP) {
                            const nP = fP.properties.NOMBPROV.trim().toUpperCase(); const c = coloresChichaPremium[fP.properties.NOMBPROV.length % coloresChichaPremium.length];
                            let hasV=false; let hasW=false;
                            if(datosViajes[nP]) { const filtrados = datosViajes[nP].filter(pasaFiltros); hasV=filtrados.some(v=>(v.estado||'VISITADO')==='VISITADO'); hasW=filtrados.some(v=>v.estado==='WISHLIST'); }
                            
                            // TRANSPARENCIA INTELIGENTE EN MODO SATÉLITE PARA TODAS LAS PROVINCIAS
                            const opV = sateliteActivo ? 0.05 : 0.35;
                            const opW = sateliteActivo ? 0.05 : 0.15;
                            const opN = sateliteActivo ? 0.05 : 0.7;

                            if (hasV) return { color: c, weight: 3, fillColor: c, fillOpacity: opV, className: 'poligono-vidrio' }; 
                            else if (hasW) return { color: "#00FFFF", weight: 2, fillColor: "#00FFFF", fillOpacity: opW, className: 'poligono-wishlist' };
                            else return { color: "#444", weight: 2, fillColor: "#111", fillOpacity: opN, className: 'poligono-raspadita' };
                        },
                        onEachFeature: function(fP, lP) {
                            const nP = fP.properties.NOMBPROV; const c = coloresChichaPremium[nP.length % coloresChichaPremium.length];
                            lP.bindTooltip(`<span style="color: ${c};">${nP}</span>`, { permanent: true, direction: 'center', className: 'etiqueta-provincia', interactive: false }); lP.on('click', () => { abrirInformacionProvincia(nP, c); });
                        }
                    }).addTo(mapa);
                    mapa.fitBounds(l.getBounds()); tituloMapa.style.display = 'none'; tituloDepartamento.innerText = nD; tituloDepartamento.style.display = 'block'; btnVolver.style.display = 'inline-block'; actualizarProgresoDepartamental(nD.trim().toUpperCase());
                }, 400);
            });
        }
    }).addTo(mapa);
}

if (btnCapas) { 
    btnCapas.onclick = () => { 
        if(sateliteActivo){ 
            mapa.removeLayer(capaSatelite); 
            btnCapas.style.textShadow="";
        }else{ 
            capaSatelite.addTo(mapa); 
            capaSatelite.bringToBack(); 
            btnCapas.style.textShadow="0 0 15px #00FFFF";
        } 
        sateliteActivo=!sateliteActivo; 
        if (capaProvincias) {
            capaProvincias.eachLayer(l => capaProvincias.resetStyle(l));
        }
    }; 
}

// =========================================
// 6. FILTROS Y NAVEGACIÓN
// =========================================
document.querySelectorAll('#filtro-categoria .btn-opcion').forEach(btn => { btn.onclick = () => { document.querySelectorAll('#filtro-categoria .btn-opcion').forEach(b => b.classList.remove('seleccionado')); btn.classList.add('seleccionado'); }; });
window.cerrarFiltros = () => { pantallaFiltros.style.transform = ''; pantallaFiltros.classList.remove('activo'); setTimeout(() => { pantallaFiltros.style.display = 'none'; fondoDashboard.style.display = 'none'; }, 400); };
if (btnFiltro) { btnFiltro.onclick = () => { fondoDashboard.style.display = 'block'; pantallaFiltros.style.display = 'block'; setTimeout(() => { pantallaFiltros.classList.add('activo'); }, 10); }; }
if (btnCerrarFiltros) btnCerrarFiltros.onclick = window.cerrarFiltros;
habilitarSwipeToClose('#pantalla-filtros', window.cerrarFiltros);

if (btnLimpiarFiltros) { btnLimpiarFiltros.onclick = () => { document.querySelectorAll('#filtro-categoria .btn-opcion').forEach(b => b.classList.remove('seleccionado')); document.querySelector('#filtro-categoria .btn-opcion[data-valor="TODOS"]').classList.add('seleccionado'); inputFiltroInicio.value=''; inputFiltroFin.value=''; filtroActualMundo='TODOS'; filtroFechaInicio=null; filtroFechaFin=null; btnFiltro.innerText=iconosFiltro['TODOS']; btnFiltro.style.textShadow=""; mostrarToast("Filtros limpios"); refrescarMundoLocal(); window.cerrarFiltros(); }; }
if (btnAplicarFiltros) { btnAplicarFiltros.onclick = () => { const cat = document.querySelector('#filtro-categoria .btn-opcion.seleccionado'); filtroActualMundo = cat ? cat.dataset.valor : 'TODOS'; filtroFechaInicio = inputFiltroInicio.value||null; filtroFechaFin = inputFiltroFin.value||null; btnFiltro.innerText = iconosFiltro[filtroActualMundo]||'🌍'; btnFiltro.style.textShadow = filtroActualMundo!=='TODOS'||filtroFechaInicio||filtroFechaFin ? "0 0 15px #00FFFF" : ""; mostrarToast("Filtros applied"); refrescarMundoLocal(); window.cerrarFiltros(); }; }

function refrescarMundoLocal() { if(capaNacional && btnVolver.style.display==='none'){ capaNacional.eachLayer(l=>capaNacional.resetStyle(l)); actualizarProgresoGlobal(); } else if(capaProvincias){ capaProvincias.eachLayer(l=>capaProvincias.resetStyle(l)); actualizarProgresoDepartamental(tituloDepartamento.innerText.trim().toUpperCase()); } }

// EVENTO CLIC PESTAÑAS HYBRID UI
document.querySelectorAll('.btn-tab-visita').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.btn-tab-visita').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        tabVisitaActiva = btn.dataset.tab;
        const nomL = tituloInfoProvincia.innerText.trim().toUpperCase();
        const col = tituloInfoProvincia.style.webkitTextFillColor;
        renderizarLugares(nomL, col);
    };
});

function calcRacha() {
    const fSet = new Set(); Object.values(datosViajes).forEach(p => p.forEach(v => { if(v.fecha && pasaFiltros(v) && v.estado!=='WISHLIST') { const [a, m]=v.fecha.split('-'); if(a&&m) fSet.add(`${a}-${m}`); }}));
    if(fSet.size===0) return 0; const mo = Array.from(fSet).sort((a,b)=>b.localeCompare(a)); let r=0; const hoy=new Date();
    const mA=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`; const fA=new Date(hoy.getFullYear(), hoy.getMonth()-1, 1); const mAnt=`${fA.getFullYear()}-${String(fA.getMonth()+1).padStart(2,'0')}`;
    if(!fSet.has(mA) && !fSet.has(mAnt)) return 0;
    let [aE, mE] = mo[0].split('-').map(Number);
    for(let i=0; i<mo.length; i++){ if(mo[i]===`${aE}-${String(mE).padStart(2,'0')}`){ r++; mE--; if(mE===0){mE=12; aE--;} } else break; } return r;
}

if (btnDashboard) {
    btnDashboard.onclick = () => {
        let tP=0; let tPer=0; let tot=0; let pVis=new Set(); let est=[];
        Object.keys(datosViajes).forEach(prov => { datosViajes[prov].forEach(v => { if(pasaFiltros(v) && v.estado!=='WISHLIST') { pVis.add(prov); tot++; if(v.tipo==='TRABAJO') tP++; else if(v.tipo==='FUTBOL'){if(v.estadio) est.push(v.estadio);} else tPer++; } }); });
        const totP = datosProvinciasGenerales ? datosProvinciasGenerales.features.length : 196; const porc = Math.round((pVis.size/totP)*100)||0; const racha = calcRacha();
        contenidoDashboard.innerHTML = `<div class="bento-item bento-full" style="border-color:#00FFFF;"><div class="bento-titulo" style="color:#00FFFF;">Avance</div><div class="bento-valor" style="color:#00FFFF;">${porc}%</div><div style="font-size:0.75rem; color:#ddd;">Conquistado: ${pVis.size}/196 prov</div></div><div class="bento-item" style="border-color:#FFD700; border-left:4px solid #FFD700;"><div class="bento-titulo">Racha Activa</div><div class="bento-valor" style="color:#FFD700;">${racha} ${racha>0?'🔥':'🧊'}</div></div><div class="bento-item" style="border-color:#FF4500; border-left:4px solid #FF4500;"><div class="bento-titulo">Proyectos</div><div class="bento-valor" style="color:#FF4500;">${tP} 🚜</div></div><div class="bento-item" style="border-color:#00FA9A; border-left:4px solid #00FA9A;"><div class="bento-titulo">Personales</div><div class="bento-valor" style="color:#00FA9A;">${tPer} 🍹</div></div><div class="bento-item" style="border-color:#FF1493; border-left:4px solid #FF1493;"><div class="bento-titulo">Registros</div><div class="bento-valor" style="color:#FF1493;">${tot} 📍</div></div><div class="bento-item bento-full" style="border-color:#FFF;"><div class="bento-titulo">Estadios</div><div class="bento-valor" style="color:#FFF;">${est.length} ⚽</div><div style="font-size:0.75rem; color:#ddd;">${est.join(', ')||'Aún no hay canchas.'}</div></div>`;
        fondoDashboard.style.display = 'block'; pantallaDashboard.style.display = 'block'; setTimeout(() => pantallaDashboard.classList.add('activo'), 10);
    };
}

// =========================================
// RULETA DE FIN DE SEMANA
// =========================================
if(btnRuleta) {
    btnRuleta.onclick = () => {
        if(!datosProvinciasGenerales) return;
        let candidatas = [];
        datosProvinciasGenerales.features.forEach(p => {
            let nP = p.properties.NOMBPROV.trim().toUpperCase();
            let hasVisita = false;
            if(datosViajes[nP]) hasVisita = datosViajes[nP].some(v => (v.estado||'VISITADO') === 'VISITADO');
            if(!hasVisita) candidatas.push(nP);
        });
        
        if(candidatas.length > 0) {
            const elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
            mostrarToast(`🎲 Destino al azar: ¡Tu misión es conquistar ${elegida}!`, 'success');
        } else {
            mostrarToast("¡Impresionante! Ya visitaste todas las provincias de Perú.", 'success');
        }
    };
}

if(btnWrapped) {
    btnWrapped.onclick = () => {
        let y = new Date().getFullYear(); let tr=0; let pe=0; let fu=0; let provs=new Set();
        Object.keys(datosViajes).forEach(p => datosViajes[p].forEach(v => { if(v.fecha && v.fecha.startsWith(y) && v.estado!=='WISHLIST'){ provs.add(p); if(v.tipo==='TRABAJO') tr++; else if(v.tipo==='FUTBOL') fu++; else pe++; } }));
        let topT = [tr,pe,fu]; let maxIdx = topT.indexOf(Math.max(...topT)); let aura = maxIdx===0 ? '🚜 Topógrafo Guerrero' : maxIdx===1 ? '🍹 Aventurero Libre' : '⚽ Hincha Fiel';
        document.getElementById('wrapped-content').innerHTML = `Este ${y} fue increíble:<br><br><span style="color:#00FFFF; font-size:1.5rem; font-weight:bold;">${provs.size}</span> Provincias descubiertas<br><br><span style="color:#FFD700; font-size:1.5rem; font-weight:bold;">${tr+pe+fu}</span> Expediciones totales<br><br>Tu aura de viaje:<br><span style="color:#FF1493; font-size:1.5rem; font-family:'Paytone One';">${aura}</span>`;
        document.getElementById('modal-wrapped').style.display='flex'; setTimeout(()=>document.getElementById('modal-wrapped').style.opacity='1', 10);
        if(typeof confetti==='function') confetti({particleCount:150, spread:100, zIndex:10060});
    };
}

window.cerrarDashboard = () => { pantallaDashboard.style.transform = ''; pantallaDashboard.classList.remove('activo'); setTimeout(() => { pantallaDashboard.style.display = 'none'; fondoDashboard.style.display = 'none'; }, 400); };
if(btnCerrarDashboard) btnCerrarDashboard.onclick = window.cerrarDashboard;
if(fondoDashboard) fondoDashboard.onclick = () => { window.cerrarDashboard(); window.cerrarFiltros(); window.cerrarBuscador(); }; 
habilitarSwipeToClose('.dashboard-bento', window.cerrarDashboard); habilitarSwipeToClose('.info-contenido', () => { if(btnCerrarInfo) btnCerrarInfo.click(); }); habilitarSwipeToClose('#visor-fotos', () => { if(window.cerrarVisorFotos) window.cerrarVisorFotos(); });

// =========================================
// 7. GENERADOR POSTAL INSTAGRAM
// =========================================
window.generarPostalIG = async (id, prov) => {
    mostrarToast("Generando Postal...", "success");
    const v = datosViajes[prov].find(x => x.id === id); if(!v) return;
    document.getElementById('post-titulo').innerText = v.nombre;
    document.getElementById('post-sub').innerText = prov;
    document.getElementById('post-img').src = v.foto1 || v.foto2 || './assets/img/fondo.jpg'; 
    document.getElementById('post-desc').innerText = v.tipo === 'TRABAJO' ? `Proyecto finalizado. ${v.clima||''}` : v.tipo === 'FUTBOL' ? `Estadio: ${v.estadio||''}` : `Puntaje Gastro: ★ ${v.gastro||'N/A'}`;
    const panel = document.getElementById('postal-generador');
    try {
        const canvas = await html2canvas(panel, {scale: 1, useCORS: true, logging: false});
        const url = canvas.toDataURL("image/jpeg", 0.9);
        const a = document.createElement('a'); a.href = url; a.download = `PeruGo_Story_${v.nombre}.jpg`; a.click();
        mostrarToast("Postal descargada para Instagram 📸", "success");
    } catch(e) { mostrarToast("Error generando postal", "error"); }
};

// =========================================
// 8. CRUD Y GEOLOCALIZACIÓN Z
// =========================================
document.getElementById('btn-gps').onclick = (e) => {
    e.preventDefault(); const btn = document.getElementById('btn-gps'); btn.innerText = "⏳";
    if(!navigator.geolocation){ mostrarToast("Sin GPS", "error"); btn.innerText="🎯"; return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        tempLat=pos.coords.latitude; tempLng=pos.coords.longitude; document.getElementById('nueva-coordenada').value = `${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`;
        if(pos.coords.accuracy>10){ mostrarToast(`Precisión baja (${Math.round(pos.coords.accuracy)}m)`,"error"); btn.style.color="#FF4500"; } else { btn.style.color="#00FA9A"; }
        try { 
            const r = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${tempLat},${tempLng}`); const d = await r.json();
            if(d && d.results && d.results[0].elevation) { document.getElementById('nueva-altitud').value = Math.round(d.results[0].elevation); mostrarToast("Cota altimétrica Z obtenida ⛰️","success"); }
        } catch(e){}
        btn.innerText = "🎯"; capaPinTemporal.clearLayers(); L.marker([tempLat,tempLng], {icon: L.divIcon({className:'chinche-premium',html:'📍',iconSize:[28,28],iconAnchor:[14,28]})}).addTo(capaPinTemporal);
    }, (err) => { mostrarToast("Error GPS", "error"); btn.innerText="🎯"; }, {enableHighAccuracy:true, timeout:10000});
};

document.getElementById('btn-ubicar-mapa').onclick = (e) => { e.preventDefault(); pantallaInfo.style.display='none'; seleccionandoUbicacion=true; markerDraggable=null; document.getElementById('btn-confirmar-ubicacion').style.display='block'; mostrarToast("Toca y arrastra el chinche 📌", "success"); };
document.getElementById('btn-confirmar-ubicacion').onclick = () => { if(tempLat && tempLng) document.getElementById('nueva-coordenada').value=`${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`; seleccionandoUbicacion=false; markerDraggable=null; document.getElementById('btn-confirmar-ubicacion').style.display='none'; pantallaInfo.style.display='flex'; };

function dibujarPinesProvincia(nom) {
    capaPinesProvincia.clearLayers(); const lg = datosViajes[nom]||[];
    lg.forEach(v => { if(pasaFiltros(v) && v.lat && v.lng) L.marker([v.lat, v.lng], {icon: L.divIcon({className:'chinche-premium',html:v.estado==='WISHLIST'?'⭐':'📍',iconSize:[28,28],iconAnchor:[14,28]})}).bindTooltip(`<b>${v.nombre}</b><br><span style="font-size:0.7rem;color:#aaa;">Z: ${v.altitud?v.altitud+'m':'N/A'}</span>`, {direction:'top',className:'tooltip-chinche'}).addTo(capaPinesProvincia); });
}

function abrirInformacionProvincia(nomOri, col) {
    const nomL = nomOri.trim().toUpperCase(); tituloInfoProvincia.innerText=nomOri; tarjetaContenidoInfo.style.borderColor=col; tarjetaContenidoInfo.style.boxShadow=`0 0 20px ${col}`; tituloInfoProvincia.style.webkitTextFillColor=col;
    limpiarFormulario(); 
    
    // RESET DE PESTAÑAS HYBRID UI
    tabVisitaActiva = 'TODAS';
    document.querySelectorAll('.btn-tab-visita').forEach(b => b.classList.remove('activo'));
    const btnTodas = document.querySelector('.btn-tab-visita[data-tab="TODAS"]');
    if (btnTodas) btnTodas.classList.add('activo');

    mostrarSkeletonLoading(); dibujarPinesProvincia(nomL);
    
    // CALCULAR RANGO DE "ALCALDE"
    let numVisitas = 0;
    if(datosViajes[nomL]) numVisitas = datosViajes[nomL].filter(v => (v.estado||'VISITADO') === 'VISITADO').length;
    let txtRango = "Aún no explorado";
    if (numVisitas >= 10) txtRango = "👑 Alcalde";
    else if (numVisitas >= 5) txtRango = "☕ Caserito";
    else if (numVisitas >= 3) txtRango = "🤝 Conocido";
    else if (numVisitas >= 1) txtRango = "🎒 Forastero";
    
    if (rangoProvincia) rangoProvincia.innerText = txtRango;

    pantallaInfo.style.display='flex'; tarjetaContenidoInfo.style.transform=''; setTimeout(()=>renderizarLugares(nomL,col), 800);
}

function renderizarLugares(nomL, col) {
    contenedorLugares.innerHTML = ''; 
    let lug = (datosViajes[nomL]||[]).filter(pasaFiltros);
    
    // Filtro de pestañas locales
    if (tabVisitaActiva !== 'TODAS') {
        lug = lug.filter(v => (v.tipo || 'PERSONAL') === tabVisitaActiva);
    }

    if(lug.length===0) return insertarTarjetaLugarSegura(`<div class="timeline-item"><div class="card-visual" style="border-left: 4px solid #FF4500;"><div class="card-content"><h3 class="card-title" style="color:#FF4500; font-size:0.9rem;">📍 Sin registros en esta categoría</h3></div></div></div>`);
    
    // Ordenar cronológicamente (Recientes primero)
    lug.sort((a,b) => (b.fecha||"").localeCompare(a.fecha||""));

    lug.forEach(v => {
        let bgImg = v.foto1 ? `<div class="card-bg" style="background-image: url('${v.foto1}');"></div>` : (v.foto2 ? `<div class="card-bg" style="background-image: url('${v.foto2}');"></div>` : '');
        let textColor = bgImg ? "#FFF" : col;

        let fH = ''; if(v.foto1||v.foto2) fH = `<div style="display:flex;gap:4%;margin-top:15px;justify-content:center;">${v.foto1?`<img src="${v.foto1}" class="foto-viaje" onclick="abrirVisorFotos('${v.foto1}')">`:''}${v.foto2?`<img src="${v.foto2}" class="foto-viaje" onclick="abrirVisorFotos('${v.foto2}')">`:''}</div>`;
        const est = v.estado || 'VISITADO'; 
        const tT = est==='WISHLIST' ? '<span class="tag-info tag-wishlist">⭐ Wishlist</span>' : v.tipo==='TRABAJO'?'<span class="tag-info tag-trabajo">🚜 Trabajo</span>':v.tipo==='FUTBOL'?'<span class="tag-info tag-futbol">⚽ Fútbol</span>':'<span class="tag-info tag-personal">🍹 Personal</span>';
        const eD = `<button class="btn-editar" onclick="event.stopPropagation(); prepararEdicion('${v.id}','${nomL}')">✏️</button><button class="btn-eliminar" onclick="event.stopPropagation(); eliminarRegistro('${v.id}','${nomL}')">🗑️</button>`;
        const s = (n)=>'★'.repeat(n||0)+'<span style="color:rgba(255,255,255,0.2);">'+'★'.repeat(5-(n||0))+'</span>';
        let det = ''; if(v.tipo==='TRABAJO') det=`<p style="font-size:0.8rem; text-shadow:0 1px 2px #000;">${v.tipoProyecto?`<b>Proy:</b> ${v.tipoProyecto}<br>`:''}<b>Contratista:</b> <span style="color:#FFD700;">${s(v.empresa)}</span> ${v.clima||''}</p>`; else if(v.tipo==='FUTBOL') det=`<p style="font-size:0.8rem; text-shadow:0 1px 2px #000;">${v.estadio?`<b>Estadio:</b> ${v.estadio}<br>`:''}<b>Ambiente:</b> <span style="color:#FFD700;">${s(v.ambiente)}</span></p>`; else det=`<p style="font-size:0.8rem; text-shadow:0 1px 2px #000;">${v.platoDestacado?`<b>Plato:</b> ${v.platoDestacado}<br>`:''}<b>Gastro:</b> <span style="color:#FFD700;">${s(v.gastro)}</span><br><b>Hospedaje:</b> <span style="color:#FFD700;">${s(v.hosp)}</span> ${v.transporte||''}</p>`;
        if(v.contacto) det += `<p style="font-size:0.75rem; color:#00FFFF; text-shadow:0 1px 2px #000;">📞 <b>Directorio:</b> ${v.contacto}</p>`;
        
        insertarTarjetaLugarSegura(`
            <div class="timeline-item">
                <div class="card-visual" style="${bgImg ? '' : `border-left: 4px solid ${col};`}">
                    ${bgImg}
                    <div class="card-content">
                        <div class="card-header" onclick="toggleAcordeon('${v.id}')">
                            <div>
                                <h3 class="card-title" style="color: ${textColor};">${v.nombre}</h3>
                                <span class="card-date">${v.fecha||'Sin fecha'} ${v.altitud ? `| <b>Z:</b> ${v.altitud}m` : ''}</span>
                            </div>
                            <div class="flecha-acordeon" id="flecha-${v.id}" style="color: ${textColor}; text-shadow: 0 0 5px rgba(0,0,0,0.8);">▼</div>
                        </div>
                        <div class="tarjeta-body" id="body-${v.id}">
                            ${eD}
                            <div style="margin-bottom:5px;">${tT} <span class="tag-info tag-compania">${v.compania||'Solo'}</span></div>
                            ${det}
                            <p style="color:#ddd; margin-top:8px; text-shadow: 0 1px 3px #000; font-size: 0.85rem;"><em>${v.info||''}</em></p>
                            ${v.link?`<a href="${v.link}" target="_blank" class="btn-link">🔗 Docs</a>`:''} 
                            ${est==='VISITADO' && (v.foto1||v.foto2) ? `<button class="btn-postal" onclick="generarPostalIG('${v.id}','${nomL}')">📸 IG Story</button>` : ''} 
                            ${fH}
                        </div>
                    </div>
                </div>
            </div>
        `);
    });
}

function limpiarFormulario() { 
    idEdicionActual=null; 
    resetUIFormulario(); 
    ['nuevo-nombre','nueva-fecha','nueva-info','nuevo-link','nuevo-plato','nuevo-estadio','nuevo-partido','foto-1','foto-2','nueva-coordenada','nueva-altitud','nuevo-contacto'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.value = '';
    }); 
    const sTipo = document.getElementById('nuevo-tipo');
    if (sTipo) { sTipo.value = 'PERSONAL'; sTipo.dispatchEvent(new Event('change')); }
    tempLat=null; tempLng=null; markerDraggable=null; 
    if (capaPinTemporal) capaPinTemporal.clearLayers(); 
    if (btnGuardarRegistro) btnGuardarRegistro.innerHTML='💾 Guardar'; 
    if (btnCancelarEdicion) btnCancelarEdicion.style.display='none'; 
    if (formRegistro) formRegistro.style.display='none'; 
}

window.prepararEdicion = (id, pL) => {
    const v = datosViajes[pL].find(x => x.id === id); if(!v) return; 
    
    limpiarFormulario(); // <-- 1. PRIMERO limpiamos todo rastro anterior
    idEdicionActual = id; // <-- 2. LUEGO guardamos el ID correcto
    
    document.getElementById('nuevo-estado').value=v.estado||'VISITADO'; document.getElementById('nuevo-tipo').value=v.tipo||'PERSONAL'; document.getElementById('nuevo-tipo').dispatchEvent(new Event('change')); document.getElementById('nueva-compania').value=v.compania||'Solo'; document.getElementById('nuevo-nombre').value=v.nombre||''; document.getElementById('nueva-fecha').value=v.fecha||''; document.getElementById('nueva-info').value=v.info||''; document.getElementById('nueva-altitud').value=v.altitud||''; document.getElementById('nuevo-contacto').value=v.contacto||'';
    const elLink = document.getElementById('nuevo-link'); if(elLink) elLink.value = v.link || '';
    tempLat=v.lat||null; tempLng=v.lng||null; document.getElementById('nueva-coordenada').value=tempLat?`${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`:''; capaPinTemporal.clearLayers(); if(tempLat) L.marker([tempLat,tempLng],{icon:L.divIcon({className:'chinche-premium',html:'📍',iconSize:[28,28],iconAnchor:[14,28]})}).addTo(capaPinTemporal);
    if(v.tipo==='TRABAJO'){ if(v.tipoProyecto) document.getElementById('nuevo-tipo-proyecto').value=v.tipoProyecto; if(v.clima) document.querySelector(`#selector-clima .btn-opcion[data-valor="${v.clima}"]`)?.click(); if(v.empresa) document.querySelectorAll('#estrellas-empresa span')[v.empresa-1]?.click(); } else if(v.tipo==='FUTBOL'){ if(v.estadio) document.getElementById('nuevo-estadio').value=v.estadio; if(v.partido) document.getElementById('nuevo-partido').value=v.partido; if(v.ambiente) document.querySelectorAll('#estrellas-ambiente span')[v.ambiente-1]?.click(); } else { if(v.platoDestacado) document.getElementById('nuevo-plato').value=v.platoDestacado; if(v.transporte) document.querySelector(`#selector-transporte .btn-opcion[data-valor="${v.transporte}"]`)?.click(); if(v.gastro) document.querySelectorAll('#estrellas-gastro span')[v.gastro-1]?.click(); if(v.hosp) document.querySelectorAll('#estrellas-hosp span')[v.hosp-1]?.click(); if(v.atrac) document.querySelectorAll('#estrellas-atrac span')[v.atrac-1]?.click(); }
    btnGuardarRegistro.innerHTML='🔄 Actualizar'; btnCancelarEdicion.style.display='block'; formRegistro.style.display='block'; formRegistro.scrollIntoView({behavior:"smooth"});
};

if(btnCancelarEdicion) btnCancelarEdicion.onclick = limpiarFormulario;
window.eliminarRegistro = async (id, pL) => { if(!confirm("⚠️ ¿Eliminar permanentemente?")) return; try { await deleteDoc(doc(db, "viajes", id)); datosViajes[pL]=datosViajes[pL].filter(v=>v.id!==id); renderizarLugares(pL, tituloInfoProvincia.style.webkitTextFillColor); dibujarPinesProvincia(pL); if(capaProvincias) capaProvincias.eachLayer(l=>capaProvincias.resetStyle(l)); actualizarProgresoGlobal(); mostrarToast("Eliminado", "success"); } catch(e){} };
if(btnMostrarFormulario) btnMostrarFormulario.onclick = () => { if(formRegistro.style.display==='block'&&idEdicionActual) limpiarFormulario(); else formRegistro.style.display=formRegistro.style.display==='none'?'block':'none'; };

if(btnGuardarRegistro) {
    btnGuardarRegistro.onclick = async () => {
        const est=document.getElementById('nuevo-estado').value; const tp=document.getElementById('nuevo-tipo').value; const co=document.getElementById('nueva-compania').value; const nom=document.getElementById('nuevo-nombre').value; const fec=document.getElementById('nueva-fecha').value; const inf=document.getElementById('nueva-info').value; const cont=document.getElementById('nuevo-contacto').value; const alt=document.getElementById('nueva-altitud').value; const f1=document.getElementById('foto-1').files[0]; const f2=document.getElementById('foto-2').files[0];
        const elLink = document.getElementById('nuevo-link'); const lin = elLink ? elLink.value : '';

        if(!nom) return mostrarToast("Nombre obligatorio", "error"); btnGuardarRegistro.disabled=true; mensajeCarga.style.display='block';
        try {
            const pA=tituloInfoProvincia.innerText.trim().toUpperCase(); let u1="", u2=""; if(idEdicionActual){ const vP=datosViajes[pA].find(v=>v.id===idEdicionActual); u1=vP.foto1||""; u2=vP.foto2||""; }
            
            let esPrimeraVisita = false;
            if (est === 'VISITADO' && !idEdicionActual) {
                if (!datosViajes[pA] || !datosViajes[pA].some(v => (v.estado||'VISITADO') === 'VISITADO')) {
                    esPrimeraVisita = true;
                }
            }

            if(f1) u1 = await comprimirYSubirImagen(f1); if(f2) u2 = await comprimirYSubirImagen(f2);
            const cM = document.getElementById('nueva-coordenada').value.trim(); if(cM){ const p=cM.split(','); if(p.length===2){ tempLat=parseFloat(p[0]); tempLng=parseFloat(p[1]); } }
            let rD = { provincia:pA, estado:est, tipo:tp, compania:co, nombre:nom, fecha:fec, info:inf, link:lin, contacto:cont, altitud:alt, foto1:u1, foto2:u2, lat:tempLat, lng:tempLng };
            if(tp==='TRABAJO'){ rD.tipoProyecto=document.getElementById('nuevo-tipo-proyecto').value; rD.clima=seleccionClima; rD.empresa=estrellasValor.empresa; } else if(tp==='FUTBOL'){ rD.estadio=document.getElementById('nuevo-estadio').value; rD.partido=document.getElementById('nuevo-partido').value; rD.ambiente=estrellasValor.ambiente; } else { rD.transporte=seleccionTransporte; rD.platoDestacado=document.getElementById('nuevo-plato').value; rD.gastro=estrellasValor.gastro; rD.hosp=estrellasValor.hosp; rD.atrac=estrellasValor.atrac; }
            if(idEdicionActual){ await updateDoc(doc(db,"viajes",idEdicionActual), rD); const idx=datosViajes[pA].findIndex(v=>v.id===idEdicionActual); datosViajes[pA][idx]={id:idEdicionActual,...rD}; mostrarToast("Actualizado"); } else { const dR=await addDoc(collection(db,"viajes"), rD); rD.id=dR.id; if(!datosViajes[pA]) datosViajes[pA]=[]; datosViajes[pA].push(rD); mostrarToast("Guardado"); }
            
            if (esPrimeraVisita) {
                const retoRandom = desafiosNomadas[Math.floor(Math.random() * desafiosNomadas.length)];
                setTimeout(() => mostrarToast(`¡Nueva provincia! Reto Nómada: ${retoRandom}`, 'success'), 3500);
            }

            let numVisitas = datosViajes[pA].filter(v => (v.estado||'VISITADO') === 'VISITADO').length;
            let txtRango = "Aún no explorado";
            if (numVisitas >= 10) txtRango = "👑 Alcalde"; else if (numVisitas >= 5) txtRango = "☕ Caserito"; else if (numVisitas >= 3) txtRango = "🤝 Conocido"; else if (numVisitas >= 1) txtRango = "🎒 Forastero";
            if (rangoProvincia) rangoProvincia.innerText = txtRango;

            renderizarLugares(pA, tituloInfoProvincia.style.webkitTextFillColor); dibujarPinesProvincia(pA);
            if(capaProvincias) capaProvincias.eachLayer(l=>capaProvincias.resetStyle(l)); actualizarProgresoGlobal(); limpiarFormulario(); 
        } catch(e){} btnGuardarRegistro.disabled=false; mensajeCarga.style.display='none';
    };
}

if(btnCerrarInfo) btnCerrarInfo.onclick = () => pantallaInfo.style.display='none';
if(btnVolver) btnVolver.onclick = () => { if(capaProvincias) mapa.removeLayer(capaProvincias); capaNacional.eachLayer(l=>capaNacional.resetStyle(l)); capaNacional.addTo(mapa); mapa.setView([-9.5, -75.01], 5.0); tituloDepartamento.style.display='none'; tituloMapa.style.display='block'; btnVolver.style.display='none'; capaPinesProvincia.clearLayers(); capaPinTemporal.clearLayers(); actualizarProgresoGlobal(); };

function actualizarProgresoGlobal() { if(!datosProvinciasGenerales) return; let vis=0; datosProvinciasGenerales.features.forEach(p=>{ let pl=p.properties.NOMBPROV.trim().toUpperCase(); if(datosViajes[pl]){ const f=datosViajes[pl].filter(pasaFiltros); if(f.some(v=>(v.estado||'VISITADO')==='VISITADO')) vis++; } }); let por=Math.round((vis/datosProvinciasGenerales.features.length)*100); if(vis>0&&por===0)por=1; barraRelleno.style.width=por+'%'; textoProgreso.innerText=por+'%'; mascotaProgreso.style.left=por+'%'; }
function actualizarProgresoDepartamental(nD) { const pr=datosProvinciasGenerales.features.filter(p=>p.properties.FIRST_NOMB.trim().toUpperCase()===nD); let vis=0; pr.forEach(p=>{ let pl=p.properties.NOMBPROV.trim().toUpperCase(); if(datosViajes[pl]){ const f=datosViajes[pl].filter(pasaFiltros); if(f.some(v=>(v.estado||'VISITADO')==='VISITADO')) vis++; } }); let por=pr.length===0?0:Math.round((vis/pr.length)*100); if(vis>0&&por===0)por=1; barraRelleno.style.width=por+'%'; mascotaProgreso.style.left=por+'%'; if(por===100){ barraRelleno.style.background='linear-gradient(90deg,#FFD700,#FFF,#FFD700)'; textoProgreso.innerText='¡DOMINADO!'; if(typeof confetti==='function') confetti({particleCount:250,spread:120,origin:{y:0.5},zIndex:10005}); } else { barraRelleno.style.background='linear-gradient(90deg,#FF1493,#00FA9A,#FFD700)'; textoProgreso.innerText=por+'%'; } }

// 9. RESPALDOS, BUSCADOR Y SESIÓN
if(btnBackup) btnBackup.onclick = () => { const blob=new Blob([JSON.stringify(datosViajes,null,2)],{type:"application/json"}); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=`PeruGo_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
if(btnImportar&&inputImportar) { btnImportar.onclick=()=>inputImportar.click(); inputImportar.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; if(!confirm("⚠️ Restaurar fusionará datos.")) return; const r=new FileReader(); r.onload=async(ev)=>{ try{ const js=JSON.parse(ev.target.result); let p=[]; Object.keys(js).forEach(pr=>js[pr].forEach(v=>{ const rd=doc(db,"viajes",v.id); const d={...v}; delete d.id; p.push(setDoc(rd,d)); })); await Promise.all(p); window.location.reload(); }catch(err){} }; r.readAsText(f); }; }

// EVENTOS DEL BUSCADOR REDISEÑADO TIPO BOTTOM SHEET
if(btnBuscar) btnBuscar.onclick = () => { 
    fondoDashboard.style.display = 'block'; 
    pantallaBuscador.style.display = 'block'; 
    setTimeout(() => pantallaBuscador.classList.add('activo'), 10); 
    inputBuscador.focus(); 
};
window.cerrarBuscador = () => { 
    pantallaBuscador.style.transform = ''; 
    pantallaBuscador.classList.remove('activo'); 
    setTimeout(()=>{ 
        pantallaBuscador.style.display='none'; 
        fondoDashboard.style.display='none'; 
        inputBuscador.value=''; 
        resultadosBuscador.innerHTML=''; 
    }, 400); 
};
habilitarSwipeToClose('#pantalla-buscador', window.cerrarBuscador);

if(inputBuscador) inputBuscador.addEventListener('input', (e) => { clearTimeout(temporizadorBuscador); const tx=e.target.value.toLowerCase().trim(); if(tx.length<2){ resultadosBuscador.innerHTML=''; return; } temporizadorBuscador=setTimeout(()=>{ let h=''; let c=0; Object.keys(datosViajes).forEach(p=>datosViajes[p].forEach(v=>{ const sr=`${v.nombre||''} ${v.info||''} ${p}`.toLowerCase(); if(sr.includes(tx)){ const dF=datosProvinciasGenerales.features.find(x=>x.properties.NOMBPROV.trim().toUpperCase()===p); const nD=dF?dF.properties.FIRST_NOMB:''; h+=`<div class="resultado-item" onclick="volarAProvincia('${p}','${nD}')"><h4>${v.nombre} <span style="color:#FFD700;">(${p})</span></h4><p>${v.fecha||''}</p></div>`; c++; } })); resultadosBuscador.innerHTML=c===0?'<p>No se encontraron.</p>':h; }, 300); });

window.volarAProvincia = (nP, nD) => { 
    cerrarBuscador(); 
    const f={type:"FeatureCollection",features:datosProvinciasGenerales.features.filter(p=>p.properties.FIRST_NOMB.trim().toUpperCase()===nD.trim().toUpperCase())}; 
    if(capaProvincias) mapa.removeLayer(capaProvincias); 
    capaNacional.eachLayer(l=>capaNacional.resetStyle(l)); 
    capaProvincias=L.geoJSON(f,{
        style:function(fP){ 
            const nPr=fP.properties.NOMBPROV.trim().toUpperCase(); 
            const c=coloresChichaPremium[nPr.length%coloresChichaPremium.length]; 
            let hV=false; let hW=false; 
            if(datosViajes[nPr]){ 
                const fil=datosViajes[nPr].filter(pasaFiltros); 
                hV=fil.some(v=>(v.estado||'VISITADO')==='VISITADO'); 
                hW=fil.some(v=>v.estado==='WISHLIST'); 
            } 
            const opV = sateliteActivo ? 0.05 : 0.35;
            const opW = sateliteActivo ? 0.05 : 0.15;
            const opN = sateliteActivo ? 0.05 : 0.7;

            if(hV) return {color:c,weight:3,fillColor:c,fillOpacity:opV,className:'poligono-vidrio'}; 
            else if(hW) return {color:"#00FFFF",weight:2,fillColor:"#00FFFF",fillOpacity:opW,className:'poligono-wishlist'}; 
            else return {color:"#444",weight:2,fillColor:"#111",fillOpacity:opN,className:'poligono-raspadita'}; 
        }, 
        onEachFeature:function(fP,lP){ const nPr=fP.properties.NOMBPROV; const c=coloresChichaPremium[nPr.length%coloresChichaPremium.length]; lP.bindTooltip(`<span style="color:${c};">${nPr}</span>`,{permanent:true,direction:'center',className:'etiqueta-provincia',interactive:false}); lP.on('click',()=>abrirInformacionProvincia(nPr,c)); } 
    }).addTo(mapa); 
    mapa.fitBounds(L.geoJSON(f).getBounds()); mapa.removeLayer(capaNacional); tituloMapa.style.display='none'; tituloDepartamento.innerText=nD; tituloDepartamento.style.display='block'; btnVolver.style.display='inline-block'; actualizarProgresoDepartamental(nD.trim().toUpperCase()); abrirInformacionProvincia(nP, coloresChichaPremium[nP.length%coloresChichaPremium.length]); 
};

// 10. CONTROLADORES PRINCIPALES DE SESIÓN
if(btnIngresar) btnIngresar.onclick = async () => { if(audioAmbiental.paused){ audioAmbiental.play().catch(()=>{}); audioAmbiental.pause(); } const em=inputEmail.value.trim(); const pw=inputPass.value; if(!em||!pw) return avatarGuia.src='./assets/img/mascota-triste.webp'; try { await signInWithEmailAndPassword(auth, em, pw); avatarGuia.src='./assets/img/mascota-feliz.webp'; setTimeout(()=>{ pantallaAcceso.style.opacity='0'; setTimeout(()=>{ pantallaAcceso.style.display='none'; pantallaCarga.style.display='flex'; contenedorMapa.style.display='block'; tituloMapa.style.display='block'; contenedorProgreso.style.display='block'; reproducirMusicaAleatoria(); inicializarMapa(); },800); },600); } catch(e){ avatarGuia.src='./assets/img/mascota-triste.webp'; inputPass.value=''; } };
btnMute.onclick = () => { if(audioAmbiental.paused) audioAmbiental.play().catch(()=>{}); audioAmbiental.muted=!audioAmbiental.muted; btnMute.textContent=audioAmbiental.muted?'🔇':'🔊'; };
const btnActualizar=document.getElementById('btn-actualizar-app'); if(btnActualizar) btnActualizar.onclick=()=>{ if('caches' in window){ caches.keys().then(ns=>Promise.all(ns.map(n=>caches.delete(n))).then(()=>window.location.reload(true))); }else window.location.reload(true); };
if(btnCerrarSesion) btnCerrarSesion.onclick=async()=>{ await signOut(auth); window.location.reload(); };

onAuthStateChanged(auth, (u) => {
    if(u) { 
        pantallaAcceso.style.display='none'; 
        pantallaCarga.style.display='flex'; 
        contenedorMapa.style.display='block'; 
        tituloMapa.style.display='block'; 
        contenedorProgreso.style.display='block'; 
        inicializarMapa(); 
        if(!audioAmbiental.src) reproducirMusicaAleatoria(); 
        document.body.addEventListener('click', ()=>{ if(audioAmbiental.paused&&!audioAmbiental.muted) audioAmbiental.play().catch(()=>{}); }, {once:true}); 
    } else { 
        pantallaAcceso.style.display='flex'; 
        pantallaAcceso.style.opacity='1'; 
        pantallaCarga.style.display='none'; 
        contenedorMapa.style.display='none'; 
        tituloMapa.style.display='none'; 
        contenedorProgreso.style.display='none'; 
    }
});

window.toggleAcordeon=(id)=>{ const b=document.getElementById(`body-${id}`); const f=document.getElementById(`flecha-${id}`); if(b&&f){ b.classList.toggle('abierto'); f.classList.toggle('rotada'); } };
if(selectTipo) selectTipo.addEventListener('change', (e)=>{ camposTrabajo.style.display='none'; camposPersonal.style.display='none'; camposFutbol.style.display='none'; if(e.target.value==='TRABAJO') camposTrabajo.style.display='block'; else if(e.target.value==='FUTBOL') camposFutbol.style.display='block'; else camposPersonal.style.display='block'; });
window.abrirVisorFotos=(u)=>{ const v=document.getElementById('visor-fotos'); const i=document.getElementById('img-visor'); if(v&&i){ i.src=u; v.style.display='flex'; v.style.transform=''; setTimeout(()=>v.style.opacity='1',10); } };
window.cerrarVisorFotos=()=>{ const v=document.getElementById('visor-fotos'); const i=document.getElementById('img-visor'); if(v&&i){ v.style.opacity='0'; setTimeout(()=>{ v.style.display='none'; i.src=''; },300); } };
