var express = require("express");
const WebSocket = require('ws');
const path = require('path');
const mqtt = require('mqtt');

var app = express();

// Avvio del server HTTP sulla porta 3000 per servire la pagina HTML
app.listen(3000, () => {
    console.log("Server running on port 3000");
});

// Middleware per interpretare i dati provenienti da form HTML o JSON (opzionali in questa architettura)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Creazione del server WebSocket sulla porta 3001
const wss = new WebSocket.Server({ port: 3001 });

// Gestione della connessione WebSocket con la Dashboard (il browser)
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    ws.send('something'); // Messaggio di benvenuto al client della dashboard
});

// Connessione al broker MQTT HiveMQ
var mqttClient = mqtt.connect("mqtt://broker.hivemq.com", { clientId: "mqttjs041" });

mqttClient.on("connect", function () {
    console.log("connected");
    // Nota: Sarebbe ideale mettere il subscribe qui dentro
});

mqttClient.on("error", function (error) {
    console.log("Can't connect" + error);
});

// Funzione per inviare il dato a TUTTI i browser connessi tramite WebSocket
async function pushToWsClient(temperature) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(temperature.toString()); // Invia il valore della temperatura
        }
    });
}

// Evento attivato quando arriva un messaggio MQTT sul topic sottoscritto
mqttClient.on('message', function (topic, message, packet) {
    console.log("message is " + message);
    console.log("topic is " + topic);

    // Parsing del messaggio ricevuto (si aspetta un JSON dal sensore)
    var messageJSON = JSON.parse(message);
    var temperature = messageJSON.temperature;
    var timestamp = messageJSON.timestamp;
    var sensor = messageJSON.sensor;

    // Inoltra il dato estratto alla dashboard via WebSocket
    pushToWsClient(temperature).catch();
});

// Rotta per servire il file index.html quando l'utente va su http://localhost:3000/dashboard
app.get('/dashboard', async (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

// Definizione del topic e iscrizione (Subscribe)
var topic = "test-topic-handson/data";
console.log("subscribing to topic " + topic);
mqttClient.subscribe(topic);