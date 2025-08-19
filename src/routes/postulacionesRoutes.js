import { Router } from "express";
import pool from "../db.js";
import { requireRol } from "../middleware/requireRol.js";

const router = Router();

// Ver postulaciones
// Ver postulaciones
router.get("/", async (req, res) => {
  const userId = req.user.id_usuario;
  const rol = req.user.rol_usuario;

  try {
    let result;

    if (rol === 1) { // joven
  result = await pool.query(
    `SELECT p.*, o.titulo AS titulo
     FROM postulaciones p
     JOIN oportunidades o ON p.id_oportunidad = o.id_oportunidad
     WHERE p.id_usuario = $1`,
    [userId]
  );
      }else if (rol === 2 || rol === 10) { // entidad o admin
      result = await pool.query(
        `SELECT p.*, o.titulo AS titulo_oportunidad, u.nombre AS nombre_usuario
         FROM postulaciones p
         JOIN oportunidades o ON p.id_oportunidad = o.id_oportunidad
         JOIN usuarios u ON p.id_usuario = u.id_usuario
         WHERE o.publicada_por = $1`,
        [userId]
      );
    } else {
      return res.status(403).json({ error: "No tienes permisos" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener postulaciones" });
  }
});


// Crear postulación
// Crear postulación
router.post("/", requireRol(1), async (req, res) => {
  const { id_oportunidad, mensaje } = req.body;
  const id_usuario = req.user.id_usuario;

  try {
    // Verificar si ya existe una postulación para esta oportunidad
    const existe = await pool.query(
      `SELECT 1 FROM postulaciones WHERE id_usuario = $1 AND id_oportunidad = $2`,
      [id_usuario, id_oportunidad]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ya te has postulado a esta oportunidad" });
    }

    // Crear postulación si no existe
    const result = await pool.query(
      `INSERT INTO postulaciones (id_usuario, id_oportunidad, mensaje)
       VALUES ($1, $2, $3) RETURNING *`,
      [id_usuario, id_oportunidad, mensaje]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear postulación" });
  }
});

// Cambiar estado (aceptar/rechazar)
router.patch("/:id_postulacion", requireRol(2, 10), async (req, res) => {
  const { id_postulacion } = req.params;
  const { estado } = req.body;

  try {
    const result = await pool.query(
      `UPDATE postulaciones
       SET estado = $1
       WHERE id_postulacion = $2
       RETURNING *`,
      [estado, id_postulacion]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar postulación" });
  }
});

// Eliminar postulación
router.delete("/:id_postulacion", requireRol(1,10), async (req, res) => {
  const { id_postulacion } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM postulaciones WHERE id_postulacion = $1 RETURNING *`,
      [id_postulacion]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    res.json({ message: "Postulación eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar postulación" });
  }
});

// Obtener postulaciones para una oportunidad publicada por esta entidad
router.get("/por-oportunidad/:id_oportunidad", requireRol(2, 10), async (req, res) => {
  const { id_oportunidad } = req.params;
  const id_usuario = req.user.id_usuario;
  const rol = req.user.rol_usuario;

  try {
    // Verifica que la oportunidad haya sido publicada por el usuario (si no es admin)
    const verificacion = await pool.query(
      `SELECT * FROM oportunidades WHERE id_oportunidad = $1`,
      [id_oportunidad]
    );

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    if (rol === 2 && verificacion.rows[0].publicada_por !== id_usuario) {
      return res.status(403).json({ error: "No tienes permiso para ver estas postulaciones" });
    }

    const postulaciones = await pool.query(
      `SELECT p.*, u.nombre, u.correo
       FROM postulaciones p
       JOIN usuarios u ON p.id_usuario = u.id_usuario
       WHERE p.id_oportunidad = $1`,
      [id_oportunidad]
    );

    res.json(postulaciones.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener postulaciones para la oportunidad" });
  }
});

export default router;
