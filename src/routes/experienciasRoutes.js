import { Router } from "express";
import pool from "../db.js";
import { requireRol } from "../middleware/requireRol.js";

const router = Router();

// Ver experiencias (joven, empresa, admin)
router.get("/", requireRol(1, 2, 10), async (req, res) => {
  const { id_usuario, rol_usuario } = req.user;

  try {
    let result;

    if (rol_usuario === 10) {
      // Admin: devuelve todas las experiencias con datos de joven y oportunidad
      result = await pool.query(`
        SELECT e.*, u.nombre AS nombre_joven, o.titulo AS titulo_oportunidad
        FROM experiencias e
        JOIN usuarios u ON e.id_usuario = u.id_usuario
        JOIN oportunidades o ON e.id_oportunidad = o.id_oportunidad
      `);
    } else if (rol_usuario === 2) {
      // Empresa: experiencias registradas para oportunidades que creó esta empresa
      result = await pool.query(
        `SELECT e.*, u.nombre AS nombre_joven, o.titulo AS titulo_oportunidad
         FROM experiencias e
         JOIN usuarios u ON e.id_usuario = u.id_usuario
         JOIN oportunidades o ON e.id_oportunidad = o.id_oportunidad
         WHERE o.publicada_por = $1`,
        [id_usuario]
      );
    } else {
      // Joven: solo sus experiencias
      result = await pool.query(
        `SELECT e.*, o.titulo AS titulo_oportunidad
         FROM experiencias e
         JOIN oportunidades o ON e.id_oportunidad = o.id_oportunidad
         WHERE e.id_usuario = $1`,
        [id_usuario]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener experiencias:", err);
    res.status(500).json({ error: "Error al obtener experiencias" });
  }
});

// Crear experiencia
router.post("/", requireRol(2, 10), async (req, res) => {
  const {
    id_usuario,
    id_oportunidad,
    descripcion,
    fecha_inicio,
    fecha_fin,
    comentario_final,
  } = req.body;

  try {
    const validacion = await pool.query(
      `SELECT * FROM postulaciones 
       WHERE id_usuario = $1 AND id_oportunidad = $2 AND LOWER(estado) LIKE 'acept%'`,
      [id_usuario, id_oportunidad]
    );

    if (validacion.rows.length === 0) {
      return res.status(400).json({
        error: "El joven no tiene una postulación aceptada para esta oportunidad.",
      });
    }

    const result = await pool.query(
      `INSERT INTO experiencias 
       (id_usuario, id_oportunidad, descripcion, fecha_inicio, fecha_fin, comentario_final)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id_usuario,
        id_oportunidad,
        descripcion,
        fecha_inicio,
        fecha_fin,
        comentario_final,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al registrar experiencia:", err);
    res.status(500).json({ error: "Error al registrar experiencia" });
  }
});

// Eliminar experiencia
router.delete("/:id_experiencia", requireRol(10), async (req, res) => {
  const { id_experiencia } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM experiencias WHERE id_experiencia = $1 RETURNING *`,
      [id_experiencia]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Experiencia no encontrada" });
    }

    res.json({ message: "Experiencia eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar experiencia" });
  }
});

// Obtener jóvenes aceptados para una oportunidad específica
router.get(
  "/candidatos/:id_oportunidad",
  requireRol(2, 10),
  async (req, res) => {
    const { id_oportunidad } = req.params;
    const id_empresa = req.user.id_usuario;

    try {
      const oportunidad = await pool.query(
        `SELECT * FROM oportunidades WHERE id_oportunidad = $1`,
        [id_oportunidad]
      );

      if (oportunidad.rows.length === 0) {
        return res.status(404).json({ error: "Oportunidad no encontrada" });
      }

      const publicada_por = oportunidad.rows[0].publicada_por;

      if (publicada_por !== id_empresa) {
        return res
          .status(403)
          .json({ error: "No tienes acceso a esta oportunidad" });
      }

      const result = await pool.query(
        `SELECT u.id_usuario, u.nombre
         FROM postulaciones p
         JOIN usuarios u ON p.id_usuario = u.id_usuario
         WHERE p.id_oportunidad = $1 AND LOWER(p.estado) LIKE 'acept%'`,
        [id_oportunidad]
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error al obtener candidatos:", err);
      res.status(500).json({ error: "Error al obtener candidatos" });
    }
  }
);

export default router;
