import express from "express";
import pool from "../db.js";
import { requireRol } from "../middleware/requireRol.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const router = express.Router();

// Obtener todas las categorías (público)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM categorias`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error obteniendo las categorías" });
  }
});

// Crear categoría (solo admin)
router.post("/", authMiddleware, requireRol(10), async (req, res) => {
  const { nombre_categoria } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO categorias (nombre_categoria) VALUES($1) RETURNING *`,
      [nombre_categoria]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error creando la categoría" });
  }
});

// Actualizar categoría (solo admin)
router.put("/:id_categoria", authMiddleware, requireRol(10), async (req, res) => {
  const { nombre_categoria } = req.body;
  const { id_categoria } = req.params;

  try {
    const result = await pool.query(
      `UPDATE categorias SET nombre_categoria = $1 WHERE id_categoria = $2 RETURNING *`,
      [nombre_categoria, id_categoria]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría actualizada", categoria: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la categoría" });
  }
});

// Eliminar categoría (solo admin)
router.delete("/:id_categoria", authMiddleware, requireRol(10), async (req, res) => {
  const { id_categoria } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM categorias WHERE id_categoria = $1 RETURNING *`,
      [id_categoria]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando la categoría" });
  }
});

export default router;
