require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURACIÓN DE CONEXIÓN (POOL DE PROMESAS) ---
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
user: process.env.MYSQLUSER,
password: process.env.MYSQLPASSWORD,
database: process.env.MYSQLDATABASE,
port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const path = require("path");

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- PRODUCTOS (LEER TODO) ---
app.get('/api/inventario-general', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos');
        res.json(results);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- AGREGAR PRODUCTO ---
app.post('/api/productos', async (req, res) => {
    const { codigo, nombre, cantidad, id_sucursal, precio } = req.body;
    const sql = `
        INSERT INTO productos (codigo, nombre, precio, cantidad, id_sucursal) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`;
    try {
        await db.query(sql, [codigo, nombre, precio || 0, cantidad, id_sucursal]);
        res.json({ mensaje: "Producto procesado correctamente" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- EDITAR PRODUCTO (RESTAURADO) ---
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;
    const sql = `UPDATE productos SET nombre = ?, precio = ?, cantidad = ? WHERE id_producto = ?`;
    try {
        const [result] = await db.query(sql, [nombre, precio, cantidad, id]);
        if (result.affectedRows > 0) {
            res.json({ mensaje: "Producto actualizado con éxito" });
        } else {
            res.status(404).json({ mensaje: "Producto no encontrado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al editar" });
    }
});

// --- ELIMINAR PRODUCTO (RESTAURADO) ---
app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM productos WHERE id_producto = ?', [id]);
        if (result.affectedRows > 0) {
            res.json({ mensaje: "Producto eliminado correctamente" });
        } else {
            res.status(404).json({ mensaje: "No se encontró el producto para eliminar" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
});

// --- TRANSFERENCIA MASIVA ---
app.post('/api/inventario/transferir-masivo', async (req, res) => {
    const { productos, origen, destino } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        for (const p of productos) {
            await connection.query("UPDATE productos SET cantidad = cantidad - ? WHERE id_producto = ?", [p.cantidadTransferir, p.id_producto]);
            await connection.query(
                `INSERT INTO productos (nombre, codigo, precio, cantidad, id_sucursal) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE cantidad = cantidad + ?`,
                [p.nombre, p.codigo, p.precio || 0, p.cantidadTransferir, destino, p.cantidadTransferir]
            );
            await connection.query(
                `INSERT INTO historial_transferencias (codigo_producto, nombre_producto, cantidad, origen_id, destino_id, fecha, hora) 
                 VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME())`,
                [p.codigo, p.nombre, p.cantidadTransferir, origen, destino]
            );
        }
        await connection.commit();
        res.status(200).json({ mensaje: "Transferencia exitosa" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ? AND password = ?', [usuario, password]);
        if (rows.length > 0) res.json({ user: rows[0] });
        else res.status(401).json({ mensaje: "Credenciales inválidas" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- VENTAS (POS) ---
// --- PROCESAR VENTA (POS) ---
// --- PROCESAR VENTA (COPIAR EN SERVER.JS) ---
app.post('/api/pos/venta', async (req, res) => {
    const { productos, total, id_usuario, id_sucursal } = req.body;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Insertar la venta
        const [resVenta] = await connection.query(
            'INSERT INTO ventas (total, id_usuario, id_sucursal, fecha) VALUES (?, ?, ?, NOW())',
            [total, id_usuario, id_sucursal]
        );
        const idVenta = resVenta.insertId;

        // 2. Insertar detalles y restar stock de la tabla productos
        for (const p of productos) {
            await connection.query(
                'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [idVenta, p.id_producto, p.cantidad, p.precio]
            );

            // IMPORTANTE: Restamos el stock del producto vendido
            await connection.query(
                'UPDATE productos SET cantidad = cantidad - ? WHERE id_producto = ?',
                [p.cantidad, p.id_producto]
            );
        }

        await connection.commit();
        res.json({ exito: true, mensaje: "Venta guardada" });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("ERROR EN SQL:", err); // MIRA ESTO EN TU TERMINAL NEGRA
        res.status(500).json({ error: "Error en base de datos", detalle: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- BUSCADOR POS ---
app.get('/api/pos/buscar', async (req, res) => {
    const term = `%${req.query.q}%`;
    const sucursal = req.query.sucursal;
    try {
        const [results] = await db.query('SELECT * FROM productos WHERE (nombre LIKE ? OR codigo LIKE ?) AND id_sucursal = ?', [term, term, sucursal]);
        res.json(results);
    } catch (err) {
        res.status(500).json(err);
    }
});
// --- RUTA PARA EL REPORTE DIARIO ---
app.get('/api/reporte/rango', async (req, res) => {
    // Tomamos las fechas que vienen de la URL
    const { inicio, fin } = req.query; 

    // Verificamos que sí lleguen las fechas
    if (!inicio || !fin) {
        return res.status(400).json({ error: "Faltan las fechas de inicio o fin" });
    }

    try {
        const query = `
            SELECT 
                p.codigo, 
                p.nombre, 
                SUM(dv.cantidad) as cantidad_vendida, 
                dv.precio_unitario,
                SUM(dv.cantidad * dv.precio_unitario) as total_por_producto
            FROM detalles_venta dv
            JOIN ventas v ON dv.id_venta = v.id_venta
            JOIN productos p ON dv.id_producto = p.id_producto
            WHERE DATE(v.fecha) >= ? AND DATE(v.fecha) <= ?
            GROUP BY p.id_producto, dv.precio_unitario
        `;
        
        const [rows] = await db.query(query, [inicio, fin]);
        res.json(rows);
    } catch (err) {
        console.error("Error en el servidor:", err);
        res.status(500).json({ error: "Error en la base de datos" });
    }
});

// Ruta para obtener los números del Dashboard
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // 1. Ventas de hoy
        const [ventasHoy] = await db.query('SELECT SUM(total) as hoy FROM ventas WHERE DATE(fecha) = CURDATE()');
        
        // 2. Ventas del mes (para ver progreso)
        const [ventasMes] = await db.query('SELECT SUM(total) as mes FROM ventas WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())');
        
        // 3. Stock Total de piezas
        const [stock] = await db.query('SELECT SUM(cantidad) as total FROM productos');
        
        // 4. El producto "Estrella" (el más vendido del mes)
        const [topProducto] = await db.query(`
            SELECT p.nombre, SUM(dv.cantidad) as total 
            FROM detalles_venta dv 
            JOIN productos p ON dv.id_producto = p.id_producto 
            GROUP BY p.id_producto 
            ORDER BY total DESC LIMIT 1
        `);

        // 5. Lista de productos en alerta (máximo 3 para el dashboard)
        const [alertas] = await db.query('SELECT nombre, cantidad FROM productos WHERE cantidad < 5 ORDER BY cantidad ASC LIMIT 3');

        res.json({
            ventasHoy: ventasHoy[0].hoy || 0,
            ventasMes: ventasMes[0].mes || 0,
            stockTotal: stock[0].total || 0,
            productoEstrella: topProducto[0] ? topProducto[0].nombre : "Sin ventas",
            alertas: alertas
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- RUTAS DE AUDITORÍA ---

// 1. Obtener productos por sucursal (LECTURA)
app.get('/api/productos/auditoria/:id_sucursal', async (req, res) => {
    const { id_sucursal } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT id_producto, codigo, nombre, cantidad FROM productos WHERE id_sucursal = ?', 
            [id_sucursal]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// 2. Guardar el resultado final (ESCRITURA)
app.post('/api/auditoria/finalizar', async (req, res) => {
    const { usuario, sucursal, sistema, fisico, diferencia, estado } = req.body;

    try {
        const sql = `
            INSERT INTO historial_auditorias 
            (usuario, sucursal, total_sistema, total_fisico, diferencia, estado)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [usuario, sucursal, sistema, fisico, diferencia, estado]);

        res.json({ ok: true });

    } catch (error) {
        console.error("Error auditoría:", error);
        res.status(500).json({ error: "Error al guardar auditoría" });
    }
});
app.post('/api/auditoria/aplicar', async (req, res) => {
    const { sucursal, productos } = req.body;

    try {

        for (const item of productos) {

            const diferencia = item.fisico - item.sistema;

            // 🔥 ACTUALIZAR INVENTARIO
            await db.query(`
                UPDATE productos 
                SET cantidad = ?
                WHERE id_producto = ? AND id_sucursal = ?
            `, [item.fisico, item.id_producto, sucursal]);

            // 🔥 REGISTRAR MOVIMIENTO (muy importante)
            if (diferencia !== 0) {
                await db.query(`
                    INSERT INTO movimientos 
                    (id_producto, tipo, cantidad, fecha, id_origen, id_destino)
                    VALUES (?, ?, ?, NOW(), NULL, NULL)
                `, [
                    item.id_producto,
                    diferencia > 0 ? 'entrada' : 'salida',
                    Math.abs(diferencia)
                ]);
            }
        }

        res.json({ ok: true });

    } catch (error) {
        console.error("Error al aplicar auditoría:", error);
        res.status(500).json({ error: "Error al actualizar inventario" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor en puerto " + PORT);
});
