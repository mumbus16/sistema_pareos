let productosEnAuditoria = [];

// 🔥 INICIAR AUDITORÍA
async function iniciarConteo() {
    const select = document.getElementById("select-sucursal-auditoria");

    if (!select) {
        alert("Error: no existe el selector de sucursal");
        return;
    }

    const sucId = select.value;

    if (!sucId) {
        alert("Selecciona una sucursal");
        return;
    }

    // 🔥 GUARDAR GLOBAL
    window.sucursalAuditoriaId = sucId;

    try {
        const res = await fetch(`http://localhost:3000/api/productos/auditoria/${sucId}`);
        const data = await res.json();
        
        if (!data || data.length === 0) {
            alert("Esta ubicación no tiene productos cargados.");
            return;
        }

        productosEnAuditoria = data.map(p => ({
            ...p,
            conteoFisico: 0
        }));
        
        window.auditoriaIniciada = true; 
        
        // 🔥 VALIDAR ELEMENTOS
        const tabla = document.getElementById("tabla-auditoria-container");
        const controles = document.getElementById("controles-auditoria");
        const btn = document.getElementById("btn-iniciar-auditoria");

        if (tabla) tabla.style.display = 'block';
        if (controles) controles.style.display = 'flex';
        if (btn) btn.style.display = 'none';

        select.disabled = true;

        renderizarTablaAuditoria();

    } catch (e) { 
        console.error(e);
        alert("Error de conexión"); 
    }
}

// 🔥 TABLA
function renderizarTablaAuditoria() {
    const tbody = document.getElementById("body-auditoria");

    if (!tbody) return;

    tbody.innerHTML = productosEnAuditoria.map((p, i) => {
        const dif = p.conteoFisico - p.cantidad;
        const color = dif < 0 ? '#ef4444' : (dif > 0 ? '#10b981' : '#64748b');

        return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 15px;">
                <strong>${p.codigo}</strong><br>
                <small>${p.nombre}</small>
            </td>
            <td style="padding: 15px; text-align: center;">${p.cantidad}</td>
            <td style="padding: 15px; text-align: center;">
                <input type="number" value="${p.conteoFisico}" 
                    oninput="actualizarCantidad(${i}, this.value)" 
                    style="width: 70px; padding: 5px; text-align: center; border-radius: 5px; border: 1px solid #cbd5e1;">
            </td>
            <td id="dif-${i}" style="padding: 15px; text-align: center; font-weight: bold; color:${color}">
                ${dif > 0 ? '+' : ''}${dif}
            </td>
        </tr>`;
    }).join('');
}

// 🔥 ACTUALIZAR INPUT
function actualizarCantidad(index, valor) {
    const num = parseInt(valor) || 0;
    productosEnAuditoria[index].conteoFisico = num;

    const dif = num - productosEnAuditoria[index].cantidad;
    const celda = document.getElementById(`dif-${index}`);

    if (!celda) return;

    celda.innerText = (dif > 0 ? '+' : '') + dif;
    celda.style.color = dif < 0 ? '#ef4444' : (dif > 0 ? '#10b981' : '#64748b');
}

// 🔥 GUARDAR + ACTUALIZAR INVENTARIO
async function guardarAuditoria(tipo) {
    console.log("1. Guardando auditoría:", tipo);
    
    const user = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    if (!user) return alert("No hay sesión activa");

    const sucursalId = window.sucursalAuditoriaId;

    if (!sucursalId) {
        alert("No hay sucursal seleccionada");
        return;
    }

    const totalSistema = productosEnAuditoria.reduce((a, b) => a + b.cantidad, 0);
    const totalFisico = productosEnAuditoria.reduce((a, b) => a + b.conteoFisico, 0);

    const body = {
        usuario: user.nombre,
        sucursal: sucursalId, // 🔥 mejor mandar ID real
        sistema: totalSistema,
        fisico: totalFisico,
        diferencia: totalFisico - totalSistema,
        estado: tipo 
    };

    try {
        // 🔹 GUARDAR AUDITORÍA
        const res = await fetch('http://localhost:3000/api/auditoria/finalizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(errorText);
            return alert("Error al guardar auditoría");
        }

        console.log("✅ Auditoría guardada");

        // 🔥 PRODUCTOS
        const productosAuditados = productosEnAuditoria.map(p => ({
            id_producto: p.id_producto,
            sistema: p.cantidad,
            fisico: p.conteoFisico
        }));

        // 🔥 ACTUALIZAR INVENTARIO
        const res2 = await fetch('http://localhost:3000/api/auditoria/aplicar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sucursal: sucursalId,
                productos: productosAuditados
            })
        });

        if (!res2.ok) {
            console.error("Error actualizando inventario");
            return alert("Auditoría guardada, pero falló actualizar stock");
        }

        console.log("✅ Inventario actualizado");

        if (tipo === 'finalizado') {
            window.auditoriaIniciada = false;
            alert("✅ Auditoría finalizada y stock actualizado");
            cargarVista('inicio');
        }

    } catch (e) { 
        console.error(e);
        alert("Error de conexión con el servidor"); 
    }
}

// 🔥 CONFIRMAR
function confirmarFinalizacion() {
    if (confirm("¿Deseas finalizar la auditoría? Se actualizará el inventario.")) {
        guardarAuditoria('finalizado');
    }
}