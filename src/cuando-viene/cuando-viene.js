const express = require('express');
const { colectivoMasCercano } = require('../ubicacion');
const { get } = require('../request');
const { healthCheck } = require('../middleware.js');
const { SERVICIOS } = require('../config');
const { resolve } = require('path');
const { rejects } = require('assert');

const TRANSITO = SERVICIOS.cuandoViene;

const app = new express();

app.use(healthCheck);

app.get('/cuando-viene/:parada', (req, res) => {
    const parada = req.params.parada;
    get(SERVICIOS.paradas,'/paradas/' + parada, (err, dataParada) => {
        let lineas = dataParada.lineas

        let dataLineas = lineas.map(linea => {
            return new Promise((resolve,rejects) => {
                get(SERVICIOS.lineas, '/lineas/' + linea, (err, dataLinea) => {
                    let detalleDeLaLinea = {linea:linea,colectivos:dataLinea.colectivos}
                    const result =  dataLinea.funciona ? colectivoMasCercano(detalleDeLaLinea, dataParada.ubicacion) : undefined    
                    resolve(result)                                  
                })
            })
        })
        
        Promise.all(dataLineas)
        .then(colectivosMasCercanos => colectivosMasCercanos.filter(c => c != undefined))
        .then(colectivosMasCercanos => colectivosMasCercanos.filter(c => c.tiempoDeLlegada >= 0))
        .then(colectivosMasCercanos => colectivosMasCercanos.sort(compare("tiempoDeLlegada")))
        .then(colectivosMasCercanos => res.json({colectivosMasCercanos}))
        .catch(err => {
            console.log(err)
            res.send(500)
        })
    })  
    
});

function compare(p){ 
    return function(m,n){
        var a = m[p];
        var b = n[p];
        return a - b;
    }
}

app.listen(TRANSITO.puerto, () => {
    console.log(`[${TRANSITO.nombre}] escuchando en el puerto ${TRANSITO.puerto}`);
});

