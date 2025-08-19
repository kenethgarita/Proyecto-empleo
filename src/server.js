import express from "express"
import path, {dirname} from "path"
import { fileURLToPath } from "url";
import {initDB} from "./db.js"
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/authmiddleware.js";
import { requireRol } from "./middleware/requireRol.js";
import roles from "./routes/RolesRoutes.js";
import usuarios from "./routes/usuariosRoutes.js"
import categorias from "./routes/categoriasRoutes.js"
import oportunidades from "./routes/OportunidadesRoutes.js"
import postulaciones from "./routes/postulacionesRoutes.js"
import experiencias from "./routes/experienciasRoutes.js"
import estadisticas from "./routes/estadisticasRoutes.js"
import cors from "cors"
dotenv.config();

const app = express()
const PORT = process.env.PORT || 5000;


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(express.json())

app.use(express.static(path.join(__dirname, "../public")))

app.use(cors())

app.get("/", (req,res) => {
    res.send("Hola")
})


await initDB();


// Routes
app.use("/roles",authMiddleware,requireRol(10), roles)
app.use("/usuarios", usuarios)
app.use("/categorias", categorias)
app.use("/oportunidades", oportunidades)
app.use("/postulaciones",authMiddleware, postulaciones)
app.use("/experiencias",authMiddleware, experiencias)
app.use("/estadisticas", estadisticas)

app.listen(PORT,() => {
    console.log(`Server has started on port: ${PORT}`)
})