const { rejects } = require('assert');
const express = require('express');
const fs = require('fs');
const { resolve } = require('path');
const { SERVICIOS } = require('../config');
const { healthCheck } = require('../middleware.js');
const { actualizarUbicaciones } = require('./actualizarUbicaciones');

const LINEAS = SERVICIOS.lineas;

const lineasDb = {
    buscarPorLinea(linea) {
        let promise = new Promise((resolve,rejects) => {
            fs.readFile("lineas.db.json", (err,data) => {
                if(err){
                    rejects(err)
                    return
                }
                resolve(JSON.parse(data)[linea])            
            })
        })
        return promise
    }
};

const app = new express();

app.use(healthCheck);

app.get('/lineas/:linea', (req, res) => {
    const linea = req.params.linea;
    lineasDb.buscarPorLinea(linea)
    .then(data => {
        console.log(data)
        const estadoLinea = data.funciona
        if (estadoLinea === undefined) {
            res.sendStatus(404);
        } else {
            res.json(data);
        }
    })    
    .catch(err => {
        console.log(err)
        res.send(500)
    }) 
});

app.listen(LINEAS.puerto, () => {
    console.log(`[${LINEAS.nombre}] escuchando en el puerto ${LINEAS.puerto}`);
    actualizarUbicaciones();
});
