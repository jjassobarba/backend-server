var jwt = require('jsonwebtoken');

var SEED =require('../config/config').SEED;

// Verificar token
exports.verificaToken = function(req, res, next){
    var token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token invalido',
                errors: err
            });
        }

        req.usuario = decoded.usuario;

        next();
    })
}

// Verificar admin
exports.verificaADMIN_ROLE = function(req, res, next){
    
    var usuario = req.usuario;

    if (usuario.role === 'ADMIN_ROLE') {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'No se cuenta con permisos',
            errors: { message: 'No cuenta con los permisos suficientes'}
        });
    }
    
}

// Verificar admin o mismo usuario
exports.verificaADMIN_ROLE_o_MismoUsuario = function(req, res, next){
    
    var usuario = req.usuario;
    var id = req.params.id;

    if (usuario.role === 'ADMIN_ROLE' || usuario._id === id) {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'No se cuenta con permisos',
            errors: { message: 'No cuenta con los permisos suficientes'}
        });
    }
    
}

    
