import jwt from "jsonwebtoken"

export const authMiddleware = (req,res,next) => {
    console.log("Authorization Header:", req.headers.authorization);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({error: "Token no proporcionado"})
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()
    } catch (err) {
        console.error("Erro verificando token:",err)
        return res.status(401).json({eror: "Token inválido o expirado"})
    }
}