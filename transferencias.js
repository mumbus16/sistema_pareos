let productosBodega = [];
let seleccionados = [];

async function cargarVistaTransferencias() {
    const contenido = document.getElementById("contenido");
    await obtenerStockBodega();

    contenido.innerHTML = `
        <div class="header-section" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h1>Transferencia de Mercancía</h1>
                <p>Selecciona los productos de <b>Bodega</b> que deseas enviar a <b>Tienda 1</b></p>
            </div>
            <button onclick="abrirModalConfirmarTransferencia()" class="btn-save" style="background:#2563eb; padding: 12px 24px;">
                🔄 Transferir Productos (<span id="count-transfer">0</span>)
            </button>
        </div>

        <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 20px;">
            <input type="text" placeholder="🔍 Filtrar por SKU o Nombre..." 
                   style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px;"
                   oninput="renderizarTablaTransfer(this.value)">

            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid #f1f5f9; color: #64748b;">
                        <th style="padding: 12px;">Seleccionar</th>
                        <th style="padding: 12px;">SKU</th>
                        <th style="padding: 12px;">Nombre</th>
                        <th style="padding: 12px;">Stock Bodega</th>
                        <th style="padding: 12px;">Cant. a Enviar</th>
                        <th style="padding: 12px;">Destino</th>
                    </tr>
                </thead>
                <tbody id="tabla-transfer-body">
                    </tbody>
            </table>
        </div>
    `;
    renderizarTablaTransfer();
}

async function obtenerStockBodega() {
    const res = await fetch('http://localhost:3000/api/inventario-general');
    const todos = await res.json();
    // Solo mostramos productos que tengan stock en Bodega (Sucursal 1)
    productosBodega = todos.filter(p => p.id_sucursal == 1 && p.cantidad > 0);
}

function renderizarTablaTransfer(filtro = "") {
    const tbody = document.getElementById("tabla-transfer-body");
    const filtrados = productosBodega.filter(p => 
        p.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
        p.codigo.toLowerCase().includes(filtro.toLowerCase())
    );

    tbody.innerHTML = filtrados.map(p => {
        const isChecked = seleccionados.some(s => s.id_producto === p.id_producto);
        return `
            <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 12px;">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} 
                           onchange="toggleSeleccion(${JSON.stringify(p).replace(/'/g, "&apos;")}, this.checked)">
                </td>
                <td style="padding: 12px;"><b>${p.codigo}</b></td>
                <td style="padding: 12px;">${p.nombre}</td>
                <td style="padding: 12px;"><span style="background:#f1f5f9; padding:4px 8px; border-radius:5px;">${p.cantidad}</span></td>
                <td style="padding: 12px;">
                    <input type="number" min="1" max="${p.cantidad}" placeholder="Cant."
                           style="width: 80px; padding: 5px; border-radius: 5px; border: 1px solid #cbd5e1;"
                           onchange="actualizarCantidadTransfer(${p.id_producto}, this.value)">
                </td>
                <td style="padding: 12px;">
                    <span style="color: #2563eb; font-weight: bold;">📍 Tienda 1</span>
                </td>
            </tr>
        `;
    }).join('');
}