// reports.js

// reports.js
async function cargarVistaReportes() {
    const contenido = document.getElementById("contenido");
    // Obtenemos la fecha de hoy para ponerla por defecto
    const hoy = new Date().toISOString().split('T')[0];

    contenido.innerHTML = `
        <div style="padding:40px; background: #f8fafc; min-height: 100vh; font-family: 'Segoe UI', sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h2 style="color: #1e293b; text-align: center; margin-bottom: 10px;">📊 Centro de Reportes</h2>
                <p style="color: #64748b; text-align: center; margin-bottom: 30px;">Selecciona el rango de fechas para exportar a Excel</p>
                
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #475569;">Desde:</label>
                        <input type="date" id="fecha-inicio" value="${hoy}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 16px;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #475569;">Hasta:</label>
                        <input type="date" id="fecha-fin" value="${hoy}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 16px;">
                    </div>

                    <button onclick="descargarExcelProfesional()" 
                        style="background: #2563eb; color: white; padding: 15px; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px;">
                        📥 Generar Reporte Profesional
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function descargarExcelProfesional() {
    const inicio = document.getElementById("fecha-inicio").value;
    const fin = document.getElementById("fecha-fin").value;

    if (!inicio || !fin) return alert("Por favor selecciona ambas fechas");

    try {
        const url = `http://localhost:3000/api/reporte/rango?inicio=${inicio}&fin=${fin}`;
        const res = await fetch(url);
        const datos = await res.json();

        if (datos.length === 0) {
            alert("No hay ventas registradas en este periodo.");
            return;
        }

        // --- AQUÍ EMPIEZA LA GENERACIÓN DEL ARCHIVO (Sin funciones externas) ---
        const wb = XLSX.utils.book_new();
        
        const content = [
            ["PAREOS IN PARADISE"],
            ["REPORTE EJECUTIVO DE VENTAS"],
            [""],
            ["PERIODO:", `${inicio} al ${fin}`],
            ["GENERADO EL:", new Date().toLocaleString()],
            [""],
            ["CÓDIGO", "DESCRIPCIÓN DEL PRODUCTO", "PIEZAS", "P. UNITARIO", "SUBTOTAL"]
        ];

        let granTotal = 0;
        datos.forEach(item => {
            const subtotal = item.cantidad_vendida * item.precio_unitario;
            granTotal += subtotal;
            content.push([
                item.codigo,
                item.nombre.toUpperCase(),
                item.cantidad_vendida,
                item.precio_unitario,
                subtotal
            ]);
        });

        content.push([""], ["", "", "", "TOTAL GENERAL:", granTotal]);

        const ws = XLSX.utils.aoa_to_sheet(content);

        // Ajuste de columnas para que se vea profesional
        ws['!cols'] = [
            { wch: 15 }, // Código
            { wch: 40 }, // Nombre
            { wch: 10 }, // Cantidad
            { wch: 12 }, // Precio
            { wch: 12 }  // Subtotal
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Ventas");
        XLSX.writeFile(wb, `Reporte_Pareos_${inicio}_a_${fin}.xlsx`);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        alert("Error al conectar con el servidor.");
    }
}