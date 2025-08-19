// routes/estadisticasRoutes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/resumen", async (req, res) => {
  try {
    const totalUsuarios = await pool.query(`SELECT COUNT(*) FROM usuarios`);
    const totalJovenes = await pool.query(`SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 1`);
    const totalEmpresas = await pool.query(`SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 2`);
    const totalOportunidades = await pool.query(`SELECT COUNT(*) FROM oportunidades`);
    const totalExperiencias = await pool.query(`SELECT COUNT(*) FROM experiencias`);

    res.json({
      totalUsuarios: parseInt(totalUsuarios.rows[0].count),
      totalJovenes: parseInt(totalJovenes.rows[0].count),
      totalEmpresas: parseInt(totalEmpresas.rows[0].count),
      totalOportunidades: parseInt(totalOportunidades.rows[0].count),
      totalExperiencias: parseInt(totalExperiencias.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener estadísticas");
  }
});

export default router;
