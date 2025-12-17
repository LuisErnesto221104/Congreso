const express = require('express');
const router = express.Router(); 
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'emmanuel04',
  database: 'patas_conectatech',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function guardarCasosAnimales(formData) {
  const fakeQuery = `
    INSERT INTO casos (
      nombre_completo, edad, direccion, telefono, email,
      tipo_vivienda, experiencia_animales, especie,
      edad_animal, sexo, raza, condicion_fisica, comportamiento,
      latitud, longitud, ubicacion_ref,
      motivo, situacion, tiempo_calle,
      apoyo, otros_apoyos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const fakeValues = [
    formData.nombre,
    formData.edad,
    formData.direccion,
    formData.telefono,
    formData.email,
    formData.vivienda,
    formData.experiencia,
    formData.especie,
    formData.edad_animal,
    formData.sexo,
    formData.raza,
    formData.condicion,
    formData.comportamiento,
    formData.latitud,
    formData.longitud,
    formData.ubicacion_encontrado,
    formData.motivo,
    formData.situacion,
    formData.tiempo_calle,
    Array.isArray(formData.apoyo) ? formData.apoyo.join(', ') : formData.apoyo,
    formData.otros_apoyos
  ];


  return { ok: true };
}

async function guardarDatosVoluntariosActivos(formData) {
  const fakeQuery = `
    INSERT INTO voluntarios_activos (
      nombre_completo, fecha_nacimiento, email, telefono, direccion,
      tipo_voluntario, universidad, semestre,
      cedula, especialidad, anos_experiencia,
      profesion, habilidades,
      disponibilidad, horas_mes, actividades,
      experiencia_animales, motivacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const fakeValues = [
    formData.nombre_completo,
    formData.fecha_nacimiento,
    formData.email,
    formData.telefono,
    formData.direccion,
    formData.tipo_voluntario,
    formData.universidad || null,
    formData.semestre || null,
    formData.cedula || null,
    formData.especialidad || null,
    formData.anos_experiencia || null,
    formData.profesion || null,
    formData.habilidades || null,
    Array.isArray(formData.disponibilidad)
      ? formData.disponibilidad.join(', ')
      : formData.disponibilidad,
    formData.horas_mes,
    Array.isArray(formData.actividades)
      ? formData.actividades.join(', ')
      : formData.actividades,
    formData.experiencia_animales,
    formData.motivacion
  ];


  return { ok: true };
}

router.post('/registro-solicitante', async (req, res) => {
  const { usuario, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO solicitantes (usuario, password_hash) VALUES (?, ?)',
      [usuario, password_hash]
    );
    res.send('<script>alert("✅ Registro exitoso"); window.location.href="/";</script>');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      res.send('⚠ El usuario ya existe');
    else
      res.send('❌ Error: ' + err.message);
  }
});

router.post('/registro-voluntario', async (req, res) => {
  const { usuario, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO voluntarios (usuario, password_hash) VALUES (?, ?)',
      [usuario, password_hash]
    );
    res.send('<script>alert("✅ Registro exitoso"); window.location.href="/";</script>');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      res.send('⚠ El usuario ya existe');
    else
      res.send('❌ Error: ' + err.message);
  }
});

router.post('/login-solicitante', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM solicitantes WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0)
      return res.send('<script>alert("⚠ Usuario no encontrado"); window.history.back();</script>');

    const match = await bcrypt.compare(password, rows[0].password_hash);

    if (match) {
      console.log('🔐 Login exitoso como solicitante');
      res.redirect('/registrosoli.html');
    } else {
      res.send('<script>alert("❌ Contraseña incorrecta"); window.history.back();</script>');
    }
  } catch (err) {
    res.send(err.message);
  }
});

router.post('/login-voluntario', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM voluntarios WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0)
      return res.send('<script>alert("⚠ Usuario no encontrado"); window.history.back();</script>');

    const match = await bcrypt.compare(password, rows[0].password_hash);

    if (match) {
      console.log('🔐 Login exitoso como voluntario');
      res.redirect('/voluntarios.html');
    } else {
      res.send('<script>alert("❌ Contraseña incorrecta"); window.history.back();</script>');
    }
  } catch (err) {
    res.send(err.message);
  }
});

module.exports = router;
