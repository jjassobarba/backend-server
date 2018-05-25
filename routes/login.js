var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const {
    OAuth2Client
} = require('google-auth-library');

var SEED = require('../config/config').SEED;

var app = express();

var Usuario = require('../models/usuario');

// Google
const CLIENT_ID = require('../config/config').CLIENT_ID;
const GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;
const client = new OAuth2Client(CLIENT_ID);

// Autenticacion google

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
}

app.post('/google', async(req, res) => {
    var token = req.body.token;

    var googleUser = await verify(token)
        .catch(e => {
            return res.status(403).json({
                ok: false,
                mensaje: 'Token invalido'
            });
        });

    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuarios',
                errors: err
            });
        }

        if (usuarioDB) {
            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe usar autenticacion con la que se registró',
                });
            } else {
                var token = jwt.sign({
                    usuario: usuarioDB
                }, SEED, {
                    expiresIn: 14400
                });

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            }
        } else {
            var usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true,
                usuario.password = ':)';

            usuario.save((err, usuarioDB) => {
                var token = jwt.sign({
                    usuario: usuarioDB
                }, SEED, {
                    expiresIn: 14400
                });

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            });
        }
    });
});

// Autenticacion normal
app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({
        email: body.email
    }, (err, usuarioBD) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuarios',
                errors: err
            });
        }

        if (!usuarioBD) {
            return res.status(400).json({
                ok: false,
                mensaje: "Credenciales incorrectas - email",
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioBD.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Credenciales incorrectas - password",
                errors: err
            });
        }

        // Crear token
        usuarioBD.password = ':)';
        var token = jwt.sign({
            usuario: usuarioBD
        }, SEED, {
            expiresIn: 14400
        });

        res.status(200).json({
            ok: true,
            usuario: usuarioBD,
            token: token,
            id: usuarioBD.id,
            menu: obtenerMenu(usuarioBD.role)
        });
    });


});

function obtenerMenu(ROLE) {
    var menu = [{
        titulo: 'Principal',
        icono: 'mdi mdi-gauge',
        submenu: [
          { titulo: 'Dashboard', url: '/dashboard'},
          { titulo: 'ProgressBar', url: '/progress'},
          { titulo: 'Graficas', url: '/graficas1'},
          { titulo: 'Promesas', url: '/promesas'},
          { titulo: 'Rxjs', url: '/rxjs'}
        ]
      },
      {
        titulo: 'Mantenimientos',
        icono: 'mdi mdi-folder-lock-open',
        submenu: [
        //   {titulo: 'Usuarios', url: '/usuarios'},
          {titulo: 'Hospitales', url: '/hospitales'},
          {titulo: 'Medicos', url: '/medicos'},
        ]
      }
    
    ];

    if (ROLE === 'ADMIN_ROLE') {
        menu[1].submenu.unshift({titulo: 'Usuarios', url: '/usuarios'});
    }
    
    return menu;
}

module.exports = app;