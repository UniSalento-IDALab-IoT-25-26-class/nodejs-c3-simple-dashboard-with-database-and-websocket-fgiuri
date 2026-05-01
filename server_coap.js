var express = require("express");
const coap = require('coap');
const WebSocket = require('ws');
const path = require('path');

// Inizializzazione del server CoAP (basato su protocollo UDP)
const coapServer = coap.createServer();
var app = express();

// Avvio del server HTTP (porta 3000) per gestire l'interfaccia web (dashboard)
app.listen(3000, () => {
    console.log("Server running on port 3000");
});

// Middleware per il parsing di eventuali richieste HTTP POST/URL-encoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Avvio del server WebSocket sulla porta 3001 per la comunicazione real-time con il browser
const wss = new WebSocket.Server({ port: 3001 });

// Gestione degli eventi del server WebSocket
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    ws.send('something'); // Feedback di connessione avvenuta per la dashboard
});

// GESTIONE RICHIESTE CoAP
// Si attiva ogni volta che un dispositivo invia un pacchetto CoAP al server
coapServer.on('request', (req, res) => {
    /* console.log('[CoAP] Richiesta ricevuta:', req.method, req.url);
    console.log('[CoAP] Payload raw:', req.payload); */
    // Verifica che la richiesta sia una POST e diretta all'URL corretto
    if (req.method === 'POST' && req.url === '/temperature') {
        
        // req.payload contiene i dati binari; li convertiamo in stringa e poi in oggetto JSON
        const body = JSON.parse(req.payload.toString());
        const { temperature } = body;
        
        console.log(`[CoAP] Temperature: ${temperature}`);
        
        // Inoltra il dato ricevuto ai client WebSocket (la dashboard)
        pushToWsClient(temperature).catch();
        
        // Risposta CoAP (opzionale, ma buona norma per confermare la ricezione al sensore)
        res.end(); 
    }
    else
        console.log('[CoAP] Richiesta ignorata (metodo o URL non corrisponde)');

});

// Funzione "Bridge": scorre tutti i client WebSocket connessi e invia loro il dato
async function pushToWsClient(temperature) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(temperature.toString()); // Il dato deve essere inviato come stringa
        }
    });
}

// Mette il server CoAP in ascolto sulla porta standard 5683
coapServer.listen(5683, () => {
    console.log('Server CoAP in ascolto sulla porta 5683');
});

// Endpoint per visualizzare la dashboard nel browser
app.get('/dashboard', async (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});