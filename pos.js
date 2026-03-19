// --- VARIABLES GLOBALES DEL POS ---
// Estas deben estar afuera para que todas las funciones las vean
let carrito = [];
let productosBaseDatos = []; 
let tipoCambioUSD = 18.50; // Valor por defecto
let tipoCambioCAD = 13.50; // Valor por defecto
let ivaPorcentaje = 16;   // Valor por defecto

/**
 * Función Principal: Carga la interfaz del POS
 */
async function cargarVistaPOS() {
    const contenido = document.getElementById("contenido");
    if (!contenido) return;

    // Cargamos los productos filtrados por Tienda 1 (id_sucursal 2)
    await obtenerProductosTienda();

    contenido.innerHTML = `
        <div class="header-section" style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Punto de Venta - Tienda 1</h1>
            <button onclick="limpiarCarrito()" style="background:#ef4444; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">🗑️ Limpiar Carrito</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-top: 20px; height: calc(100vh - 180px);">
            
            <div style="display: flex; flex-direction: column; gap: 15px; overflow: hidden;">
                <div style="background: white; padding: 15px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <input type="text" id="buscar-pos" placeholder="🔍 Buscar por SKU o nombre..." 
                           style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"
                           oninput="renderizarCards(this.value)">
                </div>

                <div id="contenedor-cards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; overflow-y: auto; padding-bottom: 20px;">
                    </div>
            </div>

            <div style="background: white; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden;">
                <div style="background: #1e293b; color: white; padding: 15px; text-align: center;">
                    <h3 style="margin: 0;">Resumen de Venta</h3>
                </div>
                
                <div style="flex: 1; overflow-y: auto; padding: 10px;" id="lista-carrito">
                    </div>

                <div style="background: #f8fafc; padding: 20px; border-top: 2px dashed #cbd5e1;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #64748b;">
        <span>Artículos:</span>
        <b id="cant-articulos">0</b>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #64748b; font-size: 12px;">
        <span>IVA Incluido (${ivaPorcentaje}%):</span>
        <b id="iva-monto">$0.00</b>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 26px; font-weight: 800; color: #1e293b; margin-top: 10px;">
        <span>TOTAL:</span>
        <span id="total-venta">$0.00</span>
    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 26px; font-weight: 800; color: #1e293b; margin-top: 10px;">
                        <span>TOTAL:</span>
                        <span id="total-venta">$0.00</span>
                    </div>
                    <button onclick="abrirModalPago()" style="width: 100%; background: #10b981; color: white; border: none; padding: 18px; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 15px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                        COBRAR AHORA
                    </button>
                </div>
            </div>
        </div>
    `;

    renderizarCards();
    actualizarInterfazCarrito();
}

/**
 * Lógica de Datos y Renderizado
 */
async function obtenerProductosTienda() {
    try {
        const res = await fetch('https://sistema-pareos.onrender.com/api/inventario-general');
        const todos = await res.json();
        // Filtramos para que solo salgan productos de Tienda 1 (Sucursal 2)
        productosBaseDatos = todos.filter(p => p.id_sucursal == 2);
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

function renderizarCards(filtro = "") {
    const contenedor = document.getElementById("contenedor-cards");
    if (!contenedor) return;

    const filtrados = productosBaseDatos.filter(p => 
        p.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
        p.codigo.toLowerCase().includes(filtro.toLowerCase())
    );

    contenedor.innerHTML = filtrados.map(p => {
        const productoJSON = JSON.stringify(p).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        return `
            <div class="card-producto" onclick="agregarAlCarrito(${productoJSON})" 
                 style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">

                <!-- IMAGEN -->
                <div style="height: 100px; margin-bottom: 8px;">
                    <img src="img/${p.codigo}.png"
                         alt="${p.nombre}"
                         style="width:100%; height:100%; object-fit:cover; border-radius:8px;"
                         onerror="this.src='img/default.png'">
                </div>

                <div style="font-size: 11px; color: #64748b; font-weight: bold;">${p.codigo}</div>
                <div style="font-size: 13px; font-weight: bold; margin: 4px 0; height: 32px; overflow: hidden; line-height:1.2;">${p.nombre}</div>
                <div style="color: #10b981; font-weight: 800; font-size: 16px;">$${p.precio || 0}</div>
                <div style="font-size: 11px; color: #94a3b8;">Stock: ${p.cantidad}</div>
            </div>
        `;
    }).join('');
}

/**
 * Gestión del Carrito
 */
function agregarAlCarrito(producto) {
    if (producto.cantidad <= 0) {
        return notificar("Sin Stock", "No hay existencias en Tienda 1", "error");
    }

    const existente = carrito.find(item => item.id_producto === producto.id_producto);
    if (existente) {
        if (existente.cantidad < producto.cantidad) {
            existente.cantidad++;
        } else {
            notificar("Límite alcanzado", "No puedes agregar más del stock disponible", "error");
        }
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    actualizarInterfazCarrito();
}

function actualizarInterfazCarrito() {
    const lista = document.getElementById("lista-carrito");
    if (!lista) return;

    let totalVenta = 0; // Este es el precio final que ya trae IVA
    let totalItems = 0;

    lista.innerHTML = carrito.map((p, index) => {
        const filaTotal = p.precio * p.cantidad;
        totalVenta += filaTotal;
        totalItems += p.cantidad;
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #f1f5f9;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 13px;">${p.nombre}</div>
                    <div style="font-size: 11px; color: #64748b;">$${p.precio} x ${p.cantidad}</div>
                </div>
                <div style="font-weight: bold;">$${filaTotal.toFixed(2)}</div>
                <button onclick="eliminarFila(${index})" style="background: none; color: #ef4444; border: none; padding: 5px; cursor: pointer; font-size: 16px;">✕</button>
            </div>
        `;
    }).join('');

    /**
     * CÁLCULO INVERSO DE IVA
     * Si el precio ya tiene IVA (16%), la fórmula para saber cuánto es de puro impuesto es:
     * IVA = Total - (Total / 1.16)
     */
    const subtotalSinIva = totalVenta / (1 + (ivaPorcentaje / 100));
    const montoIva = totalVenta - subtotalSinIva;

    // Actualizamos las etiquetas en la interfaz
    // Mostramos el total directo, sin sumarle nada más
    document.getElementById("iva-monto").innerText = `$${montoIva.toFixed(2)}`;
    document.getElementById("total-venta").innerText = `$${totalVenta.toFixed(2)}`;
    document.getElementById("cant-articulos").innerText = totalItems;
    
    // Guardar para el modal de pago
    window.totalVentaActual = totalVenta;
}

function eliminarFila(index) {
    carrito.splice(index, 1);
    actualizarInterfazCarrito();
}

function limpiarCarrito() {
    if (carrito.length === 0) return;

    // Vaciamos el array
    carrito = [];
    actualizarInterfazCarrito();

    // Mostramos la confirmación visual elegante
    mostrarAvisoLimpieza();
}

function mostrarAvisoLimpieza() {
    // Creamos el contenedor del aviso
    const aviso = document.createElement("div");
    aviso.style.position = "fixed";
    aviso.style.bottom = "30px";
    aviso.style.left = "50%";
    aviso.style.transform = "translateX(-50%)";
    aviso.style.background = "#1e293b"; // Color oscuro profesional
    aviso.style.color = "white";
    aviso.style.padding = "15px 30px";
    aviso.style.borderRadius = "12px";
    aviso.style.boxShadow = "0 10px 15px rgba(0,0,0,0.2)";
    aviso.style.display = "flex";
    aviso.style.alignItems = "center";
    aviso.style.gap = "12px";
    aviso.style.zIndex = "10000";
    aviso.style.animation = "subirAviso 0.3s ease-out";

    aviso.innerHTML = `
        <span style="font-size: 20px;">🗑️</span>
        <span style="font-weight: bold;">El carrito se ha limpiado correctamente</span>
    `;

    document.body.appendChild(aviso);

    // Lo eliminamos automáticamente después de 2.5 segundos
    setTimeout(() => {
        aviso.style.animation = "bajarAviso 0.3s ease-in";
        setTimeout(() => aviso.remove(), 300);
    }, 2500);
}

/**
 * Proceso de Pago
 */
function abrirModalPago() {
    if (carrito.length === 0) return notificar("Carrito vacío", "Agrega productos antes de cobrar", "error");

    const modal = document.createElement("div");
    modal.id = "modal-pago";
    modal.className = "modal-overlay";
    modal.style.zIndex = "9999";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: 0; border-radius: 20px; overflow: hidden;">
            <div style="background: #1e293b; color: white; padding: 25px; text-align: center;">
                <p style="margin:0; opacity: 0.8; font-size: 14px;">TOTAL A COBRAR (MXN)</p>
                <h2 style="margin:5px 0 0 0; font-size: 42px;">$${window.totalVentaActual.toFixed(2)}</h2>
            </div>
            
            <div style="padding: 25px; background: white;">
                <div style="margin-bottom: 20px;">
                    <label style="display:block; margin-bottom: 8px; font-weight: bold; color: #64748b;">Método de Pago:</label>
                    <select id="metodo-pago" style="width:100%; padding: 15px; border-radius: 10px; border: 2px solid #e2e8f0; font-size: 16px;" onchange="recalcularCambio()">
                        <option value="MXN">💵 Efectivo Pesos (MXN)</option>
                        <option value="USD">🇺🇸 Dólares (USD)</option>
                        <option value="CAD">🇨🇦 Dólares Canadienses (CAD)</option>
                        <option value="TARJETA">💳 Tarjeta (Débito/Crédito)</option>
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <label style="display:block; margin-bottom: 8px; font-weight: bold; color: #64748b;">Recibido:</label>
                        <input type="number" id="efectivo-recibido" placeholder="0.00" 
                               style="width:100%; padding: 15px; font-size: 24px; border-radius: 10px; border: 2px solid #2563eb; font-weight: bold;" 
                               oninput="recalcularCambio()" autofocus>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom: 8px; font-weight: bold; color: #64748b;">Cambio (MXN):</label>
                        <div id="cambio-cliente" style="font-size: 30px; font-weight: 800; color: #10b981; padding-top: 10px;">$0.00</div>
                    </div>
                </div>

                <div style="margin-top: 25px; display: flex; gap: 10px;">
                    <button onclick="registrarVentaBD()" style="flex: 2; background: #10b981; color: white; border: none; padding: 18px; border-radius: 12px; font-weight: bold; font-size: 18px; cursor: pointer;">CONCLUIR VENTA</button>
                    <button onclick="document.getElementById('modal-pago').remove()" style="flex: 1; background: #f1f5f9; border: none; padding: 18px; border-radius: 12px; cursor: pointer; color: #64748b; font-weight: bold;">CANCELAR</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function recalcularCambio() {
    const metodo = document.getElementById("metodo-pago").value;
    const recibido = parseFloat(document.getElementById("efectivo-recibido").value) || 0;
    const totalMXN = window.totalVentaActual;
    
    let cambio = 0;

    if (metodo === "MXN") {
        cambio = recibido - totalMXN;
    } else if (metodo === "USD") {
        // Se recibe en dólares, se resta el total convertido a dólares
        const totalEnUSD = totalMXN / tipoCambioUSD;
        cambio = (recibido - totalEnUSD) * tipoCambioUSD;
    } else if (metodo === "CAD") {
        const totalEnCAD = totalMXN / tipoCambioCAD;
        cambio = (recibido - totalEnCAD) * tipoCambioCAD;
    } else if (metodo === "TARJETA") {
        document.getElementById("efectivo-recibido").value = totalMXN;
        cambio = 0;
    }

    document.getElementById("cambio-cliente").innerText = cambio > 0 ? `$${cambio.toFixed(2)}` : "$0.00";
}

async function registrarVentaBD() {
    if (carrito.length === 0) return;

    const usuario = JSON.parse(sessionStorage.getItem('usuarioLogueado')) || { id_usuario: 1, id_sucursal: 2 };
    const totalVenta = window.totalVentaActual || 0;

    const datosVenta = {
        productos: carrito,
        total: totalVenta,
        id_usuario: usuario.id_usuario,
        id_sucursal: 2 // Tienda 1
    };

    try {
        // Aquí es donde definimos "res"
        const res = await fetch('https://sistema-pareos.onrender.com/api/pos/venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });

        if (res.ok) { // Ahora "res" sí existe y no dará error
            notificar("¡Venta Exitosa!", "Generando PDF...");
            
            // Llamamos a la función del PDF (asegúrate de haberla pegado antes)
            generarPDFTicket(datosVenta);

            if(document.getElementById('modal-pago')) {
                document.getElementById('modal-pago').remove();
            }
            
            carrito = [];
            actualizarInterfazCarrito();
            await obtenerProductosTienda(); 
            renderizarCards();
        } else {
            const errorData = await res.json();
            alert("Error: " + (errorData.detalle || "No se pudo guardar"));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión con el servidor");
    }
}
function generarPDFTicket(datosVenta) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200] 
    });

    const centro = 40;
    let y = 10;

    // --- ENCABEZADO DE EMPRESA ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12); // Bajamos un poco el tamaño para que quepa mejor el nombre
    doc.text("PEDRO OROZCO CARRILLO", centro, y, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text("RFC: OOCP910228I90", centro, y, { align: "center" });
    
    y += 4;
    // --- SOLUCIÓN DIRECCIÓN QUE SE CORTA ---
    const direccion = "AVENIDA FRANCISCO VILLA #1470, COL. LOS SAUCES PUERTO VALLARTA C.P. 48328";
    const direccionDividida = doc.splitTextToSize(direccion, 70); // Divide el texto si pasa de 70mm
    doc.text(direccionDividida, centro, y, { align: "center" });
    
    // Calculamos el salto de línea dinámico (3.5mm por cada línea de texto)
    y += (direccionDividida.length * 4); 
    
    doc.text("WhatsApp: +52 322 351 5397", centro, y, { align: "center" });
    y += 4;
    doc.text("Instagram: @PAREOSINPARADISE", centro, y, { align: "center" });
    
    y += 5;
    doc.line(5, y, 75, y); 
    y += 5;

    // --- INFO DE VENTA ---
    doc.setFont("helvetica", "bold");
    doc.text(`TICKET: #V-${Math.floor(Math.random()*10000)}`, 5, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, y + 4);
    
    y += 12;

    // --- TABLA DE PRODUCTOS ---
    doc.setFont("helvetica", "bold");
    doc.text("COD", 5, y);
    doc.text("PRODUCTO", 20, y);
    doc.text("CANT", 55, y);
    doc.text("TOTAL", 65, y);
    
    y += 2;
    doc.line(5, y, 75, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    datosVenta.productos.forEach(p => {
        doc.setFontSize(7);
        doc.text(p.codigo || 'S/C', 5, y); 
        
        doc.setFontSize(8);
        doc.text(p.nombre.substring(0, 18), 20, y);
        doc.text(p.cantidad.toString(), 57, y);
        doc.text(`$${(p.precio * p.cantidad).toFixed(2)}`, 65, y);
        y += 6;

        if (y > 185) { // Margen de seguridad antes de nueva página
            doc.addPage();
            y = 10;
        }
    });

    // --- TOTALES ---
    y += 2;
    doc.line(5, y, 75, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: $${datosVenta.total.toFixed(2)} MXN`, 75, y, { align: "right" });

    // --- PIE DE PÁGINA ---
    y += 12;
    doc.setFontSize(7); // Un poco más pequeño para las políticas
    doc.setFont("helvetica", "italic");
    doc.text("Este no es un comprobante fiscal.", centro, y, { align: "center" });
     y += 4;
    doc.text("Solicita tu factura al momento..", centro, y, { align: "center" });
     y += 4;
    doc.text("Tienes 30 dias para solicitarla", centro, y, { align: "center" });
    y += 4;
    doc.text("No se aceptan devoluciones en prendas íntimas.", centro, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("¡GRACIAS POR TU VISITA!", centro, y, { align: "center" });

    window.open(doc.output('bloburl'), '_blank');
}
function actualizarInterfazCarrito() {
    // 1. Buscamos el contenedor donde se dibujan los productos
    const lista = document.getElementById("lista-carrito");
    
    // Si no existe, lo buscamos por el otro nombre posible
    const listaAlterna = document.getElementById("carritoBody");
    
    const contenedorFinal = lista || listaAlterna;

    if (!contenedorFinal) {
        console.error("ERROR: No se encontró el contenedor del carrito (lista-carrito o carritoBody)");
        return;
    }

    let totalVenta = 0;
    let totalItems = 0;

    contenedorFinal.innerHTML = carrito.map((p, index) => {
        const filaTotal = p.precio * p.cantidad;
        totalVenta += filaTotal;
        totalItems += p.cantidad;
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #f1f5f9;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 13px;">${p.nombre}</div>
                    <div style="font-size: 11px; color: #64748b;">$${p.precio} x ${p.cantidad}</div>
                </div>
                <div style="font-weight: bold;">$${filaTotal.toFixed(2)}</div>
                <button onclick="eliminarFila(${index})" style="background: none; color: #ef4444; border: none; padding: 5px; cursor: pointer;">✕</button>
            </div>
        `;
    }).join('');

    // 2. Actualizamos los totales (Aseguramos que existan los elementos)
    const totalElem = document.getElementById("total-venta");
    const cantElem = document.getElementById("cant-articulos");
    const ivaElem = document.getElementById("iva-monto");

    if (totalElem) totalElem.innerText = `$${totalVenta.toFixed(2)}`;
    if (cantElem) cantElem.innerText = totalItems;
    if (ivaElem) {
        const subtotalSinIva = totalVenta / (1 + (ivaPorcentaje / 100));
        ivaElem.innerText = `$${(totalVenta - subtotalSinIva).toFixed(2)}`;
    }
    
    window.totalVentaActual = totalVenta;
}
