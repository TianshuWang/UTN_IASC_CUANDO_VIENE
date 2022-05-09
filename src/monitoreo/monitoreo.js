const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { get } = require('../request');
const { SERVICIOS } = require('../config');

const MONITOREO = SERVICIOS.monitoreo;

const app = new express();

app.get('/', (res, req) => {
    req.sendFile('index.html', { root: __dirname });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function mensaje(contenido) {
    const esTexto = typeof contenido === 'string';
    return JSON.stringify({ msg: contenido, type: esTexto ? 'texto' : 'estados' });
}

wss.on('connection', (ws) => {
    ws.send(mensaje('¡Conectado al monitoreo de servicios!'));

    setInterval(() => {
        let servicios = [SERVICIOS.lineas, SERVICIOS.paradas, SERVICIOS.cuandoViene]
        let status = servicios.map(s => {
            return new Promise((resolve,rejects) => {
                get(s, "/health", (err, data) => {
                    let servicio = s.nombre
                    let result = data === undefined ? 
                    {servicio:servicio, status: 'DOWN'} : {servicio:servicio, status:data.status}  

                    resolve(result)
                })
            })
        })

        Promise.all(status)
        .then(serviciosStatus => {
            ws.send(mensaje({estados:serviciosStatus,type:'estados'}))
        })
        .catch(err => {
            console.log(err)
            res.send(500)
        })        
    }, 5000);

    ws.on('close', () => {
        console.log('Se cerró una conexión');
    });
});

server.listen(MONITOREO.puerto, () => {
    console.log(`[${MONITOREO.nombre}] escuchando en el puerto ${MONITOREO.puerto}`);
});

