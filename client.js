/*
 * SCRIPT DI MONITORAGGIO IoT (Node.js)
 * -----------------------------------
 * DESCRIZIONE:
 * Questo script simula (o legge tramite libreria node-dht-sensor) i dati 
 * di temperatura e umidità ogni 2 secondi. 
 * * FUNZIONALITÀ:
 * 1. Genera valori casuali per temperatura (10-30°C) e umidità (0-100%).
 * 2. Formatta i dati in un oggetto JSON (ID sensore, timestamp, valore).
 * 3. Invia i dati tramite una richiesta HTTP POST a un server locale 
 * (IP: 192.168.1.250, Porta: 3000, Endpoint: /temperature).
 * 4. Gestisce la risposta del server e monitora eventuali errori di rete.
 * * NOTA: Per l'uso con un sensore reale, de-commentare la libreria 
 * 'node-dht-sensor' e la funzione di inizializzazione GPIO.
 */



//const sensorLib = require('node-dht-sensor'); // include existing module called ‘node-dht-sensor’
// Setup sensor, exit if failed
//var sensorType = 11; // 11 for DHT11, 22 for DHT22 and AM2302
//var sensorPin = 4; // The GPIO pin number for sensor signal
//if (!sensorLib.initialize(sensorType, sensorPin))
//{
//print a warning message in the console
//console.warn('Failed to initialize sensor’);
//process.exit(1);
//}
// Automatically update sensor value every 2 seconds
//we use a nested function (function inside another function)
const http = require('node:http');
setInterval(function () {
    //var readout = sensorLib.read();
    var highTem = 30;
    var lowTem = 10;
    var randomTemparature = Math.random() * (highTem - lowTem) + lowTem
    console.log('Temperature:', randomTemparature.toFixed(1) + 'C');
    var highHum = 100;
    var lowHum = 0;
    var randomHumidity = Math.random() * (highHum - lowHum) + lowHum
    console.log('Humidity: ', randomHumidity.toFixed(1) + '%');

    // invio al server
    const postData = JSON.stringify({
        'sensor': 'ID1',
        'timestamp': Date.now(),
        //'temperature': readout.temperature.toFixed(1)
        'temperature': parseFloat(randomTemparature.toFixed(1)) // <--- Numero pulito con 1 decimale
    })
    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/temperature',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    const req = http.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    // Write data to request body
    req.write(postData);
    req.end();


}, 2000);