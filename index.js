const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexión a MySQL
const db = mysql.createConnection({
    host: 'bd-eventos-qr-castilladavid202-a604.j.aivencloud.com', // TU HOST DE AIVEN
    port: 23896,           // TU PUERTO
    user: 'avnadmin',      // TU USUARIO
    password: process.env.DB_PASSWORD, // <--- IMPORTANTE: Pon la contraseña real aquí
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});
// 1. Crear Asistente y Generar Datos para QR
app.post('/crear_asistente', (req, res) => {
    const { nombre, apellido, evento } = req.body;
    // Creamos un string único con los datos
    const qrData = JSON.stringify({ nombre, apellido, evento, timestamp: Date.now() });
    
    const sql = 'INSERT INTO asistentes (nombre, apellido, evento, qr_data) VALUES (?, ?, ?, ?)';
    db.query(sql, [nombre, apellido, evento, qrData], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Asistente creado', qr_data: qrData });
    });
});

// 2. Verificar QR y Registrar Entrada
app.post('/verificar_qr', (req, res) => {
    const { qr_data } = req.body;

    // Buscamos si ese código QR existe en la base de datos
    const sqlSearch = 'SELECT * FROM asistentes WHERE qr_data = ?';
    db.query(sqlSearch, [qr_data], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ valid: false, message: 'QR No válido o no encontrado' });

        const asistente = results[0];

        // Si existe, registramos la entrada
        const sqlInsert = 'INSERT INTO registros_entrada (asistente_id) VALUES (?)';
        db.query(sqlInsert, [asistente.id], (err2) => {
            if (err2) return res.status(500).send(err2);
            res.json({ 
                valid: true, 
                message: `Bienvenido ${asistente.nombre} ${asistente.apellido}`,
                evento: asistente.evento 
            });
        });
    });
});

// IMPORTANTE: Usa tu IP local (ipconfig en Windows) en lugar de localhost si pruebas desde celular real
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});