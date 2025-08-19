export const requireRol = (...allowedRoles) => {
    return (req,res,next) => {
        if (!req.user || !allowedRoles.includes(req.user.rol_usuario))
            {
                return res.status(403).json({error: "No tienes permisos para esta acción"})
    }
    next()
}
}