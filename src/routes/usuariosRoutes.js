import express from "express"
import pool from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { authMiddleware } from "../middleware/authmiddleware.js"
import { requireRol } from "../middleware/requireRol.js"

const router = express.Router()

// Crear usuarios
router.post("/registro", async (req,res) => {
    const {nombre,correo,contrasena,tipo_usuario,biografia,cv_url} = req.body

    if (!nombre || !correo || !contrasena || !tipo_usuario) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        const hashedPassword = await bcrypt.hash(contrasena, 8);

        const result = await pool.query(
            `INSERT INTO usuarios (nombre,correo,contrasena,tipo_usuario,biografia,cv_url) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
            [nombre,correo,hashedPassword,tipo_usuario,biografia,cv_url]
        )
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err)
        res.status(500).json({error: "error creando el usuario"})
    }
})

// Login
router.post("/login", async (req,res) => {
    const { correo, contrasena } = req.body;

    try{
         const result = await pool.query(`SELECT * FROM usuarios WHERE correo = $1`, [correo]);
  const user = result.rows[0];

  if (!user) return res.status(404).send({ message: "Usuario no encontrado" });

  const passwordIsValid = bcrypt.compareSync(contrasena, user.contrasena);
  if (!passwordIsValid) return res.status(401).send({ message: "Contraseña no válida" });
        console.log(user)

        const payload = {
            id_usuario: user.id_usuario,
            rol_usuario: user.tipo_usuario
        }
        const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"24h"})
        res.json({token})
    }catch(err){
        console.log(err)
        res.sendStatus(503)
    }
})


// Ver mi perfil
router.get("/me", authMiddleware, async (req, res) => {
  const id_usuario = req.user.id_usuario;

  try {
    // Puedes hacer un JOIN para obtener el nombre del rol
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.tipo_usuario, r.nombre_rol as rol, u.biografia, u.cv_url, u.fecha_registro
       FROM usuarios u
       LEFT JOIN roles r ON u.tipo_usuario = r.id_rol
       WHERE u.id_usuario = $1`,
      [id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});


// Editar mi perfil
router.put("/me", authMiddleware, async (req, res) => {
  const id_usuario = req.user.id_usuario; // usuario autenticado
  const { nombre, correo, biografia, cv_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre=$1, correo=$2, biografia=$3, cv_url=$4
       WHERE id_usuario=$5
       RETURNING id_usuario, nombre, correo, tipo_usuario, biografia, cv_url, fecha_registro`,
      [nombre, correo, biografia, cv_url, id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

// Listar todos los usuarios
router.get("/", authMiddleware, requireRol(10), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_usuario, nombre, correo, tipo_usuario, biografia, cv_url, fecha_registro
       FROM usuarios`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar usuarios" });
  }
});


// Editar usuario
router.put("/:id_usuario", authMiddleware, async (req, res) => {
  const { id_usuario } = req.params;
  const { nombre, correo, biografia, cv_url } = req.body;

  const usuarioLogueado = req.user;

  // Si no es admin, solo puede editar su propio perfil
  if (usuarioLogueado.rol_usuario !== 10 && usuarioLogueado.id_usuario != id_usuario) {
    return res.status(403).json({ error: "No tienes permisos para editar este usuario" });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre=$1, correo=$2, biografia=$3, cv_url=$4
       WHERE id_usuario=$5
       RETURNING *`,
      [nombre, correo, biografia, cv_url, id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});


//Eliminar usuario
router.delete("/:id_usuario", authMiddleware, requireRol(10), async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM usuarios WHERE id_usuario=$1 RETURNING *`,
      [id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// Middleware para verificar múltiples roles
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Token requerido" });
    }
    
    const userRole = req.user.rol_usuario;
    console.log("🔍 Verificando roles:", { userRole, allowedRoles: roles });
    
    if (roles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({ 
        error: "No tienes permisos para acceder a este recurso",
        userRole: userRole,
        requiredRoles: roles
      });
    }
  };
};

// RUTAS DE DASHBOARD CORREGIDAS
router.get("/dashboard/joven/:id", authMiddleware, requireRoles(1, 10), async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);
  
  // Verificar que el joven solo pueda ver sus propios datos (a menos que sea admin)
  if (req.user.rol_usuario === 1 && req.user.id_usuario !== userId) {
    return res.status(403).json({ error: "Solo puedes ver tus propias estadísticas" });
  }
  
  try {
    console.log("📊 Obteniendo stats para joven ID:", userId);
    
    const [postulaciones, experiencias] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM postulaciones WHERE id_usuario = $1", [userId]),
      pool.query("SELECT COUNT(*) as count FROM experiencias WHERE id_usuario = $1", [userId]),
    ]);

    const stats = {
      postulaciones: parseInt(postulaciones.rows[0].count),
      experiencias: parseInt(experiencias.rows[0].count),
    };
    
    console.log("✅ Stats joven:", stats);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error obteniendo stats joven:", err);
    res.status(500).json({ error: "Error al obtener estadísticas del joven" });
  }
});

router.get("/dashboard/empresa/:id", authMiddleware, requireRoles(2, 10), async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);
  
  // Verificar que la empresa solo pueda ver sus propios datos (a menos que sea admin)
  if (req.user.rol_usuario === 2 && req.user.id_usuario !== userId) {
    return res.status(403).json({ error: "Solo puedes ver tus propias estadísticas" });
  }
  
  try {
    console.log("📊 Obteniendo stats para empresa ID:", userId);
    
    const [oportunidades, postulaciones, contratados] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM oportunidades WHERE publicada_por = $1", [userId]),
      pool.query(`
        SELECT COUNT(*) as count FROM postulaciones p 
        JOIN oportunidades o ON o.id_oportunidad = p.id_oportunidad 
        WHERE o.publicada_por = $1
      `, [userId]),
      pool.query(`
        SELECT COUNT(*) as count FROM experiencias e 
        JOIN oportunidades o ON o.id_oportunidad = e.id_oportunidad 
        WHERE o.publicada_por = $1
      `, [userId]),
    ]);

    const stats = {
      oportunidades: parseInt(oportunidades.rows[0].count),
      postulaciones: parseInt(postulaciones.rows[0].count),
      contratados: parseInt(contratados.rows[0].count),
    };
    
    console.log("✅ Stats empresa:", stats);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error obteniendo stats empresa:", err);
    res.status(500).json({ error: "Error al obtener estadísticas de la empresa" });
  }
});

router.get("/dashboard/admin", authMiddleware, requireRoles(10), async (req, res) => {
  try {
    console.log("📊 Obteniendo stats para admin");
    
    const [usuarios, oportunidades, conexiones] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM usuarios"),
      pool.query("SELECT COUNT(*) as count FROM oportunidades"),
      pool.query("SELECT COUNT(*) as count FROM experiencias"),
    ]);

    const stats = {
      usuarios: parseInt(usuarios.rows[0].count),
      oportunidades: parseInt(oportunidades.rows[0].count),
      conexiones: parseInt(conexiones.rows[0].count),
    };
    
    console.log("✅ Stats admin:", stats);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error obteniendo stats admin:", err);
    res.status(500).json({ error: "Error al obtener estadísticas de administrador" });
  }
});

export default router