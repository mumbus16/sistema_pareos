// --- VARIABLES GLOBALES ---
let idProductoABorrar = null;
let totalVenta = 0;
window.auditoriaIniciada = false;


    
// --- LOGIN ---
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const user = document.getElementById("usuario").value;
            const pass = document.getElementById("password").value;

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario: user, password: pass })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('usuarioLogueado', JSON.stringify(data.user));
                    document.getElementById("login-section").style.display = "none";
                    document.getElementById("app-container").style.display = "flex";
                    configurarInterfazPorRol(data.user.rol);
                    cargarVista('inicio');
                    notificar("Acceso Correcto", `Bienvenido(a), ${data.user.nombre}`);
                } else {
                    notificar("Error", data.mensaje, "error");
                }
            } catch (error) {
                notificar("Error", "El servidor no responde", "error");
            }
        });
    }
});

function configurarInterfazPorRol(rol) {
    if (rol === 'empleado') {
        const botonesAdmin = document.querySelectorAll('.solo-admin');
        botonesAdmin.forEach(btn => btn.style.display = 'none');
    }
}

// --- NOTIFICACIONES ---
function notificar(titulo, msg, tipo = 'exito') {
    const icon = tipo === 'exito' ? '✅' : '⚠️';
    const color = tipo === 'exito' ? '#10b981' : '#ef4444';
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.zIndex = "10005";
    modal.innerHTML = `
        <div class="modal-content" style="text-align:center; max-width:350px; background:white; padding:30px; border-radius:20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div style="font-size:50px; margin-bottom:15px;">${icon}</div>
            <h2 style="margin-bottom:10px; font-family:sans-serif;">${titulo}</h2>
            <p style="color:#64748b; margin-bottom:25px; font-family:sans-serif;">${msg}</p>
            <button class="btn-save" style="width:100%; background:${color}; color:white; padding:12px; border:none; border-radius:10px; cursor:pointer; font-weight:bold;" onclick="this.closest('.modal-overlay').remove()">Entendido</button>
        </div>`;
    document.body.appendChild(modal);
}

// --- NAVEGACIÓN ---
// 1. BLOQUEO DE NAVEGACIÓN
    // Usamos window. para asegurar que lea la misma variable que cambia en auditoria.js
    function cargarVista(vista) {
    // 1. BLOQUEO REAL
        if (window.auditoriaIniciada && vista !== 'auditoria') {
        alert("⚠️ Debes finalizar la auditoría antes de salir");
        return;
    }


    switch(vista) {
       case 'inicio':
    const user = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    document.getElementById("contenido").innerHTML = `
        <div style="padding: 30px; background: #f1f5f9; min-height: 100vh;">
            <h2 style="color: #1e293b; margin-bottom: 25px;">Resumen Operativo de Hoy</h2>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px;">
                
                <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #3b82f6;">
                    <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 0;">INGRESOS HOY</p>
                    <h3 id="dash-ventas-hoy" style="font-size: 24px; margin: 10px 0; color: #1e293b;">$0.00</h3>
                    <span style="font-size: 11px; color: #3b82f6;">↗ Corte actualizado</span>
                </div>

                <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #8b5cf6;">
                    <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 0;">ACUMULADO MES</p>
                    <h3 id="dash-ventas-mes" style="font-size: 24px; margin: 10px 0; color: #1e293b;">$0.00</h3>
                    <span style="font-size: 11px; color: #8b5cf6;">Acumulado mensual</span>
                </div>

                <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #10b981;">
                    <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 0;">TOTAL PIEZAS EN STOCK</p>
                    <h3 id="dash-stock-total" style="font-size: 24px; margin: 10px 0; color: #1e293b;">0</h3>
                    <span style="font-size: 11px; color: #10b981;">Inventario global</span>
                </div>

                <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #f59e0b;">
                    <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 0;">PRODUCTO ESTRELLA</p>
                    <h3 id="dash-top-prod" style="font-size: 18px; margin: 10px 0; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">--</h3>
                    <span style="font-size: 11px; color: #f59e0b;">Más vendido del mes</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px;">
                
                <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h4 style="margin: 0 0 20px 0; color: #1e293b;">⚠️ Artículos por Agotarse</h4>
                    <div id="lista-alertas-stock">
                        <p style="color: #94a3b8;">Cargando inventario crítico...</p>
                    </div>
                </div>

                <div style="background: #1e293b; border-radius: 15px; padding: 25px; color: white;">
                    <h4 style="margin: 0 0 20px 0;">Atajos</h4>
                    <button onclick="cargarVista('pos')" style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: none; background: #3b82f6; color: white; cursor: pointer; font-weight: bold;">+ Nueva Venta</button>
                    <button onclick="cargarVista('inventario')" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #334155; background: transparent; color: white; cursor: pointer;">📦 Ver Almacén</button>
                </div>
            </div>
        </div>
    `;

    // LLAMADA A DATOS REALES
    fetch('http://localhost:3000/api/dashboard/stats')
        .then(res => res.json())
        .then(data => {
            const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
            
            document.getElementById("dash-ventas-hoy").innerText = fmt.format(data.ventasHoy);
            document.getElementById("dash-ventas-mes").innerText = fmt.format(data.ventasMes);
            document.getElementById("dash-stock-total").innerText = data.stockTotal;
            document.getElementById("dash-top-prod").innerText = data.productoEstrella;

            // Llenar lista de alertas con nombres reales
            const lista = document.getElementById("lista-alertas-stock");
            if (data.alertas.length > 0) {
                lista.innerHTML = data.alertas.map(a => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="color: #334155; font-weight: 500;">${a.nombre}</span>
                        <span style="color: #ef4444; font-weight: bold; background: #fef2f2; padding: 4px 10px; border-radius: 20px; font-size: 12px;">Quedan ${a.cantidad}</span>
                    </div>
                `).join('');
            } else {
                lista.innerHTML = `<p style="color: #10b981;">✅ Todo el stock está en niveles óptimos.</p>`;
            }
        });
    break;
        case "inventario":
            contenido.innerHTML = `
                <div class="header-section">
                    <h1>Inventario Maestro</h1>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="busquedaSKU" placeholder="Buscar SKU o Nombre..." oninput="filtrarBusqueda()" style="padding:10px; border-radius:8px; border:1px solid #ddd; width:250px;">
                        <button class="btn-save" style="background:#2563eb; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;" onclick="abrirModalProducto()">+ Registro Masivo</button>
                    </div>
                </div>
                <table class="tabla-inventario" id="tablaMaestra" style="width:100%; background:white; border-radius:10px; overflow:hidden; border-collapse:collapse; margin-top:20px;">
                    <thead style="background:#f8fafc; cursor:pointer;">
                        <tr>
                            <th style="padding:15px; text-align:left;" onclick="ordenarTabla(0)">SKU ↕️</th>
                            <th style="padding:15px; text-align:left;" onclick="ordenarTabla(1)">Producto ↕️</th>
                            <th style="padding:15px; text-align:left;" onclick="ordenarTabla(2)">Ubicación ↕️</th>
                            <th style="padding:15px; text-align:left;">Cantidad</th>
                            <th style="padding:15px; text-align:left;">Estado</th>
                            <th style="padding:15px; text-align:left;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaInventarioMaestroBody"></tbody>
                </table>`;
            cargarInventarioMaestro();
            break;
            case "transferencias":
    cargarVistaTransferencias();
    break;
        case "precios":
            contenido.innerHTML = `
                <div class="header-section">
                    <h1>Gestión de Precios</h1>
                    <input type="text" id="busquedaPrecios" placeholder="Filtrar por SKU o Producto..." oninput="filtrarPrecios()" style="padding:10px; border-radius:8px; border:1px solid #ddd; width:300px;">
                </div>
                <table class="tabla-precios" style="width:100%; background:white; border-radius:10px; overflow:hidden; border-collapse:collapse; margin-top:20px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <thead style="background:#f1f5f9;">
                        <tr>
                            <th style="padding:15px; text-align:left;">SKU</th>
                            <th style="padding:15px; text-align:left;">Producto</th>
                            <th style="padding:15px; text-align:left; width:200px;">Precio de Venta ($)</th>
                            <th style="padding:15px; text-align:center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="tablaPreciosBody"></tbody>
                </table>`;
            cargarListaPrecios();
            break;
        case "pos":
            if (typeof cargarVistaPOS === 'function') {
                cargarVistaPOS(); // <--- Verifica que este nombre sea igual en pos.js
            } else {
                console.error("Error: pos.js no se ha cargado correctamente");
            }
            break;
        // Añadir al switch(vista) de cargarVista:
case "configuracion":
    contenido.innerHTML = `
        <div class="header-section"><h1>Ajustes del Sistema</h1></div>
        <div style="max-width: 500px; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h3 style="margin-top:0">Tipos de Cambio y Tasas</h3>
            <div style="margin-bottom: 15px;">
                <label>Dólar Americano (USD):</label>
                <input type="number" id="conf-usd" value="${tipoCambioUSD}" step="0.1" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
            </div>
            <div style="margin-bottom: 15px;">
                <label>Dólar Canadiense (CAD):</label>
                <input type="number" id="conf-cad" value="${tipoCambioCAD}" step="0.1" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
            </div>
            <div style="margin-bottom: 20px;">
                <label>IVA %:</label>
                <input type="number" id="conf-iva" value="${ivaPorcentaje}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
            </div>
            <button onclick="guardarConfiguracion()" style="width: 100%; background: #2563eb; color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; cursor:pointer;">Guardar Configuración</button>
        </div>
    `;
    break;
        case "reportes":
    if (typeof cargarVistaReportes === 'function') {
        cargarVistaReportes();
    } else {
        console.error("No se encontró la función cargarVistaReportes en reports.js");
    }
    break;
    case 'auditoria':
            contenido.innerHTML = `
                <div style="padding: 30px; background: #f8fafc;">
                    <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2>🕵️ Auditoría de Inventario</h2>
                        <p style="color: #64748b; font-size: 14px;">Selecciona la ubicación para contrastar stock físico vs sistema.</p>
                        
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <select id="select-sucursal-auditoria" style="padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; flex: 1; font-weight: bold;">
                                <option value="1">Bodega General</option>
                                <option value="2">Tienda 1</option>
                            </select>
                            <button id="btn-iniciar-auditoria" onclick="iniciarConteo()" style="background: #3b82f6; color: white; padding: 12px 25px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer;">
                                Iniciar Conteo
                            </button>
                        </div>

                        <div id="controles-auditoria" style="display: none; gap: 10px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                            <button onclick="guardarAuditoria('borrador')" style="background: #64748b; color: white; padding: 12px 20px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer;">
                                💾 Guardar Avance
                            </button>
                            <button onclick="confirmarFinalizacion()" style="background: #10b981; color: white; padding: 12px 20px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer;">
                                ✅ Finalizar y Cerrar
                            </button>
                        </div>
                    </div>

                    <div id="tabla-auditoria-container" style="display: none; margin-top: 25px;">
                        <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 15px rgba(0,0,0,0.1);">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: #1e293b; color: white;">
                                    <tr>
                                        <th style="padding: 15px; text-align: left;">Producto</th>
                                        <th style="padding: 15px; text-align: center;">Sistema</th>
                                        <th style="padding: 15px; text-align: center;">Físico</th>
                                        <th style="padding: 15px; text-align: center;">Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody id="body-auditoria"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            break;

        }
}
function toggleSeleccion(producto, checked) {
    if (checked) {
        seleccionados.push({ ...producto, cantidadTransferir: 1 });
    } else {
        seleccionados = seleccionados.filter(s => s.id_producto !== producto.id_producto);
    }
    document.getElementById("count-transfer").innerText = seleccionados.length;
}

function actualizarCantidadTransfer(id, valor) {
    const item = seleccionados.find(s => s.id_producto === id);
    if (item) item.cantidadTransferir = parseInt(valor);
}

function abrirModalConfirmarTransferencia() {
    if (seleccionados.length === 0) return notificar("Atención", "Selecciona al menos un producto", "error");

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div style="font-size: 50px; color: #2563eb; margin-bottom: 15px;">🔄</div>
            <h3>¿Confirmar Transferencia?</h3>
            <p>Estás por mover <b>${seleccionados.length} productos</b> de Bodega a Tienda 1.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; text-align: left; margin: 20px 0; max-height: 200px; overflow-y: auto;">
                ${seleccionados.map(s => `• ${s.nombre} (${s.cantidadTransferir} pzs)`).join('<br>')}
            </div>

            <div style="display: flex; gap: 10px;">
                <button onclick="procesarTransferenciaMasiva()" class="btn-save" style="flex: 1;">Aceptar y Guardar</button>
                <button onclick="this.closest('.modal-overlay').remove()" class="btn-cancel" style="flex: 1;">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function procesarTransferenciaMasiva() {
    try {
        // Enviamos la lista completa de productos seleccionados al servidor
        const res = await fetch('http://localhost:3000/api/inventario/transferir-masivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productos: seleccionados, destino: 2 })
        });

        if (res.ok) {
            notificar("¡Éxito!", "La mercancía ha sido transferida.");
            seleccionados = [];
            cargarVistaTransferencias(); // Recargar tabla
            document.querySelector(".modal-overlay")?.remove();
        }
    } catch (e) {
        notificar("Error", "No se pudo completar la transferencia masiva.", "error");
    }
}

// Función para salvar los datos
function guardarConfiguracion() {
    tipoCambioUSD = parseFloat(document.getElementById("conf-usd").value);
    tipoCambioCAD = parseFloat(document.getElementById("conf-cad").value);
    ivaPorcentaje = parseFloat(document.getElementById("conf-iva").value);
    notificar("Éxito", "Configuración actualizada correctamente");
}

// --- GESTIÓN DE PRECIOS ---
async function cargarListaPrecios() {
    try {
        const res = await fetch('http://localhost:3000/api/inventario-general');
        const data = await res.json();
        const tbody = document.getElementById("tablaPreciosBody");
        if(!tbody) return;

        const productosUnicos = {};
        data.forEach(p => {
            if (!productosUnicos[p.codigo]) productosUnicos[p.codigo] = p;
        });

        tbody.innerHTML = Object.values(productosUnicos).map(p => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding:15px;"><b>${p.codigo}</b></td>
                <td style="padding:15px;">${p.nombre}</td>
                <td style="padding:15px;">
                    <input type="number" id="price-${p.id_producto}" value="${p.precio || 0}" step="0.01" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;">
                </td>
                <td style="padding:15px; text-align:center;">
                    <button style="background:#10b981; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;" onclick="actualizarPrecioIndividual(${p.id_producto}, '${p.codigo}')">Actualizar</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function actualizarPrecioIndividual(id, codigo) {
    const inputPrecio = document.getElementById(`price-${id}`);
    const boton = inputPrecio.closest('tr').querySelector('button');
    if (inputPrecio.disabled) {
        inputPrecio.disabled = false;
        inputPrecio.style.backgroundColor = "white";
        inputPrecio.focus();
        boton.innerText = "Actualizar";
        boton.style.background = "#10b981";
        return;
    }
    const nuevoPrecio = inputPrecio.value;
    boton.disabled = true;
    boton.innerText = "⌛...";
    try {
        const res = await fetch('http://localhost:3000/api/inventario-general');
        const data = await res.json();
        const prod = data.find(item => item.id_producto === id);
        await fetch(`http://localhost:3000/api/productos/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: prod.nombre, codigo: prod.codigo, precio: nuevoPrecio, cantidad: prod.cantidad })
        });
        inputPrecio.disabled = true;
        inputPrecio.style.backgroundColor = "#f1f5f9";
        boton.disabled = false;
        boton.innerText = "✏️ Editar";
        boton.style.background = "#64748b";
        notificar("Precio Guardado", `SKU ${codigo}: $${nuevoPrecio}`);
    } catch (e) { 
        notificar("Error", "No se pudo conectar con el servidor", "error");
        boton.disabled = false;
        boton.innerText = "Actualizar";
    }
}

// --- CARGA MASIVA E INVENTARIO ---
async function buscarNombrePorSKU(inputNombre, sku) {
    if (!sku) return;
    try {
        const res = await fetch('http://localhost:3000/api/inventario-general');
        const data = await res.json();
        const existe = data.find(p => p.codigo.toUpperCase() === sku.toUpperCase());
        if (existe) {
            inputNombre.value = existe.nombre;
            inputNombre.readOnly = true;
            inputNombre.style.backgroundColor = "#f1f5f9";
        } else {
            inputNombre.readOnly = false;
            inputNombre.style.backgroundColor = "white";
        }
    } catch (e) { console.error(e); }
}

function abrirModalProducto() {
    const modal = document.createElement("div");
    modal.id = "modalMasivo";
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content modal-content-grande" style="background:white; padding:30px; border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.2); max-width:900px; width:95%;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0;">Carga de Inventario Físico</h2>
                <button class="btn-cancel" style="background:#f1f5f9; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;" onclick="document.getElementById('modalMasivo').remove()">Cerrar</button>
            </div>
            <table class="tabla-captura" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; color:#64748b; font-size:14px;">
                        <th style="padding:10px;">SKU</th>
                        <th style="padding:10px;">Nombre</th>
                        <th style="padding:10px;">Cant.</th>
                        <th style="padding:10px;">Ubicación</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="cuerpoMasivo"></tbody>
            </table>
            <div style="margin-top:25px; display:flex; justify-content:space-between;">
                <button class="btn-save" style="background:#475569; color:white; border:none; padding:12px 20px; border-radius:10px; cursor:pointer;" onclick="agregarFilaMasiva()">+ Añadir Fila (Enter)</button>
                <button class="btn-save" id="btnGuardarMasivo" style="background:#10b981; color:white; border:none; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:bold;" onclick="confirmarAntesDeGuardar()">GUARDAR TODO EN BD</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    agregarFilaMasiva();
}

function agregarFilaMasiva() {
    const tbody = document.getElementById("cuerpoMasivo");
    const tr = document.createElement("tr");
    tr.className = "fila-masiva";
    tr.innerHTML = `
        <td style="padding:5px;"><input type="text" class="in-sku" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd;" placeholder="SKU..." onchange="buscarNombrePorSKU(this.closest('tr').querySelector('.in-nombre'), this.value)" oninput="validarDuplicadosPantalla()"></td>
        <td style="padding:5px;"><input type="text" class="in-nombre" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd;" placeholder="Nombre..."></td>
        <td style="padding:5px;"><input type="number" class="in-cantidad" style="width:80px; padding:8px; border-radius:6px; border:1px solid #ddd;" value="1" min="1"></td>
        <td style="padding:5px;">
            <select class="in-destino" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd;" onchange="validarDuplicadosPantalla()">
                <option value="1">📦 Bodega</option>
                <option value="2">🏪 Tienda 1</option>
            </select>
        </td>
        <td style="padding:5px;"><button onclick="this.closest('tr').remove(); validarDuplicadosPantalla();" style="color:#ef4444; border:none; background:none; cursor:pointer; font-size:18px;">✕</button></td>`;
    tbody.appendChild(tr);
    tr.querySelector(".in-sku").focus();
}

function validarDuplicadosPantalla() {
    const filas = document.querySelectorAll(".fila-masiva");
    const registros = []; 
    let hayError = false;
    filas.forEach(f => {
        const sku = f.querySelector(".in-sku").value.trim().toUpperCase();
        const ubi = f.querySelector(".in-destino").value;
        const inputSku = f.querySelector(".in-sku");
        if (!sku) return;
        const claveUnica = `${sku}-LOC-${ubi}`;
        if (registros.includes(claveUnica)) {
            inputSku.style.border = "2px solid #ef4444";
            inputSku.style.backgroundColor = "#fee2e2";
            hayError = true;
        } else {
            inputSku.style.border = "1px solid #ddd";
            inputSku.style.backgroundColor = "white";
            registros.push(claveUnica);
        }
    });
    const btn = document.getElementById("btnGuardarMasivo");
    if (btn) {
        btn.disabled = hayError;
        btn.style.opacity = hayError ? "0.5" : "1";
    }
}

function confirmarAntesDeGuardar() {
    const filas = document.querySelectorAll(".fila-masiva");
    let totalPiezas = 0;
    filas.forEach(f => {
        const can = f.querySelector(".in-cantidad").value;
        if(f.querySelector(".in-sku").value) totalPiezas += parseInt(can);
    });
    if(totalPiezas === 0) return notificar("Aviso", "No hay datos", "error");
    const modal = document.createElement("div");
    modal.id = "modalConfirmacion";
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px; background:white; padding:30px; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.3); text-align:center;">
            <h3>📊 Resumen de Carga</h3>
            <p>Se cargarán <b>${totalPiezas} piezas</b> al sistema.</p>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn-save" style="flex:1; background:#10b981; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer;" onclick="ejecutarGuardadoFinal()">CONFIRMAR</button>
                <button class="btn-cancel" style="flex:1; background:#f1f5f9; border:none; padding:12px; border-radius:10px; cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">REGRESAR</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

async function ejecutarGuardadoFinal() {
    const filas = document.querySelectorAll(".fila-masiva");
    const mapa = {};
    filas.forEach(f => {
        const sku = f.querySelector(".in-sku").value.trim().toUpperCase();
        const nom = f.querySelector(".in-nombre").value.trim();
        const can = parseInt(f.querySelector(".in-cantidad").value) || 0;
        const ubi = f.querySelector(".in-destino").value;
        if(!sku) return;
        const clave = `${sku}-${ubi}`;
        if(!mapa[clave]) mapa[clave] = { codigo: sku, nombre: nom, cantidad: 0, id_sucursal: ubi };
        mapa[clave].cantidad += can;
    });
    try {
        await Promise.all(Object.values(mapa).map(p => 
            fetch('http://localhost:3000/api/productos', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(p)
            })
        ));
        document.getElementById("modalConfirmacion").remove();
        document.getElementById("modalMasivo").remove();
        notificar("Éxito", "Inventario actualizado.");
        cargarInventarioMaestro();
    } catch (e) { notificar("Error", "Servidor no responde", "error"); }
}

async function cargarInventarioMaestro() {
    try {
        const res = await fetch('http://localhost:3000/api/inventario-general');
        const data = await res.json();
        const tbody = document.getElementById("tablaInventarioMaestroBody");
        if(!tbody) return;
        tbody.innerHTML = data.map(p => {
            const statusColor = p.cantidad <= 0 ? '#ef4444' : (p.cantidad <= 5 ? '#f59e0b' : '#10b981');
            return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding:15px;"><b>${p.codigo}</b></td>
                <td style="padding:15px;">${p.nombre}</td>
                <td style="padding:15px; font-size:12px; color:#64748b;">${p.id_sucursal == 1 ? '📦 BODEGA' : '🏪 TIENDA 1'}</td>
                <td style="padding:15px;"><span style="background:${statusColor}; color:white; padding:4px 10px; border-radius:20px; font-weight:bold;">${p.cantidad}</span></td>
                <td style="padding:15px; font-size:12px;">${p.cantidad > 0 ? 'Disponible' : 'Agotado'}</td>
                <td style="padding:15px; display:flex; gap:5px;">
                    <button style="color:#2563eb; border:1px solid #2563eb; background:none; padding:5px 10px; border-radius:6px; cursor:pointer;" onclick="abrirModalEdicion(${JSON.stringify(p).replace(/"/g, '&quot;')})">Editar</button>
                    <button style="color:#ef4444; border:1px solid #ef4444; background:none; padding:5px 10px; border-radius:6px; cursor:pointer;" onclick="prepararEliminar(${p.id_producto})">Borrar</button>
                </td>
            </tr>`}).join('');
    } catch(e) { console.error(e); }
}

// --- EDICIÓN Y BORRADO ---
function abrirModalEdicion(p) {
    const modal = document.createElement("div");
    modal.id = "modalEdicionPrincipal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px; background:white; padding:30px; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
            <h3 style="margin-top:0;">Editar Producto</h3>
            <label style="display:block; text-align:left; font-size:12px; color:#64748b;">SKU:</label>
            <input type="text" id="edit-sku" value="${p.codigo}" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px; border:1px solid #ddd;">
            <label style="display:block; text-align:left; font-size:12px; color:#64748b;">Nombre:</label>
            <input type="text" id="edit-nombre" value="${p.nombre}" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px; border:1px solid #ddd;">
            <label style="display:block; text-align:left; font-size:12px; color:#64748b;">Cantidad:</label>
            <input type="number" id="edit-cantidad" value="${p.cantidad}" style="width:100%; padding:10px; margin-bottom:20px; border-radius:8px; border:1px solid #ddd;">
            <div style="display:flex; gap:10px;">
                <button class="btn-save" style="flex:1; background:#2563eb; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer;" onclick="preguntarAntesDeEditar(${p.id_producto}, ${p.precio})">Guardar Cambios</button>
                <button class="btn-cancel" style="flex:1; background:#f1f5f9; border:none; padding:12px; border-radius:10px; cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function preguntarAntesDeEditar(id, precio) {
    const confirmModal = document.createElement("div");
    confirmModal.id = "modalDobleConfirmacion";
    confirmModal.className = "modal-overlay";
    confirmModal.style.zIndex = "10002";
    confirmModal.innerHTML = `
        <div class="modal-content" style="max-width:300px; background:white; padding:25px; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center;">
            <h3>¿Confirmar cambios?</h3>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn-save" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;" onclick="guardarEdicionFinal(${id}, ${precio})">SÍ</button>
                <button class="btn-cancel" style="flex:1; background:#f1f5f9; border:none; padding:10px; border-radius:8px; cursor:pointer;" onclick="document.getElementById('modalDobleConfirmacion').remove()">NO</button>
            </div>
        </div>`;
    document.body.appendChild(confirmModal);
}

async function guardarEdicionFinal(id, precioActual) {
    const nombre = document.getElementById("edit-nombre").value;
    const sku = document.getElementById("edit-sku").value;
    const cant = document.getElementById("edit-cantidad").value;
    try {
        await fetch(`http://localhost:3000/api/productos/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre: nombre, codigo: sku, precio: precioActual, cantidad: cant })
        });
        document.getElementById("modalDobleConfirmacion").remove();
        document.getElementById("modalEdicionPrincipal").remove();
        notificar("Éxito", "Producto modificado.");
        cargarInventarioMaestro();
    } catch (e) { notificar("Error", "Error al guardar", "error"); }
}

function prepararEliminar(id) {
    idProductoABorrar = id;
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content" style="max-width:350px; background:white; padding:30px; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.3); text-align:center;">
            <div style="font-size:40px; margin-bottom:10px;">🗑️</div>
            <h3>¿Eliminar registro?</h3>
            <input type="password" id="passConfirm" placeholder="Clave 1234" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-bottom:15px; text-align:center;">
            <div style="display:flex; gap:10px;">
                <button class="btn-delete" style="flex:1; background:#ef4444; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:bold;" onclick="confirmarBorrado()">ELIMINAR</button>
                <button class="btn-cancel" style="flex:1; background:#f1f5f9; border:none; padding:12px; border-radius:10px; cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">CANCELAR</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

async function confirmarBorrado() {
    if(document.getElementById("passConfirm").value === "1234") {
        try {
            await fetch(`http://localhost:3000/api/productos/${idProductoABorrar}`, { method: 'DELETE' });
            document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
            notificar("Borrado", "Registro eliminado.");
            cargarInventarioMaestro();
        } catch (e) { notificar("Error", "No se pudo borrar", "error"); }
    } else {
        notificar("Error", "Clave incorrecta", "error");
    }
}

// --- UTILIDADES ---
function filtrarBusqueda() {
    const query = document.getElementById("busquedaSKU").value.toLowerCase();
    document.querySelectorAll("#tablaInventarioMaestroBody tr").forEach(f => {
        f.style.display = f.innerText.toLowerCase().includes(query) ? "" : "none";
    });
}

function filtrarPrecios() {
    const query = document.getElementById("busquedaPrecios").value.toLowerCase();
    document.querySelectorAll("#tablaPreciosBody tr").forEach(f => {
        f.style.display = f.innerText.toLowerCase().includes(query) ? "" : "none";
    });
}

async function actualizarReportes() {
    try {
        const res = await fetch('http://localhost:3000/api/reportes/totales');
        const d = await res.json();
        if(document.getElementById("repo-ingresos")) {
            document.getElementById("repo-ingresos").innerText = "$" + (d.ingresos_totales || 0).toLocaleString();
            document.getElementById("repo-cantidad").innerText = d.numero_ventas || 0;
        }
    } catch (e) {}
}

function cerrarSesion() {
    sessionStorage.removeItem('usuarioLogueado');
    location.reload(); // Esto mandará al usuario de vuelta al login
}

function ordenarTabla(n) {
    const tabla = document.getElementById("tablaMaestra");
    let cambiar, i, x, y, deberiaCambiar, dir, contadorCambios = 0;
    dir = "asc"; 
    cambiar = true;
    while (cambiar) {
        cambiar = false;
        const filas = tabla.rows;
        for (i = 1; i < (filas.length - 1); i++) {
            deberiaCambiar = false;
            x = filas[i].getElementsByTagName("TD")[n];
            y = filas[i + 1].getElementsByTagName("TD")[n];
            if (dir == "asc") {
                if (x.innerText.toLowerCase() > y.innerText.toLowerCase()) {
                    deberiaCambiar = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerText.toLowerCase() < y.innerText.toLowerCase()) {
                    deberiaCambiar = true;
                    break;
                }
            }
        }
        if (deberiaCambiar) {
            filas[i].parentNode.insertBefore(filas[i + 1], filas[i]);
            cambiar = true;
            contadorCambios ++;
        } else {
            if (contadorCambios == 0 && dir == "asc") {
                dir = "desc";
                cambiar = true;
            }
        }
    }
}
// --- VARIABLES PARA TRANSFERENCIAS ---


// ========================================================
// SECCIÓN DE TRANSFERENCIAS (REEMPLAZAR DESDE LÍNEA 600)
// ========================================================

// ========================================================
// SECCIÓN DE TRANSFERENCIAS (AJUSTES DE CENTRADO Y VALIDACIÓN)
// ========================================================

async function cargarVistaTransferencias() {
    const contenido = document.getElementById("contenido");
    if (!contenido) return;
    seleccionados = []; 
    
    contenido.innerHTML = `
        <div class="header-section">
            <div>
                <h1>Historial de Transferencias</h1>
                <p>Movimientos registrados entre sucursales</p>
            </div>
            <button onclick="abrirModalNuevaTransferencia()" class="btn-save" style="background:#2563eb;">
                🔄 Realizar Transferencia de Productos
            </button>
        </div>
        <div style="margin-top:20px;">
            <table style="width:100%; background:white; border-radius:10px; overflow:hidden; border-collapse:collapse; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                <thead style="background:#f8fafc;">
                    <tr>
                        <th style="padding:15px; text-align:left;">Fecha</th>
                        <th style="padding:15px; text-align:left;">Hora</th>
                        <th style="padding:15px; text-align:left;">Producto</th>
                        <th style="padding:15px; text-align:left;">Cant.</th>
                        <th style="padding:15px; text-align:left;">Ruta</th>
                    </tr>
                </thead>
                <tbody id="historialTransferenciasBody">
                    <tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No hay registros de transferencias</td></tr>
                </tbody>
            </table>
        </div>`;
}

async function abrirModalNuevaTransferencia() {
    seleccionados = []; 
    try {
        const res = await fetch('http://localhost:3000/api/inventario-general');
        const todosLosProductos = await res.json();

        const modal = document.createElement("div");
        modal.id = "modalTransferenciaUnico";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-content" style="max-width:1000px; width:95%; background:white; padding:25px; border-radius:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="margin:0;">Configurar Envío de Mercancía</h2>
                    <button onclick="document.getElementById('modalTransferenciaUnico').remove()" style="border:none; background:none; cursor:pointer; font-size:24px;">&times;</button>
                </div>

                <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:20px;">
                    
                    <div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f8fafc; padding:15px; border-radius:10px; margin-bottom:15px;">
                            <div>
                                <label style="font-size:11px; font-weight:bold;">ORIGEN:</label>
                                <select id="modal-trans-origen" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;" onchange="validarUbicaciones(); seleccionados=[]; actualizarVistaSeleccionados(); renderizarProductosBusqueda(this.value)">
                                    <option value="1">📦 Bodega</option>
                                    <option value="2">🏪 Tienda 1</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:11px; font-weight:bold;">DESTINO:</label>
                                <select id="modal-trans-destino" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;" onchange="validarUbicaciones()">
                                    <option value="2">🏪 Tienda 1</option>
                                    <option value="1">📦 Bodega</option>
                                </select>
                            </div>
                        </div>

                        <input type="text" placeholder="🔍 Buscar por SKU o nombre..." oninput="filtrarTablaModal(this.value)" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:10px;">
                        
                        <div style="max-height:350px; overflow-y:auto; border:1px solid #eee; border-radius:10px;">
                            <table style="width:100%; font-size:13px; text-align:left; border-collapse:collapse;">
                                <thead style="background:#f1f5f9; position:sticky; top:0;">
                                    <tr>
                                        <th style="padding:10px;">Producto</th>
                                        <th style="padding:10px;">Stock</th>
                                        <th style="padding:10px; text-align:right;">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="body-busqueda-transfer"></tbody>
                            </table>
                        </div>
                    </div>

                    <div style="background:#f9fafb; padding:15px; border-radius:15px; border:1px solid #e5e7eb; display:flex; flex-direction:column; min-height:450px;">
                        <h3 style="margin-top:0; font-size:16px;">🚀 Lista de envío</h3>
                        <div id="lista-seleccionados-transfer" style="flex-grow:1; max-height:400px; overflow-y:auto; margin-bottom:15px;">
                            <p style="color:#94a3b8; font-size:13px; text-align:center; margin-top:50px;">Usa "+ Añadir" para agregar productos</p>
                        </div>
                        <button onclick="procesarTransferenciaFinal()" class="btn-save" style="width:100%; background:#10b981; padding:15px; font-weight:bold; border-radius:10px; display:flex; justify-content:center; align-items:center; text-align:center;">
                            CONFIRMAR MOVIMIENTO
                        </button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(modal);

        window.renderizarProductosBusqueda = (origenId) => {
            const filtrados = todosLosProductos.filter(p => p.id_sucursal == origenId && p.cantidad > 0);
            const tbody = document.getElementById("body-busqueda-transfer");
            tbody.innerHTML = filtrados.map(p => `
                <tr class="fila-modal-trans" style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;"><b>${p.codigo}</b><br><small>${p.nombre}</small></td>
                    <td style="padding:10px; font-weight:bold;">${p.cantidad}</td>
                    <td style="padding:10px; text-align:right;">
                        <button onclick='agregarAlCarritoTransfer(${JSON.stringify(p).replace(/'/g, "&apos;")})' 
                            style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">
                            + Añadir
                        </button>
                    </td>
                </tr>
            `).join('');
        };

        renderizarProductosBusqueda(document.getElementById('modal-trans-origen').value);

    } catch (e) {
        notificar("Error", "Error al cargar productos", "error");
    }
}

// Función para evitar que Origen y Destino sean iguales
function validarUbicaciones() {
    const origen = document.getElementById("modal-trans-origen").value;
    const destino = document.getElementById("modal-trans-destino");
    
    if (origen === destino.value) {
        notificar("Aviso", "El destino no puede ser igual al origen", "error");
        // Cambia automáticamente al otro valor disponible
        destino.value = (origen === "1") ? "2" : "1";
    }
}

function agregarAlCarritoTransfer(p) {
    const existe = seleccionados.find(item => item.id_producto === p.id_producto);
    if (!existe) {
        seleccionados.push({ ...p, cantidadTransferir: 1 });
        actualizarVistaSeleccionados();
    } else {
        notificar("Aviso", "Ya está en la lista", "info");
    }
}

function actualizarVistaSeleccionados() {
    const contenedor = document.getElementById("lista-seleccionados-transfer");
    if (seleccionados.length === 0) {
        contenedor.innerHTML = `<p style="color:#94a3b8; font-size:13px; text-align:center; margin-top:50px;">Usa "+ Añadir" para agregar productos</p>`;
        return;
    }

    contenedor.innerHTML = seleccionados.map((p, index) => `
        <div style="background:white; padding:10px; border-radius:10px; margin-bottom:8px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:12px;">${p.codigo}</div>
                <div style="font-size:11px; color:#64748b;">${p.nombre}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="text-align:center;">
                    <span style="font-size:9px; color:#94a3b8; display:block;">CANT.</span>
                    <input type="number" value="${p.cantidadTransferir}" min="1" max="${p.cantidad}" 
                        onchange="validarStockTransfer(${index}, this.value, ${p.cantidad})"
                        style="width:45px; padding:3px; border:1px solid #cbd5e1; border-radius:5px; text-align:center;">
                </div>
                <button onclick="seleccionados.splice(${index}, 1); actualizarVistaSeleccionados();" 
                    style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px; margin-top:10px;">&times;</button>
            </div>
        </div>
    `).join('');
}

function validarStockTransfer(index, valor, maximo) {
    let num = parseInt(valor);
    if (num > maximo) {
        notificar("Stock insuficiente", `Máximo: ${maximo}`, "error");
        num = maximo;
    }
    if (num < 1 || isNaN(num)) num = 1;
    seleccionados[index].cantidadTransferir = num;
    actualizarVistaSeleccionados();
}

function filtrarTablaModal(query) {
    const q = query.toLowerCase();
    document.querySelectorAll(".fila-modal-trans").forEach(fila => {
        fila.style.display = fila.innerText.toLowerCase().includes(q) ? "" : "none";
    });
}

async function procesarTransferenciaFinal() {
    if (seleccionados.length === 0) return notificar("Error", "La lista está vacía", "error");
    
    const origen = document.getElementById("modal-trans-origen").value;
    const destino = document.getElementById("modal-trans-destino").value;

    if (origen === destino) return notificar("Error", "Origen y Destino no pueden ser iguales", "error");

    try {
        const res = await fetch('http://localhost:3000/api/inventario/transferir-masivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productos: seleccionados, origen, destino })
        });

        if (res.ok) {
            notificar("¡Hecho!", "Transferencia realizada con éxito.");
            document.getElementById('modalTransferenciaUnico').remove();
            cargarVistaTransferencias(); 
        }
    } catch (e) {
        notificar("Error", "Fallo al conectar con servidor", "error");
    }
}

function notificar(titulo, mensaje, tipo = "success") {
    const n = document.createElement("div");
    n.className = `notification ${tipo}`;
    n.innerHTML = `<strong>${titulo}</strong><p>${mensaje}</p>`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
}
async function cargarDatosHistorial() {
    try {
        const res = await fetch('http://localhost:3000/api/historial-transferencias');
        const datos = await res.json();
        const tbody = document.getElementById("historialTransferenciasBody");
        
        if (datos.length > 0) {
            tbody.innerHTML = datos.map(h => `
                <tr>
                    <td style="padding:10px;">${h.fecha}</td>
                    <td style="padding:10px;">${h.hora}</td>
                    <td style="padding:10px;">${h.nombre_producto}</td>
                    <td style="padding:10px;">${h.cantidad}</td>
                    <td style="padding:10px;">${h.origen_id == 1 ? 'Bodega' : 'Tienda 1'} → ${h.destino_id == 1 ? 'Bodega' : 'Tienda 1'}</td>
                </tr>
            `).join('');
        }
    } catch (e) { console.log("Error cargando historial"); }
}
// --- LÓGICA DEL CARRITO POS ---
// --- FUNCIONES DEL POS ---
async function buscarProductoPOS(valor) {
    const resDiv = document.getElementById("resultadosBusqueda");
    if (valor.length < 2) { resDiv.innerHTML = ""; return; }

    const usuario = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    try {
        const response = await fetch(`http://localhost:3000/api/pos/buscar?q=${valor}&sucursal=${usuario.id_sucursal}`);
        const productos = await response.json();

        resDiv.innerHTML = productos.map(p => `
            <div onclick='agregarAlCarrito(${JSON.stringify(p)})' 
                 style="padding:10px; border-bottom:1px solid #eee; cursor:pointer; background:#fff;" 
                 onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                <strong>${p.nombre}</strong> - ${p.codigo} 
                <span style="float:right; color:#10b981;">$${p.precio} (Stock: ${p.cantidad})</span>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}


    // Actualizar los números de abajo
  // Al final de script.js, donde se actualizan los números:
const ivaElem = document.getElementById("iva-monto");
const totalElem = document.getElementById("total-venta");

// Solo intentamos escribir si los elementos existen en la pantalla
if (ivaElem && totalElem) {
    const subtotalSinIva = totalVenta / (1 + (ivaPorcentaje / 100));
    const montoIva = totalVenta - subtotalSinIva;

    ivaElem.innerText = `$${montoIva.toFixed(2)}`;
    totalElem.innerText = `$${totalVenta.toFixed(2)}`;
} else {
    // Si no existen, no pasa nada, el código sigue vivo y permite descargar el reporte
    console.log("No estamos en la vista POS, ignorando actualización de totales.");
}

function configurarInterfazPorRol(rol) {
    // 1. Buscamos los botones por el texto que contienen o por su clase
    const botones = document.querySelectorAll(".sidebar button");

    botones.forEach(btn => {
        const texto = btn.innerText.toLowerCase();

        // REGLAS PARA VENDEDOR
        if (rol === 'vendedor') {
            // El vendedor NO puede ver Inventario Maestro, Reportes ni Auditoría
            if (texto.includes("inventario maestro") || 
                texto.includes("reporte") || 
                texto.includes("auditoría")) {
                btn.style.display = "none"; // Los ocultamos para que no estorben
            }
        }

      
        
        // ADMIN Y INVENTARIOS PUEDEN VER todos, así que no ocultamos nada.
    });
}
async function cargarDatosDashboard() {
    try {
        const res = await fetch('http://localhost:3000/api/dashboard/stats');
        const data = await res.json();

        // Llenar tarjetas principales
        document.getElementById("dash-ventas-hoy").innerText = `$${Number(data.ventasHoy).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById("dash-productos-total").innerText = data.stockTotal.toLocaleString();
        document.getElementById("dash-stock-bajo").innerText = data.alertasCount;

        // Si hay productos críticos, mostrar la lista
        if (data.alertasCount > 0) {
            const container = document.getElementById("lista-alertas-container");
            const lista = document.getElementById("lista-stock-bajo");
            container.style.display = "block";
            
            lista.innerHTML = data.productosCriticos.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #334155;">${p.nombre}</span>
                    <span style="background: #fef2f2; color: #ef4444; padding: 2px 10px; border-radius: 20px; font-weight: bold; font-size: 12px;">Quedan: ${p.cantidad}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Error al cargar dashboard:", error);
    }
}

function abrirModalConfirmacion() {
    // Creamos un overlay oscuro
    const overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:1000;";
    
    overlay.innerHTML = `
        <div style="background:white; padding:30px; border-radius:20px; width:400px; text-align:center; box-shadow:0 20px 25px rgba(0,0,0,0.2);">
            <div style="font-size:50px; margin-bottom:15px;">⚠️</div>
            <h3 style="margin:0; color:#1e293b;">¿Finalizar Auditoría?</h3>
            <p style="color:#64748b; font-size:14px; margin:15px 0;">Una vez guardada, los datos se enviarán al reporte de gerencia y no podrán editarse.</p>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button onclick="document.getElementById('modal-overlay').remove()" style="padding:10px 20px; border-radius:10px; border:1px solid #e2e8f0; background:white; cursor:pointer;">Cancelar</button>
                <button onclick="ejecutarGuardadoFinal()" style="padding:10px 20px; border-radius:10px; border:none; background:#10b981; color:white; font-weight:bold; cursor:pointer;">Sí, Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function ejecutarFinalAuditoria() {
    const elemento = document.getElementById("modalSeguridad");

if (elemento) {
    elemento.remove();
}
}


