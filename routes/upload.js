var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs');

var app = express();

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

app.use(fileUpload());

// Rutas
app.put('/:tipo/:id', (req, res, next) => {

    var tipo = req.params.tipo;
    var id = req.params.id

    // Tipos de coleccion
    var tiposValidos = ['hospitales', 'medicos', 'usuarios'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Coleccion no valida',
            errors: {
                message: 'Coleccion no valida'
            }
        });
    }

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se selecciono un archivo',
            errors: {
                message: 'Se debe seleccionar una imagen'
            }
        });
    }

    // Obtener nombre del archivo
    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    // Solo estas extensiones son validas
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];
    if (extensionesValidas.indexOf(extensionArchivo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extension no valida',
            errors: {
                message: 'Las extensiones validas son ' + extensionesValidas.join(', ')
            }
        });
    }

    // Nombre de archivo personalizado
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // Mover archivo
    var path = `./uploads/${ tipo }/${ nombreArchivo }`;
    archivo.mv(path, err => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        subirPorTipo(tipo, id, nombreArchivo, res);
    });
});

function subirPorTipo(tipo, id, nombreArchivo, res) {
    if (tipo === 'usuarios') {
        Usuario.findById(id, (err, usuario) => {

            if(!usuario) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'El usuario no existe',
                    errors: {message: 'Usuario no existe'}
                });
            }

            var pathViejo = './uploads/usuarios/' + usuario.img;
            if (fs.existsSync(pathViejo)) {
                fs.unlink(pathViejo)
            }
            usuario.img = nombreArchivo;
            usuario.save((err, usuarioActualizado) => {
                usuarioActualizado.password = ':)';
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada',
                    usuario: usuarioActualizado
                });
            });
        });
    }
    if (tipo === 'hospitales') {
        Hospital.findById(id, (err, hospital) => {

            if(!hospital) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'El hospital no existe',
                    errors: {message: 'Hospital no existe'}
                });
            }

            var pathViejo = './uploads/hospitales/' + hospital.img;
            if (fs.existsSync(pathViejo)) {
                fs.unlink(pathViejo)
            }
            hospital.img = nombreArchivo;
            hospital.save((err, hospitalActualizado) => {
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada',
                    hospital: hospitalActualizado
                });
            });
        });
    }
    if (tipo === 'medicos') {
        Medico.findById(id, (err, medico) => {

            if(!medico) {
                return res.status(400).json({
                    ok: true,
                    mensaje: 'El medico no existe',
                    errors: {message: 'Medico no existe'}
                });
            }

            var pathViejo = './uploads/medicos/' + medico.img;
            if (fs.existsSync(pathViejo)) {
                fs.unlink(pathViejo)
            }
            medico.img = nombreArchivo;
            usuario.save((err, medicoActualizado) => {
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada',
                    medico: medicoActualizado
                });
            });
        });
    }
}

module.exports = app;