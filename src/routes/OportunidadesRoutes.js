import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authmiddleware.js";
import { requireRol } from "../middleware/requireRol.js";

const router = express.Router();

// 📌 RUTA PÚBLICA: Obtener todas las oportunidades
router.get("/", async (req, res) => {
  const { categoria } = req.query; // ahora se espera el id_categoria

  try {
    let result;
    console.log("Filtro de categoría recibido:", categoria);
    if (categoria) {
  result = await pool.query(
    `SELECT o.*, c.nombre_categoria
     FROM oportunidades o
     JOIN categorias c ON o.tipo_categoria = c.id_categoria
     WHERE c.id_categoria = $1
     ORDER BY o.fecha_publicacion DESC`,
    [categoria.trim()]
  );
} else {
  result = await pool.query(
    `SELECT o.*, c.nombre_categoria
     FROM oportunidades o
     JOIN categorias c ON o.tipo_categoria = c.id_categoria
     ORDER BY o.fecha_publicacion DESC`
  );
}


    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener oportunidades:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ✅ RUTA PROTEGIDA: Crear oportunidad
router.post("/", authMiddleware, requireRol(10, 2), async (req, res) => {
  const {
    titulo,
    descripcion,
    ubicacion,
    tipo_categoria,
    fecha_inicio,
    fecha_fin,
  } = req.body;
  const publicada_por = req.user.id_usuario;

  try {
    const result = await pool.query(
      `INSERT INTO oportunidades (titulo, descripcion, ubicacion, tipo_categoria, fecha_inicio, fecha_fin, publicada_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        titulo,
        descripcion,
        ubicacion,
        tipo_categoria,
        fecha_inicio,
        fecha_fin,
        publicada_por,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear oportunidad", err);
    res.status(500).json({ error: "Error al crear oportunidad" });
  }
});

// ✅ Obtener oportunidades publicadas por el usuario logueado (empresa o admin)
router.get("/mias", authMiddleware, requireRol(2, 10), async (req, res) => {
  const id_usuario = req.user.id_usuario;

  try {
    const result = await pool.query(
      `SELECT o.*, c.nombre_categoria
      FROM oportunidades o
      JOIN categorias c ON o.tipo_categoria = c.id_categoria
      WHERE o.publicada_por = $1
      ORDER BY o.fecha_publicacion DESC`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener oportunidades propias:", err);
    res.status(500).json({ error: "Error al obtener oportunidades propias" });
  }
});

// Actualizar oportunidad
router.put(
  "/:id_oportunidad",
  authMiddleware,
  requireRol(2, 10),
  async (req, res) => {
    const { id_oportunidad } = req.params;
    const {
      titulo,
      descripcion,
      ubicacion,
      tipo_categoria,
      fecha_inicio,
      fecha_fin,
    } = req.body;
    const usuario = req.user;

    try {
      const { rows } = await pool.query(
        `SELECT * FROM oportunidades WHERE id_oportunidad = $1`,
        [id_oportunidad]
      );

      const oportunidad = rows[0];
      if (!oportunidad) {
        return res.status(404).json({ error: "Oportunidad no encontrada" });
      }

      if (
        usuario.rol_usuario !== 10 &&
        oportunidad.publicada_por !== usuario.id_usuario
      ) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para editar esta oportunidad" });
      }

      const result = await pool.query(
        `UPDATE oportunidades
       SET titulo=$1, descripcion=$2, ubicacion=$3, tipo_categoria=$4, fecha_inicio=$5, fecha_fin=$6
       WHERE id_oportunidad=$7
       RETURNING *`,
        [
          titulo,
          descripcion,
          ubicacion,
          tipo_categoria,
          fecha_inicio,
          fecha_fin,
          id_oportunidad,
        ]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error al actualizar oportunidad:", err);
      res.status(500).json({ error: "Error al actualizar oportunidad" });
    }
  }
);

// Eliminar oportunidad
router.delete(
  "/:id_oportunidad",
  authMiddleware,
  requireRol(2, 10),
  async (req, res) => {
    const { id_oportunidad } = req.params;
    const usuario = req.user;

    try {
      const { rows } = await pool.query(
        `SELECT * FROM oportunidades WHERE id_oportunidad = $1`,
        [id_oportunidad]
      );

      const oportunidad = rows[0];
      if (!oportunidad) {
        return res.status(404).json({ error: "Oportunidad no encontrada" });
      }

      if (
        usuario.rol_usuario !== 10 &&
        oportunidad.publicada_por !== usuario.id_usuario
      ) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para eliminar esta oportunidad" });
      }

      await pool.query(`DELETE FROM oportunidades WHERE id_oportunidad = $1`, [
        id_oportunidad,
      ]);

      res.json({ message: "Oportunidad eliminada correctamente" });
    } catch (err) {
      console.error("Error al eliminar oportunidad:", err);
      res.status(500).json({ error: "Error al eliminar oportunidad" });
    }
  }
);

// 📌 RUTA PÚBLICA: Obtener una sola oportunidad
router.get("/:id_oportunidad", async (req, res) => {
  const { id_oportunidad } = req.params;

  try {
    const result = await pool.query(
      `SELECT o.*, c.nombre_categoria
       FROM oportunidades o
       JOIN categorias c ON o.tipo_categoria = c.id_categoria
       WHERE id_oportunidad = $1`,
      [id_oportunidad]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener oportunidad" });
  }
});

export default router;
