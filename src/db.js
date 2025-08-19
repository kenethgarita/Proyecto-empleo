import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "proyecto-empleo",
  password: "MA2B2F4SN",
  port: 5432,
});

export const initDB = async () => {
  try {
    // Tabla roles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id_rol SERIAL PRIMARY KEY,
        nombre_rol VARCHAR(50)
      );
    `);

    // Tabla usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre VARCHAR(100),
        correo VARCHAR(100) UNIQUE NOT NULL,
        contrasena TEXT NOT NULL,
        tipo_usuario INTEGER REFERENCES roles(id_rol),
        biografia TEXT,
        cv_url TEXT,
        fecha_registro TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla categorías
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre_categoria VARCHAR(50)
      );
    `);

    // Tabla oportunidades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oportunidades (
        id_oportunidad SERIAL PRIMARY KEY,
        titulo VARCHAR(100),
        descripcion TEXT,
        ubicacion VARCHAR(100),
        tipo_categoria INTEGER REFERENCES categorias(id_categoria),
        fecha_inicio DATE,
        fecha_fin DATE,
        publicada_por INTEGER REFERENCES usuarios(id_usuario),
        fecha_publicacion TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla postulaciones
    await pool.query(`
      CREATE TABLE IF NOT EXISTS postulaciones (
        id_postulacion SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuarios(id_usuario),
        id_oportunidad INTEGER REFERENCES oportunidades(id_oportunidad),
        fecha_postulacion TIMESTAMP DEFAULT NOW(),
        estado VARCHAR(20) DEFAULT 'pendiente',
        mensaje TEXT
      );
    `);

    // Tabla experiencias
    await pool.query(`
      CREATE TABLE IF NOT EXISTS experiencias (
        id_experiencia SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuarios(id_usuario),
        id_oportunidad INTEGER REFERENCES oportunidades(id_oportunidad),
        descripcion TEXT,
        fecha_inicio DATE,
        fecha_fin DATE,
        comentario_final TEXT
      );
    `);

    console.log("✅ Todas las tablas fueron creadas o ya existían.");
  } catch (err) {
    console.log("error creando las tablas", err);
  }
};

export default pool;
