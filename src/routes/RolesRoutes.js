import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authmiddleware.js";
import { requireRol } from "../middleware/requireRol.js";

const router = express.Router();

// Crear roles
router.post("/", authMiddleware, requireRol(10), async (req, res) => {
  const { nombre_rol } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO roles (nombre_rol) VALUES($1) RETURNING *`,
      [nombre_rol]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error creando el rol" });
  }
});

// Obtener todos los roles
router.get("/", authMiddleware, requireRol(10), async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM roles`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error obteniendo los roles" });
  }
});

// Actualizar rol
router.put("/:id_rol", authMiddleware, requireRol(10), async (req, res) => {
  const { nombre_rol } = req.body;
  const { id_rol } = req.params;

  try {
    const result = await pool.query(
      `UPDATE roles SET nombre_rol = $1 WHERE id_rol = $2 RETURNING *`,
      [nombre_rol, id_rol]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({ message: "Rol actualizado", rol: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando el rol" });
  }
});

// Eliminar rol
router.delete("/:id_rol", authMiddleware, requireRol(10), async (req, res) => {
  const { id_rol } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM roles WHERE id_rol = $1 RETURNING *`,
      [id_rol]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({ message: "Rol eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando el rol" });
  }
});

export default router;
