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
const vistaExplorarLugares = document.getElementById('vista-explorar-lugares');
const tabsVisitasBar = document.getElementById('tabs-visitas');
const badgeModoCabina = document.querySelector('.cabina-badge-mode');
const scannerChamber = document.querySelector('.scanner-chamber');
const exifPillTag = document.querySelector('.exif-pill-tag');
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

// Hub Radial y Anillo de Progreso SVG
const barraNavegacion = document.getElementById('contenedor-bottom-bar');
const btnToggleRadial = document.getElementById('btn-toggle-radial');
const dockMenuRadial = document.getElementById('dock-menu-radial');
const radialDisc = document.getElementById('radial-disc');
const anilloProgresoSvg = document.getElementById('anillo-progreso-svg');
const textoProgreso = document.getElementById('texto-progreso');

const btnMute = document.getElementById('btn-mute');
const svgAudioOn = document.getElementById('svg-audio-on');
const svgAudioOff = document.getElementById('svg-audio-off');
const btnFiltro = document.getElementById('btn-filtro');
const labelDockFiltro = document.getElementById('label-dock-filtro');
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
const pantallaBuscador = document.getElementById('pantalla-buscador');
const inputBuscador = document.getElementById('input-buscador');
const resultadosBuscador = document.getElementById('resultados-buscador');
const buscadorQuickTags = document.getElementById('buscador-quick-tags');

const btnBackup = document.getElementById('btn-backup');
const btnImportar = document.getElementById('btn-importar');
const inputImportar = document.getElementById('input-importar');
const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
const formRegistro = document.getElementById('formulario-registro');
const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const mensajeCarga = document.getElementById('mensaje-carga');
const camposTrabajo = document.getElementById('campos-trabajo');
const camposPersonal = document.getElementById('campos-personal');
const camposFutbol = document.getElementById('campos-futbol');
const btnWrapped = document.getElementById('btn-wrapped');
const btnRuleta = document.getElementById('btn-ruleta');

// 3. ESTADO GLOBAL
let diccCentrosProvincias = {};
let idEdicionActual = null;
let seleccionClima = '';
let seleccionTransporte = '';
let estrellasValor = { empresa: 0, gastro: 0, hosp: 0, atrac: 0, ambiente: 0 };
let filtroActualMundo = 'TODOS';
let filtroFechaInicio = null;
let filtroFechaFin = null;
let capaNacional;
let capaProvincias;
let mapa;
let datosGeoJSON = null;
let datosProvinciasGenerales = null;
let datosViajes = {}; 
let temporizadorBuscador;
let capaSatelite;
let sateliteActivo = false;
let capaPinesProvincia;
let capaPinTemporal;
let tempLat = null;
let tempLng = null;
let seleccionandoUbicacion = false;
let markerDraggable = null;
let mapaYaInicializado = false;
let tabVisitaActiva = 'TODAS';
let menuRadialAbierto = false;

const CIRCUNFERENCIA_ANILLO = 220; // 2 * PI * 35
const coloresChichaPremium = [ "#FF1493", "#00FA9A", "#FFD700", "#00FFFF", "#FF4500", "#9400D3" ];
const coloresFrecuencia = {
    'TODOS': '#00FFFF',
    'TRABAJO': '#FF4500',
    'PERSONAL': '#00FA9A',
    'FUTBOL': '#FF1493',
    'SABOR': '#FFD700'
};
const audios = [ './assets/audio/musica-uno.mp3', './assets/audio/musica-dos.mp3', './assets/audio/musica-tres.mp3' ];
const audioAmbiental = new Audio();
const nombresFiltro = { 'TODOS': 'Capas', 'TRABAJO': 'Obras', 'PERSONAL': 'Rutas', 'FUTBOL': 'Tribuna', 'SABOR': 'Sabor 5★' };

const desafiosNomadas = [
    "Prueba el plato o bebida más rara que encuentres en el mercado local.",
    "Busca el punto más alto del lugar y toma una foto panorámica.",
    "Pregúntale a un local sobre un mito o leyenda de esta zona.",
    "Tómate un selfie curioso con el letrero de bienvenida o la Plaza de Armas.",
    "Encuentra una calle sin asfaltar y anota algo que te llame la atención."
];

// 4. UTILIDADES, HÁPTICA PROGRESIVA, TILT 3D Y EXIF
function feedbackHaptico(patron = 12) {
    if (navigator.vibrate) {
        try { navigator.vibrate(patron); } catch (e) {}
    }
}

function escaparHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function pasaFiltros(viaje) {
    const vTipo = viaje.tipo || 'PERSONAL';
    if (filtroActualMundo === 'SABOR') return viaje.gastro === 5; 
    if (filtroActualMundo !== 'TODOS' && vTipo !== filtroActualMundo) return false;
    if (filtroFechaInicio && (!viaje.fecha || viaje.fecha < filtroFechaInicio)) return false;
    if (filtroFechaFin && (!viaje.fecha || viaje.fecha > filtroFechaFin)) return false;
    return true;
}

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = tipo === 'success' ? `✅ ${escaparHTML(mensaje)}` : `⚠️ ${escaparHTML(mensaje)}`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000); 
}

// Efecto 3D Holográfico para tarjetas Bento y Wrapped VIP
function activarTiltHolografico(selector) {
    document.querySelectorAll(selector).forEach(card => {
        const aplicarRotacion = (clientX, clientY) => {
            const rect = card.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const rotX = ((y - rect.height / 2) / (rect.height / 2)) * -7;
            const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 7;
            card.style.transform = `perspective(650px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.015)`;
        };
        const resetearRotacion = () => {
            card.style.transform = '';
        };
        card.addEventListener('mousemove', (e) => aplicarRotacion(e.clientX, e.clientY));
        card.addEventListener('mouseleave', resetearRotacion);
        card.addEventListener('touchmove', (e) => {
            if (e.touches[0]) aplicarRotacion(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchend', resetearRotacion);
    });
}

function habilitarSwipeToClose(elSel, cb) {
    const el = document.querySelector(elSel);
    if (!el) return;
    let startY = 0;
    let currentY = 0;
    const esFloating = el.classList.contains('modal-floating-sheet');
    const esSpotlight = el.classList.contains('spotlight-command-center');

    el.addEventListener('touchstart', (e) => {
        if (el.scrollTop <= 0) startY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
        if (!startY) return;
        currentY = e.touches[0].clientY;
        const diffY = currentY - startY;
        if (esSpotlight && diffY < 0) {
            el.style.transition = 'none';
            el.style.transform = `translate(-50%, ${diffY}px)`;
        } else if (!esSpotlight && diffY > 0) {
            el.style.transition = 'none';
            el.style.transform = esFloating
                ? `translate(-50%, ${diffY}px)`
                : `translateY(${diffY}px)`;
        }
    }, { passive: true });

    el.addEventListener('touchend', () => {
        if (!startY || !currentY) return;
        const diffY = currentY - startY;
        el.style.transition = '';
        if ((esSpotlight && diffY < -85) || (!esSpotlight && diffY > 110)) cb();
        else el.style.transform = '';
        startY = 0;
        currentY = 0;
    });
}

function mostrarSkeletonLoading() {
    contenedorLugares.innerHTML = `
        <div class="esqueleto" style="height: 76px; margin: 10px 0;"></div>
        <div class="esqueleto" style="height: 76px; margin: 10px 0; opacity: 0.55;"></div>
    `;
}

// =========================================
// CONTROL DEL ORBE RADIAL Y ANILLO SVG
// =========================================
function actualizarAnilloOrbe(porcentaje, dominado = false) {
    const pct = Math.max(0, Math.min(100, porcentaje));
    if (anilloProgresoSvg) {
        const offset = CIRCUNFERENCIA_ANILLO - (pct / 100) * CIRCUNFERENCIA_ANILLO;
        anilloProgresoSvg.style.strokeDashoffset = offset;
        anilloProgresoSvg.style.stroke = dominado ? '#FFD700' : 'url(#chichaGrad)';
    }
    if (textoProgreso) {
        textoProgreso.innerText = dominado ? '👑 100%' : `${pct}%`;
        textoProgreso.style.color = dominado ? '#00FA9A' : '#FFD700';
        textoProgreso.style.borderColor = dominado ? '#00FA9A' : 'rgba(255, 215, 0, 0.6)';
    }
}

function cerrarMenuRadial() {
    if (!menuRadialAbierto) return;
    menuRadialAbierto = false;
    if (dockMenuRadial) dockMenuRadial.classList.remove('activo');
    if (radialDisc) radialDisc.classList.remove('activo');
    if (btnToggleRadial) btnToggleRadial.classList.remove('abierto');
    if (fondoDashboard && !pantallaDashboard.classList.contains('activo') && !pantallaFiltros.classList.contains('activo') && !pantallaBuscador.classList.contains('activo')) {
        fondoDashboard.style.display = 'none';
    }
}

if (btnToggleRadial) {
    btnToggleRadial.onclick = (e) => {
        e.stopPropagation();
        feedbackHaptico(16);
        menuRadialAbierto = !menuRadialAbierto;
        if (dockMenuRadial) dockMenuRadial.classList.toggle('activo', menuRadialAbierto);
        if (radialDisc) radialDisc.classList.toggle('activo', menuRadialAbierto);
        btnToggleRadial.classList.toggle('abierto', menuRadialAbierto);
        if (menuRadialAbierto) {
            fondoDashboard.style.display = 'block';
            fondoDashboard.style.zIndex = '1000';
        } else {
            fondoDashboard.style.display = 'none';
        }
    };
}

if (fondoDashboard) {
    fondoDashboard.onclick = () => {
        cerrarMenuRadial();
        window.cerrarDashboard();
        window.cerrarFiltros();
        window.cerrarBuscador();
    };
}

// =========================================
// CONTROLES SEGMENTADOS Y ESCÁNER LÁSER EXIF
// =========================================
function vincularGrupoBotones(contenedorId, inputHiddenId, claseActiva, callbackCambio = null) {
    const cont = document.getElementById(contenedorId);
    const input = document.getElementById(inputHiddenId);
    if (!cont || !input) return;
    cont.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            feedbackHaptico(10);
            cont.querySelectorAll('button').forEach(b => b.classList.remove(claseActiva));
            btn.classList.add(claseActiva);
            input.value = btn.dataset.valor;
            if (callbackCambio) callbackCambio(btn.dataset.valor);
        });
    });
}

function actualizarPanelesPorTipo(valorTipo) {
    camposTrabajo.style.display = 'none';
    camposPersonal.style.display = 'none';
    camposFutbol.style.display = 'none';
    if (valorTipo === 'TRABAJO') camposTrabajo.style.display = 'block';
    else if (valorTipo === 'FUTBOL') camposFutbol.style.display = 'block';
    else camposPersonal.style.display = 'block';
}

vincularGrupoBotones('seg-estado', 'nuevo-estado', 'activo');
vincularGrupoBotones('seg-tipo', 'nuevo-tipo', 'activo', actualizarPanelesPorTipo);
vincularGrupoBotones('seg-compania', 'nueva-compania', 'activo');
vincularGrupoBotones('seg-proyecto', 'nuevo-tipo-proyecto', 'activo');

function setValorGrupoBotones(contenedorId, inputHiddenId, valor, claseActiva) {
    const cont = document.getElementById(contenedorId);
    const input = document.getElementById(inputHiddenId);
    if (!cont || !input) return;
    input.value = valor;
    cont.querySelectorAll('button').forEach(b => {
        b.classList.toggle(claseActiva, b.dataset.valor === valor);
    });
}

async function obtenerAltitudZ(lat, lng, silencioso = false) {
    const inputAlt = document.getElementById('nueva-altitud');
    try {
        const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
        const d = await r.json();
        if (d && Array.isArray(d.elevation) && d.elevation[0] !== undefined) {
            const cota = Math.round(d.elevation[0]);
            if (inputAlt) inputAlt.value = cota;
            if (!silencioso) mostrarToast(`Cota Z calculada: ${cota} msnm ⛰️`, "success");
            return cota;
        }
    } catch (e) {
        console.warn("No se pudo consultar la elevación automática:", e);
    }
    return null;
}

async function extraerMetadatosEXIF(file) {
    if (typeof window.exifr === 'undefined' || !file) return;
    try {
        if (exifPillTag) exifPillTag.innerText = "🔍 ESCANEANDO...";
        const meta = await window.exifr.parse(file, { gps: true, exif: true, tiff: true });
        if (!meta) {
            if (exifPillTag) exifPillTag.innerText = "⚡ AUTO-EXIF + Z";
            return;
        }

        let hallazgos = [];
        const fechaFoto = meta.DateTimeOriginal || meta.CreateDate;
        const inputFecha = document.getElementById('nueva-fecha');
        if (fechaFoto instanceof Date && !isNaN(fechaFoto) && inputFecha && !inputFecha.value) {
            const yyyy = fechaFoto.getFullYear();
            const mm = String(fechaFoto.getMonth() + 1).padStart(2, '0');
            const dd = String(fechaFoto.getDate()).padStart(2, '0');
            inputFecha.value = `${yyyy}-${mm}-${dd}`;
            hallazgos.push(`Fecha (${dd}/${mm}/${yyyy})`);
        }

        if (typeof meta.latitude === 'number' && typeof meta.longitude === 'number' && !isNaN(meta.latitude) && !isNaN(meta.longitude)) {
            tempLat = meta.latitude;
            tempLng = meta.longitude;
            const inputCoord = document.getElementById('nueva-coordenada');
            if (inputCoord) inputCoord.value = `${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`;

            if (capaPinTemporal) {
                capaPinTemporal.clearLayers();
                L.marker([tempLat, tempLng], {
                    icon: L.divIcon({ className: 'chinche-premium', html: '📍', iconSize: [30, 30], iconAnchor: [15, 15] })
                }).addTo(capaPinTemporal);
            }
            hallazgos.push("GPS");

            const inputAlt = document.getElementById('nueva-altitud');
            if (typeof meta.GPSAltitude === 'number' && !isNaN(meta.GPSAltitude) && meta.GPSAltitude > 0) {
                const cotaExif = Math.round(meta.GPSAltitude);
                if (inputAlt) inputAlt.value = cotaExif;
                hallazgos.push(`Z: ${cotaExif}m`);
            } else {
                const cotaDem = await obtenerAltitudZ(tempLat, tempLng, true);
                if (cotaDem !== null) hallazgos.push(`Z: ${cotaDem}m`);
            }
        }

        if (hallazgos.length > 0) {
            feedbackHaptico([20, 45, 35]);
            if (scannerChamber) {
                scannerChamber.style.borderColor = '#00FA9A';
                scannerChamber.style.boxShadow = '0 0 25px rgba(0, 250, 154, 0.28)';
            }
            if (exifPillTag) exifPillTag.innerText = "✅ TELEMETRÍA OK";
            mostrarToast(`📸 EXIF: ${hallazgos.join(' • ')}`, 'success');
        } else {
            if (exifPillTag) exifPillTag.innerText = "⚡ AUTO-EXIF + Z";
        }
    } catch (err) {
        if (exifPillTag) exifPillTag.innerText = "⚡ AUTO-EXIF + Z";
        console.warn("No se pudieron extraer datos EXIF:", err);
    }
}

function configurarPreviewFoto(inputId, previewId, txtId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const txt = document.getElementById(txtId);
    if (!input || !preview || !txt) return;
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            txt.style.display = 'none';
            await extraerMetadatosEXIF(file);
        }
    });
}
configurarPreviewFoto('foto-1', 'preview-foto-1', 'txt-foto-1');
configurarPreviewFoto('foto-2', 'preview-foto-2', 'txt-foto-2');

async function comprimirYSubirImagen(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onerror = () => rej(new Error("Error leyendo la imagen"));
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onerror = () => rej(new Error("Formato de imagen inválido"));
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1200;
                const scale = MAX / img.width;
                canvas.width = img.width > MAX ? MAX : img.width;
                canvas.height = img.width > MAX ? img.height * scale : img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    const fd = new FormData();
                    fd.append('image', blob, 'foto.jpg');
                    try {
                        const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: fd });
                        const d = await r.json();
                        if (d && d.data && d.data.url) res(d.data.url);
                        else rej(new Error("Respuesta inválida de ImgBB"));
                    } catch (e) {
                        rej(e);
                    }
                }, 'image/jpeg', 0.82); 
            };
        };
    });
}

function comprobarEfemerides() {
    const hoy = new Date();
    const mesDia = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    let hallado = null;
    let anios = 0;
    Object.values(datosViajes).forEach(p => p.forEach(v => {
        if (v.fecha && (v.estado || 'VISITADO') === 'VISITADO' && !hallado) {
            const part = v.fecha.split('-');
            if (part.length === 3 && `${part[1]}-${part[2]}` === mesDia && parseInt(part[0]) < hoy.getFullYear()) {
                hallado = v;
                anios = hoy.getFullYear() - parseInt(part[0]);
            }
        }
    }));
    if (hallado) setTimeout(() => mostrarToast(`Cápsula del Tiempo: Hace ${anios} año(s) estabas en ${hallado.nombre} 🕰️`, 'success'), 2000);
}

// =========================================
// 5. INICIALIZACIÓN MAPA Y DIALES TÁCTILES
// =========================================
function insertarTarjetaLugarSegura(htmlString) {
    contenedorLugares.insertAdjacentHTML('beforeend', htmlString);
}

document.querySelectorAll('.btn-opcion:not(#filtro-categoria .btn-opcion)').forEach(btn => {
    btn.onclick = function() {
        feedbackHaptico(10);
        const parent = this.parentElement;
        parent.querySelectorAll('.btn-opcion').forEach(b => b.classList.remove('seleccionado'));
        this.classList.add('seleccionado');
        if (parent.id === 'selector-clima') seleccionClima = this.dataset.valor;
        if (parent.id === 'selector-transporte') seleccionTransporte = this.dataset.valor;
    };
});

// Diales de estrellas con vibración háptica progresiva
function inicializarEstrellas(id, clave) {
    const c = document.getElementById(id);
    if (!c) return;
    const s = c.querySelectorAll('span');
    s.forEach((e, idx) => {
        e.onclick = () => {
            const nivel = idx + 1;
            feedbackHaptico(nivel === 5 ? [15, 30, 25] : 8 + nivel * 4);
            estrellasValor[clave] = nivel;
            s.forEach((x, i) => { x.classList.toggle('activa', i <= idx); });
        };
    });
}
['empresa', 'gastro', 'hosp', 'atrac', 'ambiente'].forEach(k => inicializarEstrellas(`estrellas-${k}`, k));

function resetUIFormulario() {
    document.querySelectorAll('#formulario-registro .btn-opcion').forEach(b => b.classList.remove('seleccionado'));
    document.querySelectorAll('.contenedor-estrellas span').forEach(s => s.classList.remove('activa'));
    seleccionClima = '';
    seleccionTransporte = '';
    estrellasValor = { empresa: 0, gastro: 0, hosp: 0, atrac: 0, ambiente: 0 };

    setValorGrupoBotones('seg-estado', 'nuevo-estado', 'VISITADO', 'activo');
    setValorGrupoBotones('seg-tipo', 'nuevo-tipo', 'PERSONAL', 'activo');
    setValorGrupoBotones('seg-compania', 'nueva-compania', 'Solo', 'activo');
    setValorGrupoBotones('seg-proyecto', 'nuevo-tipo-proyecto', 'Topografía', 'activo');
    actualizarPanelesPorTipo('PERSONAL');

    if (scannerChamber) {
        scannerChamber.style.borderColor = '';
        scannerChamber.style.boxShadow = '';
    }
    if (exifPillTag) exifPillTag.innerText = "⚡ AUTO-EXIF + Z";

    ['1', '2'].forEach(n => {
        const prev = document.getElementById(`preview-foto-${n}`);
        const txt = document.getElementById(`txt-foto-${n}`);
        if (prev) { prev.src = ''; prev.style.display = 'none'; }
        if (txt) txt.style.display = 'flex';
    });
}

function reproducirMusicaAleatoria() {
    audioAmbiental.src = audios[Math.floor(Math.random() * audios.length)];
    audioAmbiental.play().catch(() => {});
}
audioAmbiental.addEventListener('ended', reproducirMusicaAleatoria);

async function obtenerViajesDeFirebase() {
    const obj = {};
    try {
        const q = await getDocs(collection(db, "viajes"));
        q.forEach(d => {
            const data = d.data();
            if (!data.provincia) return;
            const p = data.provincia.trim().toUpperCase();
            if (!obj[p]) obj[p] = [];
            obj[p].push({ id: d.id, ...data });
        });
    } catch (e) {
        console.error("Error cargando viajes de Firebase:", e);
        mostrarToast("Modo Offline: Cargando caché local", "error");
    }
    return obj;
}

function obtenerEstiloProvincia(fP) {
    const nP = fP.properties.NOMBPROV.trim().toUpperCase();
    const c = coloresChichaPremium[fP.properties.NOMBPROV.length % coloresChichaPremium.length];
    let hasV = false;
    let hasW = false;
    if (datosViajes[nP]) {
        const filtrados = datosViajes[nP].filter(pasaFiltros);
        hasV = filtrados.some(v => (v.estado || 'VISITADO') === 'VISITADO');
        hasW = filtrados.some(v => v.estado === 'WISHLIST');
    }
    const opV = sateliteActivo ? 0.14 : 0.4;
    const opW = sateliteActivo ? 0.08 : 0.18;
    const opN = sateliteActivo ? 0.05 : 0.8;

    if (hasV) return { color: c, weight: 2.8, fillColor: c, fillOpacity: opV, className: 'poligono-vidrio' };
    else if (hasW) return { color: "#00FFFF", weight: 2, fillColor: "#00FFFF", fillOpacity: opW, className: 'poligono-wishlist' };
    else return { color: "#26354d", weight: 1.4, fillColor: "#060911", fillOpacity: opN, className: 'poligono-raspadita' };
}

function renderizarCapaDepartamento(nD, ajustarVista = true) {
    if (capaNacional) mapa.removeLayer(capaNacional);
    if (capaProvincias) mapa.removeLayer(capaProvincias);

    const filt = {
        type: "FeatureCollection",
        features: datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nD.trim().toUpperCase())
    };

    capaProvincias = L.geoJSON(filt, {
        style: obtenerEstiloProvincia,
        onEachFeature: function(fP, lP) {
            const nP = fP.properties.NOMBPROV;
            const c = coloresChichaPremium[nP.length % coloresChichaPremium.length];
            lP.bindTooltip(`<span style="color: ${c};">${nP}</span>`, {
                permanent: true,
                direction: 'center',
                className: 'etiqueta-provincia',
                interactive: false
            });
            lP.on('click', () => {
                feedbackHaptico(12);
                abrirInformacionProvincia(nP, c);
            });
        }
    }).addTo(mapa);

    if (ajustarVista) {
        mapa.fitBounds(capaProvincias.getBounds());
    }
    tituloMapa.style.display = 'none';
    tituloDepartamento.innerText = nD;
    tituloDepartamento.style.display = 'block';
    btnVolver.style.display = 'flex';
    actualizarProgresoDepartamental(nD.trim().toUpperCase());
}

function inicializarMapa() {
    if (mapaYaInicializado) return;
    mapaYaInicializado = true;
    mapa = L.map('map', {
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false,
        touchZoom: true,
        attributionControl: false
    }).setView([-9.5, -75.01], 5.0);

    capaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });
    capaPinesProvincia = L.layerGroup().addTo(mapa);
    capaPinTemporal = L.layerGroup().addTo(mapa);

    mapa.on('click', (e) => {
        if (seleccionandoUbicacion) {
            feedbackHaptico(15);
            tempLat = e.latlng.lat;
            tempLng = e.latlng.lng;
            capaPinTemporal.clearLayers();
            const icon = L.divIcon({ className: 'chinche-premium', html: '📍', iconSize: [30, 30], iconAnchor: [15, 15] });
            markerDraggable = L.marker([tempLat, tempLng], { icon: icon, draggable: true }).addTo(capaPinTemporal);
            markerDraggable.on('dragend', function(ev) {
                tempLat = ev.target.getLatLng().lat;
                tempLng = ev.target.getLatLng().lng;
            });
            mostrarToast("Chinche colocado. Arrástralo o confirma.", "success");
        }
    });

    Promise.all([
        obtenerViajesDeFirebase(),
        fetch('./data/peru_provincial_simple.geojson').then(r => r.json()),
        fetch('./data/peru_departamental_simple.geojson').then(r => r.json())
    ]).then(([v, p, d]) => { 
        datosViajes = v;
        datosProvinciasGenerales = p;
        datosGeoJSON = d;
        L.geoJSON(p, {
            onEachFeature: function(f, l) {
                diccCentrosProvincias[f.properties.NOMBPROV.trim().toUpperCase()] = l.getBounds().getCenter();
            }
        });
        dibujarMapaNacional();
        actualizarProgresoGlobal();
        pantallaCarga.style.display = 'none';
        if (barraNavegacion) barraNavegacion.style.display = 'flex';
        if (btnMute) btnMute.style.display = 'flex';
        comprobarEfemerides(); 
    }).catch(err => {
        console.error("Error inicializando el mapa:", err);
        mostrarToast("Error cargando cartografía", "error");
    });
}

function dibujarMapaNacional() {
    capaNacional = L.geoJSON(datosGeoJSON, {
        style: function (f) {
            const nomD = f.properties.NOMBDEP.trim().toUpperCase();
            const provs = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nomD);
            let visitadas = 0;
            let wishlist = 0;
            for (let p of provs) {
                let nP = p.properties.NOMBPROV.trim().toUpperCase();
                if (datosViajes[nP]) {
                    const filt = datosViajes[nP].filter(pasaFiltros);
                    if (filt.some(v => (v.estado || 'VISITADO') === 'VISITADO')) visitadas++;
                    else if (filt.some(v => v.estado === 'WISHLIST')) wishlist++;
                }
            }
            const colDep = coloresChichaPremium[nomD.length % coloresChichaPremium.length];
            if (visitadas === provs.length && provs.length > 0) return { color: "#FFFFFF", weight: 3, fillColor: "#FFD700", fillOpacity: 0.65, className: 'poligono-dorado' };
            else if (visitadas > 0) return { color: colDep, weight: 2.6, fillColor: colDep, fillOpacity: 0.38, className: 'poligono-vidrio' }; 
            else if (wishlist > 0) return { color: "#00FFFF", weight: 2, fillColor: "#00FFFF", fillOpacity: 0.16, className: 'poligono-wishlist' };
            else return { color: "#26354d", weight: 1.2, fillColor: "#070b12", fillOpacity: 0.84, className: 'poligono-raspadita' }; 
        },
        onEachFeature: function (f, l) {
            l.on('click', function () {
                feedbackHaptico(12);
                const nD = f.properties.NOMBDEP;
                l.setStyle({ color: "#FFFFFF", weight: 4, fillOpacity: 0.55 });
                setTimeout(() => renderizarCapaDepartamento(nD, true), 260);
            });
        }
    }).addTo(mapa);
}

if (btnCapas) { 
    btnCapas.onclick = () => { 
        feedbackHaptico(12);
        if (sateliteActivo) { 
            mapa.removeLayer(capaSatelite); 
            btnCapas.classList.remove('activo');
        } else { 
            capaSatelite.addTo(mapa); 
            capaSatelite.bringToBack(); 
            btnCapas.classList.add('activo');
        } 
        sateliteActivo = !sateliteActivo; 
        if (capaProvincias) {
            capaProvincias.eachLayer(l => capaProvincias.resetStyle(l));
        }
        cerrarMenuRadial();
    }; 
}

// =========================================
// 6. FILTROS CAMALEÓN, STATS 3D, RULETA Y WRAPPED VIP
// =========================================
document.querySelectorAll('#filtro-categoria .btn-opcion').forEach(btn => {
    btn.onclick = () => {
        feedbackHaptico(12);
        document.querySelectorAll('#filtro-categoria .btn-opcion').forEach(b => b.classList.remove('seleccionado'));
        btn.classList.add('seleccionado');
    };
});

window.cerrarFiltros = () => {
    pantallaFiltros.style.transform = '';
    pantallaFiltros.classList.remove('activo');
    setTimeout(() => {
        pantallaFiltros.style.display = 'none';
        fondoDashboard.style.display = 'none';
    }, 350);
};

if (btnFiltro) {
    btnFiltro.onclick = () => {
        feedbackHaptico(12);
        cerrarMenuRadial();
        fondoDashboard.style.display = 'block';
        fondoDashboard.style.zIndex = '9999';
        pantallaFiltros.style.display = 'block';
        setTimeout(() => pantallaFiltros.classList.add('activo'), 10);
    };
}
if (btnCerrarFiltros) btnCerrarFiltros.onclick = window.cerrarFiltros;
habilitarSwipeToClose('#pantalla-filtros', window.cerrarFiltros);

function sincronizarLuzFrecuencia(modo) {
    const col = coloresFrecuencia[modo] || '#FFD700';
    if (btnFiltro) {
        btnFiltro.style.setProperty('--sat-color', col);
    }
    const orbInner = document.querySelector('.orb-inner-circle');
    if (orbInner) {
        orbInner.style.boxShadow = modo === 'TODOS'
            ? 'inset 0 2px 4px rgba(255, 255, 255, 0.65), 0 0 18px rgba(0, 255, 255, 0.3)'
            : `inset 0 2px 4px rgba(255, 255, 255, 0.75), 0 0 28px ${col}`;
    }
}

if (btnLimpiarFiltros) {
    btnLimpiarFiltros.onclick = () => {
        feedbackHaptico(12);
        document.querySelectorAll('#filtro-categoria .btn-opcion').forEach(b => b.classList.remove('seleccionado'));
        document.querySelector('#filtro-categoria .btn-opcion[data-valor="TODOS"]').classList.add('seleccionado');
        inputFiltroInicio.value = '';
        inputFiltroFin.value = '';
        filtroActualMundo = 'TODOS';
        filtroFechaInicio = null;
        filtroFechaFin = null;
        if (labelDockFiltro) labelDockFiltro.innerText = 'Capas';
        btnFiltro.classList.remove('activo');
        sincronizarLuzFrecuencia('TODOS');
        mostrarToast("Frecuencia global restaurada");
        refrescarMundoLocal();
        window.cerrarFiltros();
    };
}

if (btnAplicarFiltros) {
    btnAplicarFiltros.onclick = () => {
        feedbackHaptico([14, 30, 18]);
        const cat = document.querySelector('#filtro-categoria .btn-opcion.seleccionado');
        filtroActualMundo = cat ? cat.dataset.valor : 'TODOS';
        filtroFechaInicio = inputFiltroInicio.value || null;
        filtroFechaFin = inputFiltroFin.value || null;
        const hayFiltroActivo = (filtroActualMundo !== 'TODOS' || filtroFechaInicio || filtroFechaFin);
        if (labelDockFiltro) labelDockFiltro.innerText = nombresFiltro[filtroActualMundo] || 'Capas';
        btnFiltro.classList.toggle('activo', Boolean(hayFiltroActivo));
        sincronizarLuzFrecuencia(filtroActualMundo);
        mostrarToast(`Capa sintonizada: ${nombresFiltro[filtroActualMundo] || 'Global'}`);
        refrescarMundoLocal();
        window.cerrarFiltros();
    };
}

function refrescarMundoLocal() {
    if (capaNacional && btnVolver.style.display === 'none') {
        capaNacional.eachLayer(l => capaNacional.resetStyle(l));
        actualizarProgresoGlobal();
    } else if (capaProvincias) {
        capaProvincias.eachLayer(l => capaProvincias.resetStyle(l));
        actualizarProgresoDepartamental(tituloDepartamento.innerText.trim().toUpperCase());
    }
}

document.querySelectorAll('.btn-tab-visita').forEach(btn => {
    btn.onclick = () => {
        feedbackHaptico(10);
        document.querySelectorAll('.btn-tab-visita').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        tabVisitaActiva = btn.dataset.tab;
        const nomL = tituloInfoProvincia.innerText.trim().toUpperCase();
        const col = tituloInfoProvincia.style.color || '#00FFFF';
        renderizarLugares(nomL, col);
    };
});

function calcRacha() {
    const fSet = new Set();
    Object.values(datosViajes).forEach(p => p.forEach(v => {
        if (v.fecha && pasaFiltros(v) && v.estado !== 'WISHLIST') {
            const [a, m] = v.fecha.split('-');
            if (a && m) fSet.add(`${a}-${m}`);
        }
    }));
    if (fSet.size === 0) return 0;
    const mo = Array.from(fSet).sort((a, b) => b.localeCompare(a));
    let r = 0;
    const hoy = new Date();
    const mA = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const fA = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const mAnt = `${fA.getFullYear()}-${String(fA.getMonth() + 1).padStart(2, '0')}`;
    if (!fSet.has(mA) && !fSet.has(mAnt)) return 0;
    let [aE, mE] = mo[0].split('-').map(Number);
    for (let i = 0; i < mo.length; i++) {
        if (mo[i] === `${aE}-${String(mE).padStart(2, '0')}`) {
            r++;
            mE--;
            if (mE === 0) { mE = 12; aE--; }
        } else break;
    }
    return r;
}

if (btnDashboard) {
    btnDashboard.onclick = () => {
        feedbackHaptico(12);
        cerrarMenuRadial();
        let tP = 0;
        let tPer = 0;
        let tot = 0;
        let cotaMax = 0;
        let lugarCotaMax = '';
        let pVis = new Set();
        let est = [];

        Object.keys(datosViajes).forEach(prov => {
            datosViajes[prov].forEach(v => {
                if (pasaFiltros(v) && v.estado !== 'WISHLIST') {
                    pVis.add(prov);
                    tot++;
                    const zNum = parseInt(v.altitud, 10);
                    if (!isNaN(zNum) && zNum > cotaMax) {
                        cotaMax = zNum;
                        lugarCotaMax = v.nombre;
                    }
                    if (v.tipo === 'TRABAJO') tP++;
                    else if (v.tipo === 'FUTBOL') { if (v.estadio) est.push(escaparHTML(v.estadio)); }
                    else tPer++;
                }
            });
        });

        const totP = datosProvinciasGenerales ? datosProvinciasGenerales.features.length : 196;
        const porc = Math.round((pVis.size / totP) * 100) || 0;
        const racha = calcRacha();

        contenidoDashboard.innerHTML = `
            <div class="bento-item bento-full" style="border-color:rgba(0,255,255,0.4);">
                <div class="bento-top-row">
                    <span class="bento-titulo" style="color:#00FFFF;">DOMINIO TERRITORIAL</span>
                    <span class="bento-valor" style="color:#00FFFF; font-size:1.4rem;">${porc}%</span>
                </div>
                <div class="bento-bar-mini"><div class="bento-bar-fill" style="width:${porc}%;"></div></div>
                <div class="bento-sub">Has conquistado <b>${pVis.size}</b> de <b>${totP}</b> provincias (${tot} registros)</div>
            </div>

            <div class="bento-item" style="border-left:3.5px solid #FFD700;">
                <div class="bento-top-row">
                    <span class="bento-titulo">RACHA ACTIVA</span>
                    <span>${racha > 0 ? '🔥' : '🧊'}</span>
                </div>
                <div class="bento-valor" style="color:#FFD700;">${racha}</div>
                <div class="bento-sub">Meses continuos</div>
            </div>

            <div class="bento-item" style="border-left:3.5px solid #00FA9A;">
                <div class="bento-top-row">
                    <span class="bento-titulo">TECHO Z MÁX</span>
                    <span>⛰️</span>
                </div>
                <div class="bento-valor" style="color:#00FA9A;">${cotaMax > 0 ? cotaMax + 'm' : 'N/A'}</div>
                <div class="bento-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${lugarCotaMax ? escaparHTML(lugarCotaMax) : 'Sin cota registrada'}</div>
            </div>

            <div class="bento-item" style="border-left:3.5px solid #FF4500;">
                <div class="bento-top-row">
                    <span class="bento-titulo">OBRAS & GEO</span>
                    <span>🚜</span>
                </div>
                <div class="bento-valor" style="color:#FF4500;">${tP}</div>
                <div class="bento-sub">Proyectos campo</div>
            </div>

            <div class="bento-item" style="border-left:3.5px solid #FF1493;">
                <div class="bento-top-row">
                    <span class="bento-titulo">RUTAS LIBRES</span>
                    <span>🍹</span>
                </div>
                <div class="bento-valor" style="color:#FF1493;">${tPer}</div>
                <div class="bento-sub">Viajes personales</div>
            </div>

            <div class="bento-item bento-full" style="border-color:rgba(255,255,255,0.14);">
                <div class="bento-top-row">
                    <span class="bento-titulo">ESTADIOS & CANCHAS CONQUISTADAS</span>
                    <span class="bento-valor" style="color:#FFF; font-size:1.1rem;">${est.length} ⚽</span>
                </div>
                <div class="bento-sub" style="color:#e2e8f0; margin-top:4px;">${est.join(' • ') || 'Aún no hay canchas registradas.'}</div>
            </div>
        `;
        activarTiltHolografico('#contenido-dashboard .bento-item');
        fondoDashboard.style.display = 'block';
        fondoDashboard.style.zIndex = '9999';
        pantallaDashboard.style.display = 'block';
        setTimeout(() => pantallaDashboard.classList.add('activo'), 10);
    };
}

// =========================================
// RULETA NÓMADA QUE VUELA AL LUGAR EN EL MAPA
// =========================================
if (btnRuleta) {
    btnRuleta.onclick = () => {
        feedbackHaptico([20, 40, 20]);
        if (!datosProvinciasGenerales) return;

        let candidatas = [];
        datosProvinciasGenerales.features.forEach(p => {
            const nP = p.properties.NOMBPROV.trim().toUpperCase();
            const nD = p.properties.FIRST_NOMB.trim();
            let hasVisita = false;
            if (datosViajes[nP]) {
                hasVisita = datosViajes[nP].some(v => (v.estado || 'VISITADO') === 'VISITADO');
            }
            if (!hasVisita) {
                candidatas.push({ prov: p.properties.NOMBPROV.trim(), dep: nD });
            }
        });
        
        if (candidatas.length > 0) {
            const elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
            window.cerrarDashboard();
            mostrarToast(`🎲 ¡Rumbo a ${elegida.prov} (${elegida.dep})!`, 'success');

            renderizarCapaDepartamento(elegida.dep, false);

            let capaObjetivo = null;
            if (capaProvincias) {
                capaProvincias.eachLayer(l => {
                    if (l.feature && l.feature.properties.NOMBPROV.trim().toUpperCase() === elegida.prov.toUpperCase()) {
                        capaObjetivo = l;
                    }
                });
            }

            if (capaObjetivo) {
                mapa.flyToBounds(capaObjetivo.getBounds(), { padding: [45, 45], maxZoom: 9.5, duration: 1.4 });
                capaObjetivo.setStyle({ color: "#FFD700", weight: 5, fillColor: "#00FFFF", fillOpacity: 0.55 });
                setTimeout(() => {
                    const col = coloresChichaPremium[elegida.prov.length % coloresChichaPremium.length];
                    abrirInformacionProvincia(elegida.prov, col);
                }, 1500);
            } else {
                window.volarAProvincia(elegida.prov, elegida.dep);
            }
        } else {
            mostrarToast("¡Impresionante! Ya visitaste todas las provincias del Perú 👑", 'success');
        }
    };
}

// =========================================
// WRAPPED VIAJERO (CREDENCIAL HOLOGRÁFICA 3D)
// =========================================
window.cerrarWrapped = () => {
    const modalW = document.getElementById('modal-wrapped');
    if (!modalW) return;
    modalW.style.opacity = '0';
    setTimeout(() => { modalW.style.display = 'none'; }, 300);
};

if (btnWrapped) {
    btnWrapped.onclick = () => {
        feedbackHaptico(20);
        const y = new Date().getFullYear();
        let tr = 0; let pe = 0; let fu = 0;
        let provs = new Set();

        Object.keys(datosViajes).forEach(p => datosViajes[p].forEach(v => {
            if (v.fecha && v.fecha.startsWith(y) && v.estado !== 'WISHLIST') {
                provs.add(p);
                if (v.tipo === 'TRABAJO') tr++;
                else if (v.tipo === 'FUTBOL') fu++;
                else pe++;
            }
        }));

        const totAnio = tr + pe + fu;
        const topT = [tr, pe, fu];
        const maxIdx = topT.indexOf(Math.max(...topT));
        const aura = totAnio === 0
            ? '🧭 Explorador en Preparación'
            : maxIdx === 0
                ? '🚜 Topógrafo Guerrero'
                : maxIdx === 1
                    ? '🍹 Aventurero Libre'
                    : '⚽ Hincha Fiel';

        const badgeYear = document.getElementById('wrapped-year-badge');
        if (badgeYear) badgeYear.innerText = `TEMPORADA ${y}`;

        document.getElementById('wrapped-content').innerHTML = `
            <div class="wrapped-aura-box">
                <div class="wrapped-aura-label">RANGO OPERATIVO DEL AÑO</div>
                <div class="wrapped-aura-val">${aura}</div>
            </div>

            <div class="wrapped-stats-mini-grid" style="margin-bottom: 10px;">
                <div class="w-stat-pill" style="grid-column: span 3; display:flex; justify-content:space-around; align-items:center; background:rgba(0,255,255,0.07); border-color:rgba(0,255,255,0.28);">
                    <div>
                        <span class="w-stat-num" style="color:#00FFFF; font-size:1.55rem;">${provs.size}</span>
                        <span class="w-stat-txt">Provincias</span>
                    </div>
                    <div style="width:1px; height:32px; background:rgba(255,255,255,0.12);"></div>
                    <div>
                        <span class="w-stat-num" style="color:#FFD700; font-size:1.55rem;">${totAnio}</span>
                        <span class="w-stat-txt">Expediciones</span>
                    </div>
                </div>

                <div class="w-stat-pill">
                    <span class="w-stat-num" style="color:#FF4500;">${tr} 🚜</span>
                    <span class="w-stat-txt">Trabajo</span>
                </div>
                <div class="w-stat-pill">
                    <span class="w-stat-num" style="color:#00FA9A;">${pe} 🍹</span>
                    <span class="w-stat-txt">Personal</span>
                </div>
                <div class="w-stat-pill">
                    <span class="w-stat-num" style="color:#FF1493;">${fu} ⚽</span>
                    <span class="w-stat-txt">Fútbol</span>
                </div>
            </div>
        `;

        activarTiltHolografico('.wrapped-vip-card');
        const modalW = document.getElementById('modal-wrapped');
        modalW.style.display = 'flex';
        setTimeout(() => { modalW.style.opacity = '1'; }, 10);
        if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, zIndex: 10060 });
    };
}

window.cerrarDashboard = () => {
    pantallaDashboard.style.transform = '';
    pantallaDashboard.classList.remove('activo');
    setTimeout(() => {
        pantallaDashboard.style.display = 'none';
        fondoDashboard.style.display = 'none';
    }, 350);
};
if (btnCerrarDashboard) btnCerrarDashboard.onclick = window.cerrarDashboard;
habilitarSwipeToClose('#pantalla-dashboard', window.cerrarDashboard);
habilitarSwipeToClose('.info-contenido', () => { if (btnCerrarInfo) btnCerrarInfo.click(); });
habilitarSwipeToClose('#visor-fotos', () => { if (window.cerrarVisorFotos) window.cerrarVisorFotos(); });

// =========================================
// 7. GENERADOR POSTAL INSTAGRAM (CON COTA Z)
// =========================================
window.generarPostalIG = async (id, prov) => {
    feedbackHaptico(15);
    mostrarToast("Generando Postal...", "success");
    const v = (datosViajes[prov] || []).find(x => x.id === id);
    if (!v) return;
    document.getElementById('post-titulo').innerText = v.nombre;
    document.getElementById('post-sub').innerText = prov;
    const imgEl = document.getElementById('post-img');
    const urlImg = v.foto1 || v.foto2 || './assets/img/fondo.jpg';

    const cotaTxt = v.altitud ? ` • ⛰️ ${v.altitud} msnm` : '';
    const baseDesc = v.tipo === 'TRABAJO'
        ? `🚜 ${v.tipoProyecto || 'Campo'} ${v.clima || ''}`
        : v.tipo === 'FUTBOL'
            ? `⚽ ${v.estadio || 'Estadio'}`
            : `🍹 Gastro ★${v.gastro || 5}`;

    document.getElementById('post-desc').innerText = `${baseDesc}${cotaTxt}`;

    const panel = document.getElementById('postal-generador');
    try {
        await new Promise((resolve) => {
            imgEl.onload = resolve;
            imgEl.onerror = resolve;
            imgEl.src = urlImg;
        });
        const canvas = await html2canvas(panel, { scale: 1, useCORS: true, allowTaint: false, logging: false });
        const url = canvas.toDataURL("image/jpeg", 0.92);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PeruGo_Story_${v.nombre.replace(/\s+/g, '_')}.jpg`;
        a.click();
        mostrarToast("Postal descargada para Instagram 📸", "success");
    } catch (e) {
        console.error("Error generando postal IG:", e);
        mostrarToast("Error generando postal", "error");
    }
};

// =========================================
// 8. CRUD, BOLETO DE EXPEDICIÓN Y TELEMETRÍA Z
// =========================================
document.getElementById('btn-gps').onclick = (e) => {
    e.preventDefault();
    feedbackHaptico(15);
    const txtBtn = document.getElementById('txt-btn-gps');
    if (txtBtn) txtBtn.innerText = "Buscando...";
    if (!navigator.geolocation) {
        mostrarToast("GPS no disponible", "error");
        if (txtBtn) txtBtn.innerText = "Capturar GPS";
        return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        tempLat = pos.coords.latitude;
        tempLng = pos.coords.longitude;
        document.getElementById('nueva-coordenada').value = `${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`;
        if (pos.coords.accuracy > 15) {
            mostrarToast(`Precisión moderada (±${Math.round(pos.coords.accuracy)}m)`, "error");
        }
        await obtenerAltitudZ(tempLat, tempLng);
        if (txtBtn) txtBtn.innerText = "Capturar GPS";
        capaPinTemporal.clearLayers();
        L.marker([tempLat, tempLng], {
            icon: L.divIcon({ className: 'chinche-premium', html: '📍', iconSize: [30, 30], iconAnchor: [15, 15] })
        }).addTo(capaPinTemporal);
    }, () => {
        mostrarToast("No se pudo obtener ubicación GPS", "error");
        if (txtBtn) txtBtn.innerText = "Capturar GPS";
    }, { enableHighAccuracy: true, timeout: 10000 });
};

document.getElementById('btn-ubicar-mapa').onclick = (e) => {
    e.preventDefault();
    feedbackHaptico(12);
    pantallaInfo.style.display = 'none';
    seleccionandoUbicacion = true;
    markerDraggable = null;
    document.getElementById('btn-confirmar-ubicacion').style.display = 'block';
    mostrarToast("Toca el mapa para fijar la coordenada 📌", "success");
};

document.getElementById('btn-confirmar-ubicacion').onclick = async () => {
    feedbackHaptico(20);
    if (tempLat && tempLng) {
        document.getElementById('nueva-coordenada').value = `${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`;
        await obtenerAltitudZ(tempLat, tempLng);
    }
    seleccionandoUbicacion = false;
    markerDraggable = null;
    document.getElementById('btn-confirmar-ubicacion').style.display = 'none';
    pantallaInfo.style.display = 'flex';
};

document.getElementById('nueva-coordenada').addEventListener('change', async (e) => {
    const val = e.target.value.trim();
    if (!val) return;
    const partes = val.split(',');
    if (partes.length === 2) {
        const lat = parseFloat(partes[0]);
        const lng = parseFloat(partes[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
            tempLat = lat;
            tempLng = lng;
            capaPinTemporal.clearLayers();
            L.marker([tempLat, tempLng], {
                icon: L.divIcon({ className: 'chinche-premium', html: '📍', iconSize: [30, 30], iconAnchor: [15, 15] })
            }).addTo(capaPinTemporal);
            await obtenerAltitudZ(tempLat, tempLng);
        }
    }
});

function dibujarPinesProvincia(nom) {
    capaPinesProvincia.clearLayers();
    const lg = datosViajes[nom] || [];
    lg.forEach(v => {
        if (pasaFiltros(v) && v.lat && v.lng) {
            const esWish = v.estado === 'WISHLIST';
            const iconoPin = esWish ? '⭐' : v.tipo === 'TRABAJO' ? '🚜' : v.tipo === 'FUTBOL' ? '⚽' : '🍹';
            const colBorde = esWish ? '#FFD700' : v.tipo === 'TRABAJO' ? '#FF4500' : v.tipo === 'FUTBOL' ? '#FF1493' : '#00FA9A';

            L.marker([v.lat, v.lng], {
                icon: L.divIcon({
                    className: 'chinche-premium',
                    html: `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;border:1.5px solid ${colBorde};box-shadow:0 0 10px ${colBorde}80;">${iconoPin}</span>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).bindTooltip(
                `<b>${escaparHTML(v.nombre)}</b><br><span style="font-size:0.7rem;color:#00FA9A;font-family:'Fira Code',monospace;">⛰️ Z: ${v.altitud ? escaparHTML(v.altitud) + ' msnm' : 'N/A'}</span>`,
                { direction: 'top', className: 'tooltip-chinche' }
            ).addTo(capaPinesProvincia);
        }
    });
}

function actualizarBadgeRango(nomL) {
    let numVisitas = 0;
    if (datosViajes[nomL]) numVisitas = datosViajes[nomL].filter(v => (v.estado || 'VISITADO') === 'VISITADO').length;
    let txtRango = "Aún no explorado";
    if (numVisitas >= 10) txtRango = "👑 Alcalde";
    else if (numVisitas >= 5) txtRango = "☕ Caserito";
    else if (numVisitas >= 3) txtRango = "🤝 Conocido";
    else if (numVisitas >= 1) txtRango = "🎒 Forastero";
    if (rangoProvincia) rangoProvincia.innerText = `${txtRango} // ${numVisitas}`;
}

function alternarModoCabina(abrirCabina, modoTexto = 'TICKET // NUEVO') {
    if (abrirCabina) {
        if (vistaExplorarLugares) vistaExplorarLugares.style.display = 'none';
        if (tabsVisitasBar) tabsVisitasBar.style.display = 'none';
        if (badgeModoCabina) badgeModoCabina.innerText = modoTexto;
        if (btnCancelarEdicion) btnCancelarEdicion.style.display = 'inline-flex';
        formRegistro.style.display = 'block';
        if (tarjetaContenidoInfo) tarjetaContenidoInfo.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        formRegistro.style.display = 'none';
        if (vistaExplorarLugares) vistaExplorarLugares.style.display = 'flex';
        if (tabsVisitasBar) tabsVisitasBar.style.display = 'flex';
    }
}

function abrirInformacionProvincia(nomOri, col) {
    const nomL = nomOri.trim().toUpperCase();
    tituloInfoProvincia.innerText = nomOri;
    tituloInfoProvincia.style.color = col;
    tituloInfoProvincia.style.textShadow = `0 0 18px ${col}66`;
    tarjetaContenidoInfo.style.borderTopColor = col;
    tarjetaContenidoInfo.style.boxShadow = `0 -15px 55px rgba(0,0,0,0.95), 0 -3px 25px ${col}33`;
    limpiarFormulario(); 
    
    tabVisitaActiva = 'TODAS';
    document.querySelectorAll('.btn-tab-visita').forEach(b => b.classList.remove('activo'));
    const btnTodas = document.querySelector('.btn-tab-visita[data-tab="TODAS"]');
    if (btnTodas) btnTodas.classList.add('activo');

    mostrarSkeletonLoading();
    dibujarPinesProvincia(nomL);
    actualizarBadgeRango(nomL);

    pantallaInfo.style.display = 'flex';
    tarjetaContenidoInfo.style.transform = '';
    setTimeout(() => renderizarLugares(nomL, col), 200);
}

// =========================================
// TARJETAS DE BITÁCORA: PASAPORTE NEO-TECH
// =========================================
function renderizarLugares(nomL, col) {
    contenedorLugares.innerHTML = ''; 
    let lug = (datosViajes[nomL] || []).filter(pasaFiltros);
    
    if (tabVisitaActiva !== 'TODAS') {
        lug = lug.filter(v => (v.tipo || 'PERSONAL') === tabVisitaActiva);
    }

    if (lug.length === 0) {
        return insertarTarjetaLugarSegura(`
            <div class="timeline-item">
                <div class="card-visual" style="border-left: 3.5px solid #FF4500;">
                    <div class="card-content" style="text-align:center; padding: 18px 14px;">
                        <h3 class="card-title" style="color:#cbd5e1; font-size:0.86rem; white-space:normal;">📍 SIN REGISTROS EN ESTA FRECUENCIA</h3>
                        <p style="margin:4px 0 0; font-size:0.72rem; color:#94a3b8;">Emite tu primer pase de expedición con el botón inferior.</p>
                    </div>
                </div>
            </div>
        `);
    }
    
    lug.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

    lug.forEach(v => {
        const fotoFondo = v.foto1 || v.foto2 || '';
        const bgImg = fotoFondo ? `<div class="card-bg" style="background-image: url('${escaparHTML(fotoFondo)}');"></div>` : '';
        const est = v.estado || 'VISITADO';
        const vTipo = v.tipo || 'PERSONAL';

        const colCat = est === 'WISHLIST'
            ? '#FFD700'
            : vTipo === 'TRABAJO'
                ? '#FF4500'
                : vTipo === 'FUTBOL'
                    ? '#FF1493'
                    : '#00FA9A';

        const iconoCat = est === 'WISHLIST'
            ? '⭐'
            : vTipo === 'TRABAJO'
                ? '🚜'
                : vTipo === 'FUTBOL'
                    ? '⚽'
                    : '🍹';

        const thumbHTML = fotoFondo
            ? `<img src="${escaparHTML(fotoFondo)}" class="pasaporte-thumb" style="border-color:${colCat};" alt="Miniatura">`
            : `<div class="pasaporte-thumb" style="border-color:${colCat}; box-shadow: inset 0 0 12px ${colCat}26;">${iconoCat}</div>`;

        const valEstrellaPrincipal = vTipo === 'TRABAJO' ? (v.empresa || 0) : vTipo === 'FUTBOL' ? (v.ambiente || 0) : (v.gastro || v.atrac || 0);
        const badgeEstrellaPortada = valEstrellaPrincipal > 0
            ? `<span style="color:#FFD700; font-weight:700;">★${valEstrellaPrincipal}</span>`
            : '';

        const badgeZPortada = v.altitud
            ? `<span class="badge-z-pill">⛰️ ${escaparHTML(v.altitud)}m</span>`
            : '';

        let fH = '';
        if (v.foto1 || v.foto2) {
            fH = `<div style="display:flex;gap:4%;margin-top:12px;justify-content:center;">
                ${v.foto1 ? `<img src="${escaparHTML(v.foto1)}" class="foto-viaje" data-visor="${escaparHTML(v.foto1)}">` : ''}
                ${v.foto2 ? `<img src="${escaparHTML(v.foto2)}" class="foto-viaje" data-visor="${escaparHTML(v.foto2)}">` : ''}
            </div>`;
        }

        const tT = est === 'WISHLIST'
            ? '<span class="tag-info tag-wishlist">⭐ Wishlist</span>'
            : vTipo === 'TRABAJO'
                ? '<span class="tag-info tag-trabajo">🚜 Trabajo</span>'
                : vTipo === 'FUTBOL'
                    ? '<span class="tag-info tag-futbol">⚽ Fútbol</span>'
                    : '<span class="tag-info tag-personal">🍹 Personal</span>';

        const s = (n) => '★'.repeat(n || 0) + '<span style="color:rgba(255,255,255,0.2);">' + '★'.repeat(5 - (n || 0)) + '</span>';

        let det = '';
        if (vTipo === 'TRABAJO') {
            det = `<p style="margin:6px 0;">${v.tipoProyecto ? `<b style="color:#00FFFF;">Especialidad:</b> ${escaparHTML(v.tipoProyecto)}<br>` : ''}<b style="color:#00FFFF;">Contratista:</b> <span style="color:#FFD700;">${s(v.empresa)}</span> ${escaparHTML(v.clima || '')}</p>`;
        } else if (vTipo === 'FUTBOL') {
            det = `<p style="margin:6px 0;">${v.estadio ? `<b style="color:#00FFFF;">Estadio:</b> ${escaparHTML(v.estadio)}<br>` : ''}${v.partido ? `<b style="color:#00FFFF;">Partido:</b> ${escaparHTML(v.partido)}<br>` : ''}<b style="color:#00FFFF;">Ambiente:</b> <span style="color:#FFD700;">${s(v.ambiente)}</span></p>`;
        } else {
            det = `<p style="margin:6px 0;">${v.platoDestacado ? `<b style="color:#00FA9A;">Recomendado:</b> ${escaparHTML(v.platoDestacado)}<br>` : ''}<b style="color:#00FA9A;">Gastro:</b> <span style="color:#FFD700;">${s(v.gastro)}</span> • <b style="color:#00FA9A;">Hosp:</b> <span style="color:#FFD700;">${s(v.hosp)}</span> ${escaparHTML(v.transporte || '')}</p>`;
        }
        if (v.contacto) det += `<p style="color:#00FFFF; margin:4px 0;">📞 <b>Contacto:</b> ${escaparHTML(v.contacto)}</p>`;

        const footerAcciones = `
            <div class="card-action-footer">
                <div class="card-links-group">
                    ${v.link ? `<a href="${escaparHTML(v.link)}" target="_blank" rel="noopener noreferrer" class="btn-link">🔗 Docs</a>` : ''}
                    ${est === 'VISITADO' && (v.foto1 || v.foto2) ? `<button type="button" class="btn-postal" data-accion="postal" data-id="${escaparHTML(v.id)}" data-prov="${escaparHTML(nomL)}">📸 IG Story</button>` : ''}
                </div>
                <div class="card-crud-group">
                    <button type="button" class="btn-icon-circle btn-icon-edit" title="Editar" data-accion="editar" data-id="${escaparHTML(v.id)}" data-prov="${escaparHTML(nomL)}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button type="button" class="btn-icon-circle btn-icon-del" title="Eliminar" data-accion="eliminar" data-id="${escaparHTML(v.id)}" data-prov="${escaparHTML(nomL)}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
        
        insertarTarjetaLugarSegura(`
            <div class="timeline-item">
                <div class="card-visual" style="border-left: 3.5px solid ${colCat};">
                    ${bgImg}
                    <div class="card-content">
                        <div class="card-header" data-acordeon="${escaparHTML(v.id)}">
                            <div class="pasaporte-left">
                                ${thumbHTML}
                                <div class="pasaporte-info">
                                    <h3 class="card-title">${escaparHTML(v.nombre)}</h3>
                                    <div class="card-date">
                                        <span>${escaparHTML(v.fecha || 'Sin fecha')}</span>
                                        ${badgeZPortada}
                                        ${badgeEstrellaPortada}
                                    </div>
                                </div>
                            </div>
                            <div class="flecha-acordeon" id="flecha-${escaparHTML(v.id)}">▼</div>
                        </div>
                        <div class="tarjeta-body" id="body-${escaparHTML(v.id)}">
                            <div style="margin-bottom:6px;">${tT} <span class="tag-info tag-compania">${escaparHTML(v.compania || 'Solo')}</span></div>
                            ${det}
                            ${v.info ? `<p style="margin-top:8px; line-height:1.45; color:#f1f5f9;"><em>"${escaparHTML(v.info)}"</em></p>` : ''}
                            ${fH}
                            ${footerAcciones}
                        </div>
                    </div>
                </div>
            </div>
        `);
    });
}

contenedorLugares.addEventListener('click', (e) => {
    const header = e.target.closest('[data-acordeon]');
    if (header) {
        feedbackHaptico(8);
        window.toggleAcordeon(header.dataset.acordeon);
        return;
    }
    const btnAccion = e.target.closest('[data-accion]');
    if (btnAccion) {
        e.stopPropagation();
        feedbackHaptico(12);
        const { accion, id, prov } = btnAccion.dataset;
        if (accion === 'editar') window.prepararEdicion(id, prov);
        else if (accion === 'eliminar') window.eliminarRegistro(id, prov);
        else if (accion === 'postal') window.generarPostalIG(id, prov);
        return;
    }
    const imgVisor = e.target.closest('[data-visor]');
    if (imgVisor) {
        window.abrirVisorFotos(imgVisor.dataset.visor);
    }
});

function limpiarFormulario() { 
    idEdicionActual = null; 
    resetUIFormulario(); 
    ['nuevo-nombre', 'nueva-fecha', 'nueva-info', 'nuevo-link', 'nuevo-plato', 'nuevo-estadio', 'nuevo-partido', 'foto-1', 'foto-2', 'nueva-coordenada', 'nueva-altitud', 'nuevo-contacto'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.value = '';
    }); 
    tempLat = null;
    tempLng = null;
    markerDraggable = null; 
    if (capaPinTemporal) capaPinTemporal.clearLayers(); 
    if (btnGuardarRegistro) btnGuardarRegistro.innerHTML = '💾 SELLAR EXPEDICIÓN'; 
    if (btnCancelarEdicion) btnCancelarEdicion.style.display = 'none'; 
    alternarModoCabina(false);
}

window.prepararEdicion = (id, pL) => {
    const v = (datosViajes[pL] || []).find(x => x.id === id);
    if (!v) return; 
    
    limpiarFormulario();
    idEdicionActual = id;
    
    const tipoReg = v.tipo || 'PERSONAL';
    setValorGrupoBotones('seg-estado', 'nuevo-estado', v.estado || 'VISITADO', 'activo');
    setValorGrupoBotones('seg-tipo', 'nuevo-tipo', tipoReg, 'activo');
    setValorGrupoBotones('seg-compania', 'nueva-compania', v.compania || 'Solo', 'activo');
    actualizarPanelesPorTipo(tipoReg);

    document.getElementById('nuevo-nombre').value = v.nombre || '';
    document.getElementById('nueva-fecha').value = v.fecha || '';
    document.getElementById('nueva-info').value = v.info || '';
    document.getElementById('nueva-altitud').value = v.altitud || '';
    document.getElementById('nuevo-contacto').value = v.contacto || '';
    const elLink = document.getElementById('nuevo-link');
    if (elLink) elLink.value = v.link || '';

    if (v.foto1) {
        const p1 = document.getElementById('preview-foto-1');
        const t1 = document.getElementById('txt-foto-1');
        if (p1 && t1) { p1.src = v.foto1; p1.style.display = 'block'; t1.style.display = 'none'; }
    }
    if (v.foto2) {
        const p2 = document.getElementById('preview-foto-2');
        const t2 = document.getElementById('txt-foto-2');
        if (p2 && t2) { p2.src = v.foto2; p2.style.display = 'block'; t2.style.display = 'none'; }
    }

    tempLat = v.lat || null;
    tempLng = v.lng || null;
    document.getElementById('nueva-coordenada').value = (tempLat && tempLng) ? `${Number(tempLat).toFixed(6)}, ${Number(tempLng).toFixed(6)}` : '';
    capaPinTemporal.clearLayers();
    if (tempLat && tempLng) {
        L.marker([tempLat, tempLng], {
            icon: L.divIcon({ className: 'chinche-premium', html: '📍', iconSize: [30, 30], iconAnchor: [15, 15] })
        }).addTo(capaPinTemporal);
    }

    if (tipoReg === 'TRABAJO') {
        if (v.tipoProyecto) setValorGrupoBotones('seg-proyecto', 'nuevo-tipo-proyecto', v.tipoProyecto, 'activo');
        if (v.clima) document.querySelector(`#selector-clima .btn-opcion[data-valor="${v.clima}"]`)?.click();
        if (v.empresa) document.querySelectorAll('#estrellas-empresa span')[v.empresa - 1]?.click();
    } else if (tipoReg === 'FUTBOL') {
        if (v.estadio) document.getElementById('nuevo-estadio').value = v.estadio;
        if (v.partido) document.getElementById('nuevo-partido').value = v.partido;
        if (v.ambiente) document.querySelectorAll('#estrellas-ambiente span')[v.ambiente - 1]?.click();
    } else {
        if (v.platoDestacado) document.getElementById('nuevo-plato').value = v.platoDestacado;
        if (v.transporte) document.querySelector(`#selector-transporte .btn-opcion[data-valor="${v.transporte}"]`)?.click();
        if (v.gastro) document.querySelectorAll('#estrellas-gastro span')[v.gastro - 1]?.click();
        if (v.hosp) document.querySelectorAll('#estrellas-hosp span')[v.hosp - 1]?.click();
        if (v.atrac) document.querySelectorAll('#estrellas-atrac span')[v.atrac - 1]?.click();
    }
    btnGuardarRegistro.innerHTML = '🔄 ACTUALIZAR TICKET';
    alternarModoCabina(true, 'TICKET // EDICIÓN');
};

if (btnCancelarEdicion) btnCancelarEdicion.onclick = limpiarFormulario;

window.eliminarRegistro = async (id, pL) => {
    if (!confirm("⚠️ ¿Eliminar permanentemente este registro?")) return;
    try {
        await deleteDoc(doc(db, "viajes", id));
        datosViajes[pL] = (datosViajes[pL] || []).filter(v => v.id !== id);
        renderizarLugares(pL, tituloInfoProvincia.style.color || '#00FFFF');
        dibujarPinesProvincia(pL);
        actualizarBadgeRango(pL);
        if (capaProvincias) capaProvincias.eachLayer(l => capaProvincias.resetStyle(l));
        if (tituloDepartamento.innerText && btnVolver.style.display !== 'none') {
            actualizarProgresoDepartamental(tituloDepartamento.innerText.trim().toUpperCase());
        } else {
            actualizarProgresoGlobal();
        }
        mostrarToast("Registro eliminado", "success");
    } catch (e) {
        console.error("Error eliminando registro:", e);
        mostrarToast("No se pudo eliminar el registro", "error");
    }
};

if (btnMostrarFormulario) {
    btnMostrarFormulario.onclick = () => {
        feedbackHaptico(14);
        limpiarFormulario();
        alternarModoCabina(true, 'TICKET // NUEVO');
    };
}

if (btnGuardarRegistro) {
    btnGuardarRegistro.onclick = async () => {
        feedbackHaptico([18, 35, 25]);
        const est = document.getElementById('nuevo-estado').value;
        const tp = document.getElementById('nuevo-tipo').value;
        const co = document.getElementById('nueva-compania').value;
        const nom = document.getElementById('nuevo-nombre').value.trim();
        const fec = document.getElementById('nueva-fecha').value;
        const inf = document.getElementById('nueva-info').value.trim();
        const cont = document.getElementById('nuevo-contacto').value.trim();
        const alt = document.getElementById('nueva-altitud').value.trim();
        const f1 = document.getElementById('foto-1').files[0];
        const f2 = document.getElementById('foto-2').files[0];
        const elLink = document.getElementById('nuevo-link');
        const lin = elLink ? elLink.value.trim() : '';

        if (!nom) return mostrarToast("El nombre del lugar es obligatorio", "error");
        btnGuardarRegistro.disabled = true;
        mensajeCarga.style.display = 'block';

        try {
            const pA = tituloInfoProvincia.innerText.trim().toUpperCase();
            let u1 = "", u2 = "";
            if (idEdicionActual) {
                const vP = (datosViajes[pA] || []).find(v => v.id === idEdicionActual);
                if (vP) { u1 = vP.foto1 || ""; u2 = vP.foto2 || ""; }
            }
            
            let esPrimeraVisita = false;
            if (est === 'VISITADO' && !idEdicionActual) {
                if (!datosViajes[pA] || !datosViajes[pA].some(v => (v.estado || 'VISITADO') === 'VISITADO')) {
                    esPrimeraVisita = true;
                }
            }

            if (f1) {
                try { u1 = await comprimirYSubirImagen(f1); }
                catch (errFoto) { mostrarToast("Sin red para Foto 1: Guardando telemetría offline", "error"); }
            }
            if (f2) {
                try { u2 = await comprimirYSubirImagen(f2); }
                catch (errFoto) { mostrarToast("Sin red para Foto 2: Guardando telemetría offline", "error"); }
            }

            const cM = document.getElementById('nueva-coordenada').value.trim();
            if (cM) {
                const p = cM.split(',');
                if (p.length === 2) {
                    const parsedLat = parseFloat(p[0]);
                    const parsedLng = parseFloat(p[1]);
                    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                        tempLat = parsedLat;
                        tempLng = parsedLng;
                    }
                }
            }

            let rD = {
                provincia: pA,
                estado: est,
                tipo: tp,
                compania: co,
                nombre: nom,
                fecha: fec,
                info: inf,
                link: lin,
                contacto: cont,
                altitud: alt,
                foto1: u1,
                foto2: u2,
                lat: tempLat,
                lng: tempLng
            };

            if (tp === 'TRABAJO') {
                rD.tipoProyecto = document.getElementById('nuevo-tipo-proyecto').value;
                rD.clima = seleccionClima;
                rD.empresa = estrellasValor.empresa;
            } else if (tp === 'FUTBOL') {
                rD.estadio = document.getElementById('nuevo-estadio').value.trim();
                rD.partido = document.getElementById('nuevo-partido').value.trim();
                rD.ambiente = estrellasValor.ambiente;
            } else {
                rD.transporte = seleccionTransporte;
                rD.platoDestacado = document.getElementById('nuevo-plato').value.trim();
                rD.gastro = estrellasValor.gastro;
                rD.hosp = estrellasValor.hosp;
                rD.atrac = estrellasValor.atrac;
            }

            if (idEdicionActual) {
                const docRef = doc(db, "viajes", idEdicionActual);
                await Promise.race([
                    updateDoc(docRef, rD),
                    new Promise(res => setTimeout(res, navigator.onLine ? 8000 : 450))
                ]);
                const idx = datosViajes[pA].findIndex(v => v.id === idEdicionActual);
                if (idx !== -1) datosViajes[pA][idx] = { id: idEdicionActual, ...rD };
                mostrarToast("Pase de expedición actualizado");
            } else {
                const nuevoDocRef = doc(collection(db, "viajes"));
                await Promise.race([
                    setDoc(nuevoDocRef, rD),
                    new Promise(res => setTimeout(res, navigator.onLine ? 8000 : 450))
                ]);
                rD.id = nuevoDocRef.id;
                if (!datosViajes[pA]) datosViajes[pA] = [];
                datosViajes[pA].push(rD);
                mostrarToast("Expedición sellada con éxito");
            }
            
            if (esPrimeraVisita) {
                const retoRandom = desafiosNomadas[Math.floor(Math.random() * desafiosNomadas.length)];
                setTimeout(() => mostrarToast(`¡Nueva provincia! Reto Nómada: ${retoRandom}`, 'success'), 3500);
            }

            actualizarBadgeRango(pA);
            renderizarLugares(pA, tituloInfoProvincia.style.color || '#00FFFF');
            dibujarPinesProvincia(pA);
            if (capaProvincias) capaProvincias.eachLayer(l => capaProvincias.resetStyle(l));
            if (tituloDepartamento.innerText && btnVolver.style.display !== 'none') {
                actualizarProgresoDepartamental(tituloDepartamento.innerText.trim().toUpperCase());
            } else {
                actualizarProgresoGlobal();
            }
            limpiarFormulario(); 
        } catch (e) {
            console.error("Error guardando el registro:", e);
            mostrarToast("Error al guardar. Verifica tus datos.", "error");
        } finally {
            btnGuardarRegistro.disabled = false;
            mensajeCarga.style.display = 'none';
        }
    };
}

if (btnCerrarInfo) btnCerrarInfo.onclick = () => pantallaInfo.style.display = 'none';
if (btnVolver) {
    btnVolver.onclick = () => {
        feedbackHaptico(12);
        if (capaProvincias) mapa.removeLayer(capaProvincias);
        capaNacional.eachLayer(l => capaNacional.resetStyle(l));
        capaNacional.addTo(mapa);
        mapa.setView([-9.5, -75.01], 5.0);
        tituloDepartamento.style.display = 'none';
        tituloMapa.style.display = 'block';
        btnVolver.style.display = 'none';
        capaPinesProvincia.clearLayers();
        capaPinTemporal.clearLayers();
        actualizarProgresoGlobal();
    };
}

function actualizarProgresoGlobal() {
    if (!datosProvinciasGenerales) return;
    let vis = 0;
    datosProvinciasGenerales.features.forEach(p => {
        let pl = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[pl]) {
            const f = datosViajes[pl].filter(pasaFiltros);
            if (f.some(v => (v.estado || 'VISITADO') === 'VISITADO')) vis++;
        }
    });
    let por = Math.round((vis / datosProvinciasGenerales.features.length) * 100);
    if (vis > 0 && por === 0) por = 1;
    actualizarAnilloOrbe(por, por === 100);
}

function actualizarProgresoDepartamental(nD) {
    const pr = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nD);
    let vis = 0;
    pr.forEach(p => {
        let pl = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[pl]) {
            const f = datosViajes[pl].filter(pasaFiltros);
            if (f.some(v => (v.estado || 'VISITADO') === 'VISITADO')) vis++;
        }
    });
    let por = pr.length === 0 ? 0 : Math.round((vis / pr.length) * 100);
    if (vis > 0 && por === 0) por = 1;
    actualizarAnilloOrbe(por, por === 100);
    if (por === 100 && typeof confetti === 'function') {
        confetti({ particleCount: 250, spread: 120, origin: { y: 0.5 }, zIndex: 10005 });
    }
}

// =========================================
// 9. RESPALDOS, BUSCADOR SPOTLIGHT Y SESIÓN
// =========================================
if (btnBackup) {
    btnBackup.onclick = () => {
        feedbackHaptico(12);
        const blob = new Blob([JSON.stringify(datosViajes, null, 2)], { type: "application/json" });
        const u = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = u;
        a.download = `PeruGo_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        mostrarToast("Copia de seguridad descargada 💾", "success");
    };
}

if (btnImportar && inputImportar) {
    btnImportar.onclick = () => inputImportar.click();
    inputImportar.onchange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (!confirm("⚠️ Restaurar fusionará los datos del archivo con tu cuenta actual. ¿Continuar?")) return;
        const r = new FileReader();
        r.onload = async (ev) => {
            try {
                const js = JSON.parse(ev.target.result);
                let p = [];
                Object.keys(js).forEach(pr => js[pr].forEach(v => {
                    const rd = doc(db, "viajes", v.id);
                    const d = { ...v };
                    delete d.id;
                    p.push(setDoc(rd, d));
                }));
                await Promise.all(p);
                mostrarToast("Datos restaurados con éxito", "success");
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                console.error("Error importando JSON:", err);
                mostrarToast("Archivo de respaldo inválido", "error");
            }
        };
        r.readAsText(f);
    };
}

function ejecutarBusquedaTexto(tx) {
    if (tx.length < 2) {
        resultadosBuscador.innerHTML = '';
        return;
    }
    let h = '';
    let c = 0;
    Object.keys(datosViajes).forEach(p => datosViajes[p].forEach(v => {
        const sr = `${v.nombre || ''} ${v.info || ''} ${v.estadio || ''} ${v.platoDestacado || ''} ${v.tipoProyecto || ''} ${p}`.toLowerCase();
        if (sr.includes(tx)) {
            const dF = datosProvinciasGenerales.features.find(x => x.properties.NOMBPROV.trim().toUpperCase() === p);
            const nD = dF ? dF.properties.FIRST_NOMB : '';
            const icono = v.tipo === 'TRABAJO' ? '🚜' : v.tipo === 'FUTBOL' ? '⚽' : '🍹';
            h += `<div class="resultado-item" data-prov="${escaparHTML(p)}" data-dep="${escaparHTML(nD)}">
                    <div>
                        <h4>${icono} ${escaparHTML(v.nombre)} <span style="color:#FFD700; font-size:0.75rem;">[${escaparHTML(p)}]</span></h4>
                        <p>${escaparHTML(v.fecha || 'Sin fecha')} ${v.altitud ? `• ⛰️ Z: ${escaparHTML(v.altitud)}m` : ''}</p>
                    </div>
                    <span style="color:#00FFFF; font-weight:bold; font-family:'Fira Code',monospace;">→</span>
                  </div>`;
            c++;
        }
    }));
    resultadosBuscador.innerHTML = c === 0 ? '<p style="color:#94a3b8; text-align:center; font-size:0.78rem; font-family:\'Fira Code\',monospace;">SIN COINCIDENCIAS EN EL RADAR</p>' : h;
}

if (btnBuscar) {
    btnBuscar.onclick = () => { 
        feedbackHaptico(12);
        cerrarMenuRadial();
        fondoDashboard.style.display = 'block'; 
        fondoDashboard.style.zIndex = '9999';
        pantallaBuscador.style.display = 'block'; 
        setTimeout(() => {
            pantallaBuscador.classList.add('activo');
            inputBuscador.focus();
        }, 15); 
    };
}

window.cerrarBuscador = () => { 
    pantallaBuscador.style.transform = '';
    pantallaBuscador.classList.remove('activo'); 
    setTimeout(() => { 
        pantallaBuscador.style.display = 'none'; 
        fondoDashboard.style.display = 'none'; 
        inputBuscador.value = ''; 
        resultadosBuscador.innerHTML = ''; 
    }, 320); 
};
habilitarSwipeToClose('#pantalla-buscador', window.cerrarBuscador);

if (inputBuscador) {
    inputBuscador.addEventListener('input', (e) => {
        clearTimeout(temporizadorBuscador);
        const tx = e.target.value.toLowerCase().trim();
        temporizadorBuscador = setTimeout(() => ejecutarBusquedaTexto(tx), 180);
    });
}

if (buscadorQuickTags) {
    buscadorQuickTags.addEventListener('click', (e) => {
        const btnTag = e.target.closest('.q-tag');
        if (btnTag && inputBuscador) {
            feedbackHaptico(10);
            inputBuscador.value = btnTag.dataset.query;
            ejecutarBusquedaTexto(btnTag.dataset.query.toLowerCase());
        }
    });
}

resultadosBuscador.addEventListener('click', (e) => {
    const item = e.target.closest('.resultado-item');
    if (item) {
        feedbackHaptico(12);
        window.volarAProvincia(item.dataset.prov, item.dataset.dep);
    }
});

window.volarAProvincia = (nP, nD) => { 
    window.cerrarBuscador(); 
    renderizarCapaDepartamento(nD, true);
    abrirInformacionProvincia(nP, coloresChichaPremium[nP.length % coloresChichaPremium.length]); 
};

// =========================================
// 10. CONTROLADORES PRINCIPALES DE SESIÓN
// =========================================
if (btnIngresar) {
    btnIngresar.onclick = async () => {
        feedbackHaptico(15);
        if (audioAmbiental.paused) {
            audioAmbiental.play().catch(() => {});
            audioAmbiental.pause();
        }
        const em = inputEmail.value.trim();
        const pw = inputPass.value;
        if (!em || !pw) {
            avatarGuia.src = './assets/img/mascota-triste.webp';
            return mostrarToast("Ingresa tu correo y contraseña", "error");
        }
        try {
            await signInWithEmailAndPassword(auth, em, pw);
            avatarGuia.src = './assets/img/mascota-feliz.webp';
            setTimeout(() => {
                pantallaAcceso.style.opacity = '0';
                setTimeout(() => {
                    pantallaAcceso.style.display = 'none';
                    pantallaCarga.style.display = 'flex';
                    contenedorMapa.style.display = 'block';
                    tituloMapa.style.display = 'block';
                    reproducirMusicaAleatoria();
                    inicializarMapa();
                }, 600);
            }, 400);
        } catch (e) {
            avatarGuia.src = './assets/img/mascota-triste.webp';
            inputPass.value = '';
            mostrarToast("Credenciales incorrectas", "error");
        }
    };
}

if (btnMute) {
    btnMute.onclick = () => {
        feedbackHaptico(10);
        if (audioAmbiental.paused) audioAmbiental.play().catch(() => {});
        audioAmbiental.muted = !audioAmbiental.muted;
        if (svgAudioOn && svgAudioOff) {
            svgAudioOn.style.display = audioAmbiental.muted ? 'none' : 'block';
            svgAudioOff.style.display = audioAmbiental.muted ? 'block' : 'none';
        }
    };
}

const btnActualizar = document.getElementById('btn-actualizar-app');
if (btnActualizar) {
    btnActualizar.onclick = async () => {
        feedbackHaptico(15);
        mostrarToast("Limpiando caché y actualizando...", "success");
        try {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) await reg.unregister();
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
        } catch (e) {}
        window.location.reload();
    };
}

if (btnCerrarSesion) {
    btnCerrarSesion.onclick = async () => {
        await signOut(auth);
        window.location.reload();
    };
}

onAuthStateChanged(auth, (u) => {
    if (u) { 
        pantallaAcceso.style.display = 'none'; 
        pantallaCarga.style.display = 'flex'; 
        contenedorMapa.style.display = 'block'; 
        tituloMapa.style.display = 'block'; 
        inicializarMapa(); 
        if (!audioAmbiental.src) reproducirMusicaAleatoria(); 
        document.body.addEventListener('click', () => {
            if (audioAmbiental.paused && !audioAmbiental.muted) audioAmbiental.play().catch(() => {});
        }, { once: true }); 
    } else { 
        pantallaAcceso.style.display = 'flex'; 
        pantallaAcceso.style.opacity = '1'; 
        pantallaCarga.style.display = 'none'; 
        contenedorMapa.style.display = 'none'; 
        tituloMapa.style.display = 'none'; 
        if (barraNavegacion) barraNavegacion.style.display = 'none';
    }
});

window.toggleAcordeon = (id) => {
    const b = document.getElementById(`body-${id}`);
    const f = document.getElementById(`flecha-${id}`);
    if (b && f) {
        b.classList.toggle('abierto');
        f.classList.toggle('rotada');
    }
};

window.abrirVisorFotos = (u) => {
    const v = document.getElementById('visor-fotos');
    const i = document.getElementById('img-visor');
    if (v && i) {
        i.src = u;
        v.style.display = 'flex';
        v.style.transform = '';
        setTimeout(() => v.style.opacity = '1', 10);
    }
};

window.cerrarVisorFotos = () => {
    const v = document.getElementById('visor-fotos');
    const i = document.getElementById('img-visor');
    if (v && i) {
        v.style.opacity = '0';
        setTimeout(() => {
            v.style.display = 'none';
            i.src = '';
        }, 300);
    }
};
