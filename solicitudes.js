const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const DB_FILE = path.join(__dirname, 'data.json');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/api/solicitudes', async (req, res) => {
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const solicitudes = JSON.parse(data);
      res.json(solicitudes);
    } catch (err) {
      res.json([]);
    }
});

router.post('/solicitud', upload.single('foto_animal'), async (req, res) => {
  try {
    const body = req.body;
    
    const nuevaSolicitud = {
        id: Date.now(),
        nombre: body.nombre,
        edad: body.edad,
        direccion: body.direccion,
        telefono: body.telefono,
        email: body.email,
        vivienda: body.vivienda,
        experiencia: body.experiencia,
        especie: body.especie,
        latitud: parseFloat(body.latitud), 
        longitud: parseFloat(body.longitud),
        ubicacion_ref: body.ubicacion_encontrado,
        motivo: body.motivo,
        situacion: body.situacion,
        tiempo_calle: body.tiempo_calle,
        apoyo: body.apoyo,
        otros_apoyos: body.otros_apoyos,
        edad_animal: body.edad_animal,
        sexo: body.sexo,
        raza: body.raza,
        condicion: body.condicion,
        comportamiento: body.comportamiento,
        foto_animal: req.file ? req.file.filename : null,
        fecha: new Date().toISOString()
    };

    let solicitudes = [];
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        solicitudes = JSON.parse(data);
    } catch (error) {
        solicitudes = [];
    }

    solicitudes.push(nuevaSolicitud);
    await fs.writeFile(DB_FILE, JSON.stringify(solicitudes, null, 2), 'utf-8');

    console.log('✅ Solicitud guardada');
    res.send(`
        <script>
            alert("✅ Solicitud registrada correctamente.");
            window.location.href = "/registrosoli.html";
        </script>
    `);

  } catch (err) {
    console.error('❌ Error al registrar solicitud:', err);
    res.status(500).send('❌ Error: ' + err.message);
  }
});

module.exports = router;