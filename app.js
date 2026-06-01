"use strict";

// 1. IMPORTACIONES
import { db, auth, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "./firebase.js";

const IMGBB_API_KEY = "055cde6238b2cefe13e31dc43f2b2570"; 

// 2. REFERENCIAS AL DOM
const tituloDepartamento = document.getElementById('titulo-departamento');
const btnVolver = document.getElementById('btn-volver');
const pantallaInfo = document.getElementById('pantalla-info');
const tarjetaContenidoInfo = document.querySelector('.info-contenido'); 
const tituloInfoProvincia = document.getElementById('info-provincia-titulo');
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

// Menú y herramientas
const btnMaestro = document.getElementById('btn-maestro-menu');
const menuHijos = document.getElementById('menu-hijos');
const btnMute = document.getElementById('btn-mute');
const btnFiltro = document.getElementById('btn-filtro');
const btnDashboard = document.getElementById('btn-dashboard');
const btnConstelacion = document.getElementById('btn-constelacion');
const btnBuscar = document.getElementById('btn-buscar');

const avatarGuia = document.getElementById('avatar-guia');
const tituloMapa = document.getElementById('titulo-mapa');
const contenedorProgreso = document.getElementById('contenedor-progreso');
const barraRelleno = document.getElementById('barra-relleno');
const mascotaProgreso = document.getElementById('mascota-progreso');
const textoProgreso = document.getElementById('texto-progreso');

// Buscador
const pantallaBuscador = document.getElementById('pantalla-buscador');
const inputBuscador = document.getElementById('input-buscador');
const resultadosBuscador = document.getElementById('resultados-buscador');

// Import / Export
const btnBackup = document.getElementById('btn-backup');
const btnImportar = document.getElementById('btn-importar');
const inputImportar = document.getElementById('input-importar');

// Formularios
const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
const formRegistro = document.getElementById('formulario-registro');
const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const mensajeCarga = document.getElementById('mensaje-carga');
const selectTipo = document.getElementById('nuevo-tipo');
const camposTrabajo = document.getElementById('campos-trabajo');
const camposPersonal = document.getElementById('campos-personal');
const camposFutbol = document.getElementById('campos-futbol');

// 3. ESTADO GLOBAL
let diccCentrosProvincias = {};
let capaConstelacion = L.layerGroup();
let modoConstelacionActivo = false;
let idEdicionActual = null;
let seleccionClima = ''; 
let seleccionTransporte = '';
let estrellasValor = { empresa: 0, gastro: 0, hosp: 0, atrac: 0, ambiente: 0 };
let filtroActualMundo = 'TODOS'; 
let indiceFiltro = 0;
let capaNacional; 
let capaProvincias; 
let mapa; 
let datosGeoJSON = null;
let datosProvinciasGenerales = null; 
let datosViajes = {}; 
let temporizadorBuscador; 
let menuAbierto = false;

const estadosFiltro = [ 
    { valor: 'TODOS', icono: '🌍', color: '#00FFFF' }, 
    { valor: 'TRABAJO', icono: '🚜', color: '#FF4500' }, 
    { valor: 'PERSONAL', icono: '🍹', color: '#00FA9A' },
    { valor: 'FUTBOL', icono: '⚽', color: '#FFF' }
];
const coloresChichaPremium = [ "#FF1493", "#00FA9A", "#FFD700", "#00FFFF", "#FF4500", "#9400D3" ];
const audios = [ './assets/audio/musica-uno.mp3', './assets/audio/musica-dos.mp3', './assets/audio/musica-tres.mp3' ];
const audioAmbiental = new Audio();

// 4. FUNCIONES BASE
function insertarTarjetaLugarSegura(htmlString) {
    contenedorLugares.insertAdjacentHTML('beforeend', htmlString);
}

document.querySelectorAll('#selector-clima .btn-opcion').forEach(btn => {
    btn.onclick = () => { document.querySelectorAll('#selector-clima .btn-opcion').forEach(b => b.classList.remove('seleccionado')); btn.classList.add('seleccionado'); seleccionClima = btn.dataset.valor; };
});
document.querySelectorAll('#selector-transporte .btn-opcion').forEach(btn => {
    btn.onclick = () => { document.querySelectorAll('#selector-transporte .btn-opcion').forEach(b => b.classList.remove('seleccionado')); btn.classList.add('seleccionado'); seleccionTransporte = btn.dataset.valor; };
});

function inicializarEstrellas(contenedorId, claveValor) {
    const contenedor = document.getElementById(contenedorId);
    if(!contenedor) return;
    const estrellas = contenedor.querySelectorAll('span');
    estrellas.forEach((estrella, idx) => {
        estrella.onclick = () => {
            estrellasValor[claveValor] = idx + 1;
            estrellas.forEach((e, i) => { e.classList.toggle('activa', i <= idx); });
        };
    });
}
inicializarEstrellas('estrellas-empresa', 'empresa'); 
inicializarEstrellas('estrellas-gastro', 'gastro');
inicializarEstrellas('estrellas-hosp', 'hosp'); 
inicializarEstrellas('estrellas-atrac', 'atrac');
inicializarEstrellas('estrellas-ambiente', 'ambiente');

function resetUIFormulario() {
    document.querySelectorAll('.btn-opcion').forEach(b => b.classList.remove('seleccionado'));
    document.querySelectorAll('.contenedor-estrellas span').forEach(s => s.classList.remove('activa'));
    seleccionClima = ''; seleccionTransporte = ''; estrellasValor = { empresa: 0, gastro: 0, hosp: 0, atrac: 0, ambiente: 0 };
}

function reproducirMusicaAleatoria() { audioAmbiental.src = audios[Math.floor(Math.random() * audios.length)]; audioAmbiental.play().catch(() => {}); }
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
    } catch(e) { console.error("Error obteniendo viajes:", e); }
    return viajesObj;
}

let mapaYaInicializado = false;
function inicializarMapa() {
    if (mapaYaInicializado) return;
    mapaYaInicializado = true;

    mapa = L.map('map', { zoomControl: false, dragging: true, scrollWheelZoom: true, doubleClickZoom: false, touchZoom: true, attributionControl: false }).setView([-9.5, -75.01], 5.0);
    Promise.all([ obtenerViajesDeFirebase(), fetch('./data/peru_provincial_simple.geojson').then(r => r.json()), fetch('./data/peru_departamental_simple.geojson').then(r => r.json()) ])
    .then(([viajesFirebase, provs, deps]) => { 
        datosViajes = viajesFirebase; datosProvinciasGenerales = provs; datosGeoJSON = deps;
        L.geoJSON(datosProvinciasGenerales, {
            onEachFeature: function(feature, layer) {
                diccCentrosProvincias[feature.properties.NOMBPROV.trim().toUpperCase()] = layer.getBounds().getCenter();
            }
        });

        dibujarMapaNacional(); actualizarProgresoGlobal(); 
        
        pantallaCarga.style.display = 'none';
        const menuFlotante = document.getElementById('contenedor-menu-flotante');
        if (menuFlotante) menuFlotante.style.display = 'flex'; 
    });
}

function dibujarMapaNacional() {
    capaNacional = L.geoJSON(datosGeoJSON, {
        style: function (feature) {
            const nombreDepLimpio = feature.properties.NOMBDEP.trim().toUpperCase();
            const provsDelDep = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio);
            let provsVisitadas = 0;
            
            for(let p of provsDelDep) {
                let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
                if(datosViajes[provLimpia]) {
                    const filtrados = datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo);
                    if(filtrados.length > 0) provsVisitadas++;
                }
            }
            
            const esConquistaDorada = (provsVisitadas === provsDelDep.length) && provsDelDep.length > 0;
            if (esConquistaDorada) return { color: "#FFF", weight: 3, fillColor: "#FFD700", fillOpacity: 0.6, className: 'poligono-dorado' };
            else if (provsVisitadas > 0) return { color: coloresChichaPremium[nombreDepLimpio.length % coloresChichaPremium.length], weight: 3, fillColor: coloresChichaPremium[nombreDepLimpio.length % coloresChichaPremium.length], fillOpacity: 0.35, className: 'poligono-vidrio' }; 
            else return { color: "#f1c40f", weight: 1, fillColor: "transparent", fillOpacity: 0 }; 
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function () {
                const nombreDep = feature.properties.NOMBDEP;
                layer.setStyle({ color: "#FFFFFF", weight: 4, fillOpacity: 0.5 });
                
                const menuFlotante = document.getElementById('contenedor-menu-flotante');
                if (menuFlotante) menuFlotante.style.display = 'none'; 
                
                setTimeout(() => {
                    mapa.removeLayer(capaNacional);
                    const filtradas = { type: "FeatureCollection", features: datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDep.trim().toUpperCase()) };
                    capaProvincias = L.geoJSON(filtradas, {
                        style: function(fProv) {
                            const provLimpia = fProv.properties.NOMBPROV.trim().toUpperCase();
                            const c = coloresChichaPremium[fProv.properties.NOMBPROV.length % coloresChichaPremium.length];
                            let tieneVisita = false;
                            if (datosViajes[provLimpia]) { const filtrados = datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo); if(filtrados.length > 0) tieneVisita = true; }
                            if (tieneVisita) return { color: c, weight: 3, fillColor: c, fillOpacity: 0.35, className: 'poligono-vidrio' }; 
                            else return { color: c, weight: 1, fillColor: "#000", fillOpacity: 0.4, dashArray: "4 5" };
                        },
                        onEachFeature: function(fP, lP) {
                            const nombreProv = fP.properties.NOMBPROV;
                            const c = coloresChichaPremium[nombreProv.length % coloresChichaPremium.length];
                            lP.bindTooltip(`<span style="color: ${c};">${nombreProv}</span>`, { permanent: true, direction: 'center', className: 'etiqueta-provincia', interactive: false });
                            lP.on('click', () => { 
                                abrirInformacionProvincia(nombreProv, c); 
                            });
                        }
                    }).addTo(mapa);
                    mapa.fitBounds(layer.getBounds());
                    tituloMapa.style.display = 'none'; tituloDepartamento.innerText = nombreDep; tituloDepartamento.style.display = 'block'; btnVolver.style.display = 'flex'; actualizarProgresoDepartamental(nombreDep.trim().toUpperCase());
                }, 400);
            });
        }
    }).addTo(mapa);
}

// 5. LÓGICA DE MENÚ Y HERRAMIENTAS
if (btnMaestro) {
    btnMaestro.onclick = () => {
        menuAbierto = !menuAbierto;
        if (menuAbierto) {
            menuHijos.style.opacity = '1';
            menuHijos.style.pointerEvents = 'auto';
            menuHijos.style.transform = 'translateY(0)';
            btnMaestro.style.transform = 'scale(0.7) rotate(45deg)'; 
            btnMaestro.style.borderColor = '#FF1493'; 
        } else {
            menuHijos.style.opacity = '0';
            menuHijos.style.pointerEvents = 'none';
            menuHijos.style.transform = 'translateY(20px)';
            btnMaestro.style.transform = 'scale(1) rotate(0deg)';
            btnMaestro.style.borderColor = '#FFF';
        }
    };
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
            actualizarProgresoDepartamental(tituloDepartamento.innerText.trim().toUpperCase()); 
        }

        if (modoConstelacionActivo) {
            btnConstelacion.click();
            setTimeout(() => btnConstelacion.click(), 10);
        }
    };
}

if (btnConstelacion) {
    btnConstelacion.onclick = () => {
        if (modoConstelacionActivo) {
            mapa.removeLayer(capaConstelacion);
            modoConstelacionActivo = false;
            btnConstelacion.style.boxShadow = "0 0 10px #9400D3";
            return;
        }

        capaConstelacion.clearLayers();
        let todosLosViajes = [];
        
        Object.keys(datosViajes).forEach(prov => {
            datosViajes[prov].forEach(viaje => {
                const vTipo = viaje.tipo || 'PERSONAL';
                if (viaje.fecha && (filtroActualMundo === 'TODOS' || vTipo === filtroActualMundo)) {
                    todosLosViajes.push({ ...viaje, provinciaReal: prov });
                }
            });
        });

        todosLosViajes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        let puntosRuta = [];
        todosLosViajes.forEach((v, index) => {
            let centro = diccCentrosProvincias[v.provinciaReal];
            if (centro) {
                puntosRuta.push(centro);
                L.circleMarker(centro, { radius: 4, color: '#FFF', weight: 1, fillColor: '#FFD700', fillOpacity: 1, className: 'punto-ruta' })
                  .bindTooltip(`Parada ${index + 1}: ${v.nombre} (${v.fecha})`, { direction: 'top' })
                  .addTo(capaConstelacion);
            }
        });

        if (puntosRuta.length > 1) {
            let linea = L.polyline(puntosRuta, { className: 'linea-constelacion' });
            capaConstelacion.addLayer(linea);
            mapa.addLayer(capaConstelacion);
            mapa.fitBounds(linea.getBounds(), { padding: [50, 50] });
            modoConstelacionActivo = true;
            btnConstelacion.style.boxShadow = "0 0 20px #FFF, 0 0 30px #00FFFF";
        } else {
            const mensaje = filtroActualMundo === 'TODOS' ? 
                "⚠️ Necesitas registrar al menos 2 expediciones con fecha." : 
                `⚠️ No tienes suficientes expediciones del tipo ${filtroActualMundo} con fecha.`;
            alert(mensaje);
        }
    };
}

function calcularRachaActiva() {
    const fechasSet = new Set();
    Object.values(datosViajes).forEach(provincia => {
        provincia.forEach(viaje => {
            if (viaje.fecha) {
                const [anio, mes] = viaje.fecha.split('-'); 
                if (anio && mes) fechasSet.add(`${anio}-${mes}`);
            }
        });
    });

    if (fechasSet.size === 0) return 0;

    const mesesOrdenados = Array.from(fechasSet).sort((a, b) => b.localeCompare(a));
    let rachaActual = 0;
    const fechaActual = new Date();
    const mesActualStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    const fechaMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    const mesAnteriorStr = `${fechaMesAnterior.getFullYear()}-${String(fechaMesAnterior.getMonth() + 1).padStart(2, '0')}`;

    if (!fechasSet.has(mesActualStr) && !fechasSet.has(mesAnteriorStr)) return 0; 

    let añoMesEvaluado = mesesOrdenados[0]; 
    let [añoEval, mesEval] = añoMesEvaluado.split('-').map(Number);

    for (let i = 0; i < mesesOrdenados.length; i++) {
        const mesEnCiclo = mesesOrdenados[i];
        const mesEsperadoStr = `${añoEval}-${String(mesEval).padStart(2, '0')}`;

        if (mesEnCiclo === mesEsperadoStr) {
            rachaActual++; mesEval--; 
            if (mesEval === 0) { mesEval = 12; añoEval--; }
        } else break; 
    }
    return rachaActual;
}

if (btnDashboard) {
    btnDashboard.onclick = () => {
        let totProyectos = 0; let totPersonales = 0; let platosDestacados = 0; let provVisitadas = new Set(); let estadios = [];
        
        Object.keys(datosViajes).forEach(prov => {
            datosViajes[prov].forEach(viaje => {
                provVisitadas.add(prov);
                if (viaje.tipo === 'TRABAJO') totProyectos++; 
                else if (viaje.tipo === 'FUTBOL') { if(viaje.estadio) estadios.push(viaje.estadio); }
                else totPersonales++;
                if (viaje.platoDestacado) platosDestacados++;
            });
        });

        const totProvinciasPais = datosProvinciasGenerales ? datosProvinciasGenerales.features.length : 196;
        const porcExplorado = Math.round((provVisitadas.size / totProvinciasPais) * 100) || 0;
        const mesesRacha = calcularRachaActiva();
        const iconoFuego = mesesRacha > 0 ? '🔥' : '🧊';

        contenidoDashboard.innerHTML = `
            <div class="bento-item bento-full" style="border-color: #00FFFF;">
                <div class="bento-titulo">Avance Nacional</div>
                <div class="bento-valor" style="font-size: 3rem; color: #00FFFF;">${porcExplorado}%</div>
                <div style="font-size: 0.8rem; color: #ddd;">Has conquistado ${provVisitadas.size} provincias de 196</div>
            </div>
            <div class="bento-item" style="border-color: #FFD700; border-left: 4px solid #FFD700;">
                <div class="bento-titulo">Racha Activa</div>
                <div class="bento-valor" style="color: #FFD700;">${mesesRacha} ${iconoFuego}</div>
                <div style="font-size: 0.65rem; color: #aaa;">Meses consecutivos explorando</div>
            </div>
            <div class="bento-item" style="border-color: #FF4500; border-left: 4px solid #FF4500;">
                <div class="bento-titulo">Proyectos</div>
                <div class="bento-valor" style="color: #FF4500;">${totProyectos} 🚜</div>
            </div>
            <div class="bento-item" style="border-color: #00FA9A; border-left: 4px solid #00FA9A;">
                <div class="bento-titulo">V. Personales</div>
                <div class="bento-valor" style="color: #00FA9A;">${totPersonales} 🍹</div>
            </div>
            <div class="bento-item bento-full" style="border-color: #FFF; background: rgba(255,255,255,0.1);">
                <div class="bento-titulo">Salón de la Fama - Estadios</div>
                <div class="bento-valor" style="color: #FFF;">${estadios.length} ⚽</div>
                <div style="font-size: 0.8rem; color: #ddd;">${estadios.length > 0 ? estadios.join(', ') : 'Aún no has registrado canchas.'}</div>
            </div>
        `;
        fondoDashboard.style.display = 'block'; pantallaDashboard.style.display = 'block';
        setTimeout(() => { pantallaDashboard.classList.add('activo'); }, 10);
    };
}

if (btnCerrarDashboard) {
    btnCerrarDashboard.onclick = () => {
        pantallaDashboard.classList.remove('activo');
        setTimeout(() => { pantallaDashboard.style.display = 'none'; fondoDashboard.style.display = 'none'; }, 400);
    };
}

// 6. RESPALDO Y RESTAURACIÓN LOCAL
if (btnBackup) {
    btnBackup.onclick = () => {
        if (Object.keys(datosViajes).length === 0) return alert("⚠️ La bitácora está vacía. No hay expediciones para respaldar.");
        const dataStr = JSON.stringify(datosViajes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PeruGo_Respaldo_${new Date().toISOString().split('T')[0]}.json`; 
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        alert("✅ Copia de seguridad asegurada en tu dispositivo.");
    };
}

if (btnImportar && inputImportar) {
    btnImportar.onclick = () => inputImportar.click();
    inputImportar.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!confirm("⚠️ ¿Restaurar copia? Esto fusionará/sobreescribirá datos actuales en la nube.")) { inputImportar.value = ''; return; }

        const reader = new FileReader();
        reader.onload = async (evento) => {
            try {
                const jsonRestaurado = JSON.parse(evento.target.result);
                btnImportar.innerText = "⏳ Restaurando..."; btnImportar.disabled = true;
                let promesas = [];

                Object.keys(jsonRestaurado).forEach(provincia => {
                    jsonRestaurado[provincia].forEach(viaje => {
                        const refDoc = doc(db, "viajes", viaje.id);
                        const dataAsubir = { ...viaje }; delete dataAsubir.id; 
                        promesas.push(setDoc(refDoc, dataAsubir));
                    });
                });
                await Promise.all(promesas);
                alert("✅ Bitácora restaurada. La aplicación se reiniciará."); window.location.reload();
            } catch (error) {
                alert("❌ Error al procesar el archivo."); console.error(error);
                btnImportar.innerText = "📂 Restaurar Copia Local"; btnImportar.disabled = false;
            }
        };
        reader.readAsText(file);
    };
}

// 7. BUSCADOR
if (btnBuscar) {
    btnBuscar.onclick = () => {
        pantallaBuscador.style.display = 'flex';
        setTimeout(() => pantallaBuscador.style.opacity = '1', 10);
        inputBuscador.focus();
    };
}

window.cerrarBuscador = () => {
    pantallaBuscador.style.opacity = '0';
    setTimeout(() => { pantallaBuscador.style.display = 'none'; inputBuscador.value = ''; resultadosBuscador.innerHTML = ''; }, 300);
};

if (inputBuscador) {
    inputBuscador.addEventListener('input', (e) => {
        clearTimeout(temporizadorBuscador);
        const texto = e.target.value.toLowerCase().trim();
        if (texto.length < 2) { resultadosBuscador.innerHTML = ''; return; }
        
        temporizadorBuscador = setTimeout(() => {
            let htmlResultados = ''; let contador = 0;
            Object.keys(datosViajes).forEach(provincia => {
                datosViajes[provincia].forEach(viaje => {
                    const nombre = viaje.nombre ? viaje.nombre.toLowerCase() : '';
                    const info = viaje.info ? viaje.info.toLowerCase() : '';
                    const estadio = viaje.estadio ? viaje.estadio.toLowerCase() : '';
                    const proyecto = viaje.tipoProyecto ? viaje.tipoProyecto.toLowerCase() : '';
                    const plato = viaje.platoDestacado ? viaje.platoDestacado.toLowerCase() : '';
                    const prov = provincia.toLowerCase();
                    
                    if (nombre.includes(texto) || info.includes(texto) || estadio.includes(texto) || proyecto.includes(texto) || plato.includes(texto) || prov.includes(texto)) {
                        const depFeature = datosProvinciasGenerales.features.find(p => p.properties.NOMBPROV.trim().toUpperCase() === provincia);
                        const nombreDep = depFeature ? depFeature.properties.FIRST_NOMB : 'Desconocido';
                        
                        htmlResultados += `
                            <div class="resultado-item" onclick="volarAProvincia('${provincia}', '${nombreDep}')">
                                <h4>${viaje.nombre} <span style="font-size: 0.75rem; color: #FFD700;">(${provincia})</span></h4>
                                <p>${viaje.tipo === 'TRABAJO' ? '🚜' : viaje.tipo === 'FUTBOL' ? '⚽' : '🍹'} ${viaje.tipo} - ${viaje.fecha || 'Sin fecha'}</p>
                            </div>`;
                        contador++;
                    }
                });
            });
            if (contador === 0) htmlResultados = '<p style="color:#aaa; text-align:center; margin-top:30px;">No se encontraron coincidencias.</p>';
            resultadosBuscador.innerHTML = htmlResultados;
        }, 300);
    });
}

window.volarAProvincia = (nombreProvincia, nombreDepartamento) => {
    cerrarBuscador();
    
    const menuFlotante = document.getElementById('contenedor-menu-flotante');
    if (menuFlotante) menuFlotante.style.display = 'none'; 
    
    if (capaProvincias) mapa.removeLayer(capaProvincias); capaNacional.eachLayer(layer => capaNacional.resetStyle(layer)); 
    
    const filtradas = { type: "FeatureCollection", features: datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepartamento.trim().toUpperCase()) };
    capaProvincias = L.geoJSON(filtradas, {
        style: function(fProv) {
            const provLimpia = fProv.properties.NOMBPROV.trim().toUpperCase();
            const c = coloresChichaPremium[fProv.properties.NOMBPROV.length % coloresChichaPremium.length];
            let tieneVisita = datosViajes[provLimpia] && datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo).length > 0;
            return tieneVisita ? { color: c, weight: 3, fillColor: c, fillOpacity: 0.35, className: 'poligono-vidrio' } : { color: c, weight: 1, fillColor: "#000", fillOpacity: 0.4, dashArray: "4 5" };
        },
        onEachFeature: function(fP, lP) {
            const nProv = fP.properties.NOMBPROV;
            const c = coloresChichaPremium[nProv.length % coloresChichaPremium.length];
            lP.bindTooltip(`<span style="color: ${c};">${nProv}</span>`, { permanent: true, direction: 'center', className: 'etiqueta-provincia', interactive: false });
            lP.on('click', () => { 
                abrirInformacionProvincia(nProv, c); 
            });
        }
    }).addTo(mapa);
    
    mapa.fitBounds(L.geoJSON(filtradas).getBounds()); mapa.removeLayer(capaNacional);
    tituloMapa.style.display = 'none'; tituloDepartamento.innerText = nombreDepartamento; tituloDepartamento.style.display = 'block'; btnVolver.style.display = 'flex'; actualizarProgresoDepartamental(nombreDepartamento.trim().toUpperCase());
    
    const colorProv = coloresChichaPremium[nombreProvincia.length % coloresChichaPremium.length];
    abrirInformacionProvincia(nombreProvincia, colorProv);
};

// 8. LÓGICA DE CRUD Y FORMULARIO
function abrirInformacionProvincia(nombreOriginal, colorProvincia) {
    const nombreLimpio = nombreOriginal.trim().toUpperCase();
    tituloInfoProvincia.innerText = nombreOriginal; tarjetaContenidoInfo.style.borderColor = colorProvincia; tarjetaContenidoInfo.style.boxShadow = `0 0 20px ${colorProvincia}`; tituloInfoProvincia.style.webkitTextFillColor = colorProvincia; 
    limpiarFormulario(); renderizarLugares(nombreLimpio, colorProvincia); pantallaInfo.style.display = 'flex';
}

function renderizarLugares(nombreLimpio, colorProvincia) {
    contenedorLugares.innerHTML = ''; 
    let lugares = datosViajes[nombreLimpio] || [];
    lugares = lugares.filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo);
    if (lugares.length === 0) return insertarTarjetaLugarSegura(`<div class="lugar-card" style="border-left-color: #FF4500; padding:15px;"><h3>📍 Zona por explorar</h3><p>No hay registros aquí.</p></div>`);

    lugares.forEach(lugar => {
        let htmlFotos = '';
        if (lugar.foto1 || lugar.foto2) {
            htmlFotos = `<div style="display: flex; gap: 4%; margin-top: 15px;">`;
            if(lugar.foto1) htmlFotos += `<img data-src="${lugar.foto1}" src="" class="foto-viaje lazy-foto" onclick="abrirVisorFotos('${lugar.foto1}')">`;
            if(lugar.foto2) htmlFotos += `<img data-src="${lugar.foto2}" src="" class="foto-viaje lazy-foto" onclick="abrirVisorFotos('${lugar.foto2}')">`;
            htmlFotos += `</div>`;
        }

        const vTipo = lugar.tipo || 'PERSONAL'; const vCompania = lugar.compania || 'Solo';
        let tagTipo = vTipo === 'TRABAJO' ? '<span class="tag-info tag-trabajo">🚜 Trabajo</span>' : vTipo === 'FUTBOL' ? '<span class="tag-info tag-futbol">⚽ Fútbol</span>' : '<span class="tag-info tag-personal">🍹 Personal</span>';
        const tagCompania = `<span class="tag-info tag-compania">${vCompania}</span>`;
        const btnEnlace = lugar.link ? `<br><a href="${lugar.link}" target="_blank" class="btn-link">🔗 Docs/Media</a>` : '';
        const btnEditar = `<button class="btn-editar" onclick="event.stopPropagation(); prepararEdicion('${lugar.id}', '${nombreLimpio}')">✏️</button>`;
        const btnEliminar = `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarRegistro('${lugar.id}', '${nombreLimpio}')">🗑️</button>`;
        const genStars = (num) => '★'.repeat(num) + '<span style="color:#444;">' + '★'.repeat(5-num) + '</span>';
        let detallesEspecificos = '';

        if (vTipo === 'TRABAJO') {
            const climaIcon = lugar.clima ? `<span style="font-size:1.2rem;">${lugar.clima}</span>` : '';
            const proy = lugar.tipoProyecto ? `<strong>Proyecto:</strong> ${lugar.tipoProyecto}<br>` : '';
            const emp = lugar.empresa ? `<strong>Contratista:</strong> <span style="color:#FFD700;">${genStars(lugar.empresa)}</span><br>` : '';
            detallesEspecificos = `<p style="font-size:0.85rem;">${proy}${emp} ${climaIcon}</p>`;
        } else if (vTipo === 'FUTBOL') {
            const est = lugar.estadio ? `<strong>Estadio:</strong> ${lugar.estadio}<br>` : '';
            const par = lugar.partido ? `<strong>Partido:</strong> ${lugar.partido}<br>` : '';
            const amb = lugar.ambiente ? `<strong>Ambiente:</strong> <span style="color:#FFD700;">${genStars(lugar.ambiente)}</span>` : '';
            detallesEspecificos = `<p style="font-size:0.85rem;">${est}${par}${amb}</p>`;
        } else {
            const transIcon = lugar.transporte ? `<span style="font-size:1.2rem;">${lugar.transporte}</span>` : '';
            const plato = lugar.platoDestacado ? `<strong>Plato:</strong> ${lugar.platoDestacado}<br>` : '';
            const gas = lugar.gastro ? `<strong>Gastronomía:</strong> <span style="color:#FFD700;">${genStars(lugar.gastro)}</span><br>` : '';
            const hos = lugar.hosp ? `<strong>Hospedaje:</strong> <span style="color:#FFD700;">${genStars(lugar.hosp)}</span><br>` : '';
            const atr = lugar.atrac ? `<strong>Atractivos:</strong> <span style="color:#FFD700;">${genStars(lugar.atrac)}</span>` : '';
            detallesEspecificos = `<p style="font-size:0.85rem;">${plato}${gas}${hos}${atr} <br>${transIcon}</p>`;
        }

        insertarTarjetaLugarSegura(`
            <div class="lugar-card" style="border-left-color: ${colorProvincia}">
                <div class="tarjeta-header" onclick="toggleAcordeon('${lugar.id}')">
                    <h3>${lugar.nombre}</h3><div class="flecha-acordeon" id="flecha-${lugar.id}">▼</div>
                </div>
                <div class="tarjeta-body" id="body-${lugar.id}">
                    ${btnEditar}${btnEliminar}
                    <div style="margin-bottom: 5px;">${tagTipo} ${tagCompania}</div>
                    <p><strong>Fecha:</strong> ${lugar.fecha || ''}</p>
                    ${detallesEspecificos}
                    <p style="color: #bbb; margin-top: 8px;"><em>${lugar.info}</em></p>
                    ${btnEnlace}${htmlFotos}
                </div>
            </div>`);
    });
}

window.prepararEdicion = (idDocumento, provinciaLimpia) => {
    const viaje = datosViajes[provinciaLimpia].find(v => v.id === idDocumento);
    if(!viaje) return;
    idEdicionActual = idDocumento; resetUIFormulario();
    document.getElementById('nuevo-tipo').value = viaje.tipo || 'PERSONAL'; selectTipo.dispatchEvent(new Event('change'));
    document.getElementById('nueva-compania').value = viaje.compania || 'Solo'; document.getElementById('nuevo-nombre').value = viaje.nombre || '';
    document.getElementById('nueva-fecha').value = viaje.fecha || ''; document.getElementById('nueva-info').value = viaje.info || ''; document.getElementById('nuevo-link').value = viaje.link || '';
    
    if(viaje.tipo === 'TRABAJO') {
        if(viaje.tipoProyecto) document.getElementById('nuevo-tipo-proyecto').value = viaje.tipoProyecto;
        if(viaje.clima) document.querySelector(`#selector-clima .btn-opcion[data-valor="${viaje.clima}"]`)?.click();
        if(viaje.empresa) document.querySelectorAll('#estrellas-empresa span')[viaje.empresa-1]?.click();
    } else if(viaje.tipo === 'FUTBOL') {
        if(viaje.estadio) document.getElementById('nuevo-estadio').value = viaje.estadio;
        if(viaje.partido) document.getElementById('nuevo-partido').value = viaje.partido;
        if(viaje.ambiente) document.querySelectorAll('#estrellas-ambiente span')[viaje.ambiente-1]?.click();
    } else {
        if(viaje.platoDestacado) document.getElementById('nuevo-plato').value = viaje.platoDestacado;
        if(viaje.transporte) document.querySelector(`#selector-transporte .btn-opcion[data-valor="${viaje.transporte}"]`)?.click();
        if(viaje.gastro) document.querySelectorAll('#estrellas-gastro span')[viaje.gastro-1]?.click();
        if(viaje.hosp) document.querySelectorAll('#estrellas-hosp span')[viaje.hosp-1]?.click();
        if(viaje.atrac) document.querySelectorAll('#estrellas-atrac span')[viaje.atrac-1]?.click();
    }
    btnGuardarRegistro.innerHTML = '🔄 Actualizar Registro'; btnGuardarRegistro.style.background = 'linear-gradient(90deg, #FFD700, #FF4500)';
    btnCancelarEdicion.style.display = 'block'; formRegistro.style.display = 'block'; formRegistro.scrollIntoView({ behavior: "smooth" });
};

function limpiarFormulario() {
    idEdicionActual = null; resetUIFormulario();
    document.getElementById('nuevo-nombre').value = ''; document.getElementById('nueva-fecha').value = ''; document.getElementById('nueva-info').value = ''; 
    document.getElementById('nuevo-link').value = ''; document.getElementById('nuevo-plato').value = ''; document.getElementById('nuevo-estadio').value = ''; 
    document.getElementById('nuevo-partido').value = ''; document.getElementById('foto-1').value = ''; document.getElementById('foto-2').value = '';
    selectTipo.value = 'PERSONAL'; selectTipo.dispatchEvent(new Event('change'));
    btnGuardarRegistro.innerHTML = '💾 Guardar en la Nube'; btnGuardarRegistro.style.background = 'linear-gradient(90deg, #00FFFF, #00FA9A)';
    btnCancelarEdicion.style.display = 'none'; formRegistro.style.display = 'none';
}

if (btnCancelarEdicion) btnCancelarEdicion.onclick = limpiarFormulario;
window.eliminarRegistro = async (idDocumento, provinciaLimpia) => {
    if (!confirm("⚠️ ¿Eliminar esta expedición?")) return;
    try { await deleteDoc(doc(db, "viajes", idDocumento)); datosViajes[provinciaLimpia] = datosViajes[provinciaLimpia].filter(v => v.id !== idDocumento);
        renderizarLugares(provinciaLimpia, tituloInfoProvincia.style.webkitTextFillColor);
        if(capaProvincias) capaProvincias.eachLayer(layer => capaProvincias.resetStyle(layer)); actualizarProgresoGlobal();
    } catch(e) { alert("Error: " + e.message); }
};

if (btnMostrarFormulario) btnMostrarFormulario.onclick = () => { if(formRegistro.style.display === 'block' && idEdicionActual) limpiarFormulario(); else formRegistro.style.display = formRegistro.style.display === 'none' ? 'block' : 'none'; };

if (btnGuardarRegistro) {
    btnGuardarRegistro.onclick = async () => {
        const tipo = document.getElementById('nuevo-tipo').value; const compania = document.getElementById('nueva-compania').value;
        const nombre = document.getElementById('nuevo-nombre').value; const fecha = document.getElementById('nueva-fecha').value;
        const info = document.getElementById('nueva-info').value; const link = document.getElementById('nuevo-link').value;
        const foto1 = document.getElementById('foto-1').files[0]; const foto2 = document.getElementById('foto-2').files[0];

        if (!nombre) return alert("El nombre es obligatorio.");
        btnGuardarRegistro.disabled = true; mensajeCarga.style.display = 'block';

        try {
            const provinciaActual = tituloInfoProvincia.innerText.trim().toUpperCase();
            let url1 = "", url2 = ""; let viajePrevio = null;

            if (idEdicionActual) { viajePrevio = datosViajes[provinciaActual].find(v => v.id === idEdicionActual); url1 = viajePrevio.foto1 || ""; url2 = viajePrevio.foto2 || ""; }
            if (foto1) url1 = await subirFotoImgBB(foto1); if (foto2) url2 = await subirFotoImgBB(foto2);

            let registroData = { provincia: provinciaActual, tipo, compania, nombre, fecha, info, link, foto1: url1, foto2: url2 };
            if (tipo === 'TRABAJO') { registroData.tipoProyecto = document.getElementById('nuevo-tipo-proyecto').value; registroData.clima = seleccionClima; registroData.empresa = estrellasValor.empresa; } 
            else if (tipo === 'FUTBOL') { registroData.estadio = document.getElementById('nuevo-estadio').value; registroData.partido = document.getElementById('nuevo-partido').value; registroData.ambiente = estrellasValor.ambiente; } 
            else { registroData.transporte = seleccionTransporte; registroData.platoDestacado = document.getElementById('nuevo-plato').value; registroData.gastro = estrellasValor.gastro; registroData.hosp = estrellasValor.hosp; registroData.atrac = estrellasValor.atrac; }

            if (idEdicionActual) { await updateDoc(doc(db, "viajes", idEdicionActual), registroData); const index = datosViajes[provinciaActual].findIndex(v => v.id === idEdicionActual); datosViajes[provinciaActual][index] = { id: idEdicionActual, ...registroData }; } 
            else { const docRef = await addDoc(collection(db, "viajes"), registroData); registroData.id = docRef.id; if (!datosViajes[provinciaActual]) datosViajes[provinciaActual] = []; datosViajes[provinciaActual].push(registroData); }
            
            renderizarLugares(provinciaActual, tituloInfoProvincia.style.webkitTextFillColor);
            if(capaProvincias) capaProvincias.eachLayer(layer => capaProvincias.resetStyle(layer)); actualizarProgresoGlobal(); limpiarFormulario(); 
        } catch (error) { alert("Error al guardar: " + error.message); }
        btnGuardarRegistro.disabled = false; mensajeCarga.style.display = 'none';
    };
}

if (btnCerrarInfo) {
    btnCerrarInfo.onclick = () => { 
        pantallaInfo.style.display = 'none'; 
    };
}

if (btnVolver) {
    btnVolver.onclick = () => {
        if (capaProvincias) mapa.removeLayer(capaProvincias); capaNacional.eachLayer(layer => capaNacional.resetStyle(layer)); capaNacional.addTo(mapa);
        mapa.setView([-9.5, -75.01], 5.0); tituloDepartamento.style.display = 'none'; 
        
        tituloMapa.style.display = 'block'; 
        const menuFlotante = document.getElementById('contenedor-menu-flotante');
        if (menuFlotante) menuFlotante.style.display = 'flex'; 

        btnVolver.style.display = 'none'; actualizarProgresoGlobal(); 
    };
}

function actualizarProgresoGlobal() {
    if (!datosProvinciasGenerales) return; let visitados = 0;
    datosProvinciasGenerales.features.forEach(p => {
        let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[provLimpia]) { const filtrados = datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo); if(filtrados.length > 0) visitados++; }
    });
    let porc = Math.round((visitados / datosProvinciasGenerales.features.length) * 100); if (visitados > 0 && porc === 0) porc = 1; 
    barraRelleno.style.width = porc + '%'; textoProgreso.innerText = porc + '%'; mascotaProgreso.style.left = porc + '%';
}

function actualizarProgresoDepartamental(nombreDepLimpio) {
    const provsDelDep = datosProvinciasGenerales.features.filter(p => p.properties.FIRST_NOMB.trim().toUpperCase() === nombreDepLimpio); let visitados = 0;
    provsDelDep.forEach(p => {
        let provLimpia = p.properties.NOMBPROV.trim().toUpperCase();
        if (datosViajes[provLimpia]) { const filtrados = datosViajes[provLimpia].filter(v => filtroActualMundo === 'TODOS' || (v.tipo || 'PERSONAL') === filtroActualMundo); if(filtrados.length > 0) visitados++; }
    });
    let porc = provsDelDep.length === 0 ? 0 : Math.round((visitados / provsDelDep.length) * 100); if (visitados > 0 && porc === 0) porc = 1; 
    barraRelleno.style.width = porc + '%'; mascotaProgreso.style.left = porc + '%';

    if (porc === 100) {
        barraRelleno.style.background = 'linear-gradient(90deg, #FFD700, #FFF, #FFD700)'; textoProgreso.innerText = '¡DOMINADO!'; textoProgreso.classList.add('texto-conquista');
        setTimeout(() => { if (typeof confetti === 'function') confetti({ particleCount: 250, spread: 120, origin: { y: 0.5 }, colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFFFF'], zIndex: 10005 }); }, 300);
    } else { barraRelleno.style.background = 'linear-gradient(90deg, #FF1493, #00FA9A, #FFD700)'; textoProgreso.innerText = porc + '%'; textoProgreso.classList.remove('texto-conquista'); }
}

// 9. SESIÓN Y AUTENTICACIÓN
if (btnIngresar) {
    btnIngresar.onclick = async () => {
        const emailValor = inputEmail.value.trim(); const passValor = inputPass.value;
        if (!emailValor || !passValor) return avatarGuia.src = './assets/img/mascota-triste.webp';
        avatarGuia.src = './assets/img/mascota-explora.webp'; 
        try {
            await signInWithEmailAndPassword(auth, emailValor, passValor); avatarGuia.src = './assets/img/mascota-feliz.webp';
            setTimeout(() => { pantallaAcceso.style.opacity = '0'; setTimeout(() => { pantallaAcceso.style.display = 'none'; pantallaCarga.style.display = 'flex'; contenedorMapa.style.display = 'block'; tituloMapa.style.display = 'block'; contenedorProgreso.style.display = 'block'; reproducirMusicaAleatoria(); inicializarMapa(); }, 800); }, 600);
        } catch (error) { console.error("Error de acceso:", error.message); avatarGuia.src = './assets/img/mascota-triste.webp'; inputPass.value = ''; setTimeout(() => { if (inputPass.value.length === 0) avatarGuia.src = './assets/img/mascota-hola.webp'; }, 2000); }
    };
}
inputPass.addEventListener('input', () => { avatarGuia.src = inputPass.value.length > 0 ? './assets/img/mascota-explora.webp' : './assets/img/mascota-hola.webp'; });
btnMute.onclick = () => { audioAmbiental.muted = !audioAmbiental.muted; btnMute.textContent = audioAmbiental.muted ? '🔇' : '🔊'; };

const btnActualizar = document.getElementById('btn-actualizar-app');
if (btnActualizar) btnActualizar.onclick = () => { btnActualizar.innerText = "⏳..."; if ('caches' in window) { caches.keys().then((names) => { Promise.all(names.map(name => caches.delete(name))).then(() => { window.location.reload(true); }); }); } else window.location.reload(true); };
if(btnCerrarSesion) btnCerrarSesion.onclick = async () => { await signOut(auth); if (typeof cerrarDashboard === 'function') cerrarDashboard(); };

onAuthStateChanged(auth, (user) => {
    if (user) {
        pantallaAcceso.style.display = 'none'; pantallaCarga.style.display = 'flex'; contenedorMapa.style.display = 'block'; tituloMapa.style.display = 'block'; contenedorProgreso.style.display = 'block';
        inicializarMapa(); reproducirMusicaAleatoria();
        document.body.addEventListener('click', () => { if (audioAmbiental.paused) audioAmbiental.play().catch(() => {}); }, { once: true }); 
    } else { pantallaAcceso.style.display = 'flex'; pantallaAcceso.style.opacity = '1'; contenedorMapa.style.display = 'none'; tituloMapa.style.display = 'none'; contenedorProgreso.style.display = 'none'; }
});

// 10. UI Y FORMULARIO (EVENTOS FINALES)
window.toggleAcordeon = (idDocumento) => {
    const body = document.getElementById(`body-${idDocumento}`); const flecha = document.getElementById(`flecha-${idDocumento}`);
    if (body && flecha) { body.classList.toggle('abierto'); flecha.classList.toggle('rotada'); }
};

if (selectTipo) {
    selectTipo.addEventListener('change', (e) => {
        camposTrabajo.style.display = 'none'; camposPersonal.style.display = 'none'; camposFutbol.style.display = 'none';
        if (e.target.value === 'TRABAJO') camposTrabajo.style.display = 'block'; else if (e.target.value === 'FUTBOL') camposFutbol.style.display = 'block'; else camposPersonal.style.display = 'block';
    });
}

// 11. VISOR DE FOTOS NATIVO (LIGHTBOX)
window.abrirVisorFotos = (urlUrl) => {
    const visor = document.getElementById('visor-fotos');
    const imgVisor = document.getElementById('img-visor');
    if (visor && imgVisor) {
        imgVisor.src = urlUrl;
        visor.style.display = 'flex';
        setTimeout(() => visor.style.opacity = '1', 10);
    }
};

window.cerrarVisorFotos = () => {
    const visor = document.getElementById('visor-fotos');
    const imgVisor = document.getElementById('img-visor');
    if (visor && imgVisor) {
        visor.style.opacity = '0';
        setTimeout(() => {
            visor.style.display = 'none';
            imgVisor.src = ''; 
        }, 300);
    }
};
