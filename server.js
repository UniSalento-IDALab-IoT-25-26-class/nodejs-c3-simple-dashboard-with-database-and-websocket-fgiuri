/**
 * SERVER DI MONITORAGGIO IoT (Express + MongoDB)
 * --------------------------------------------
 * Questo script gestisce la ricezione di dati da sensori remoti,
 * la loro memorizzazione in MongoDB e l'invio in tempo reale via WebSocket.
 */

const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const port = 3000;

// --- Configurazione Database ---
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = 'TemperatureDB';

// --- Middleware ---
// Permettono al server di leggere e capire i dati JSON che arrivano nel corpo della POST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * STEP 3: Integrazione MongoDB
 * Funzione asincrona per scrivere i dati nel database
 */
async function writeToDb(temperature, timestamp, sensor) {
    // Apre la connessione fisica con il server MongoDB
    await client.connect();
    console.log('Connesso con successo al server MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('TemperatureDB');

    // Crea l'oggetto (Documento) da salvare sul database
    const doc = {
        value: temperature,
        timestamp: timestamp, // Prende il timestamp inviato dal client
        sensorId: sensor,
        roomId: 'room1'
    };

    // Inserisce il documento nella collezione e restituisce il risultato dell'operazione
    const insertResult = await collection.insertMany([doc]);

    console.log('Documenti inseriti =>', insertResult);
    return 'Dato archiviato correttamente.';
}

/**
 * Gestore Rotta POST "/temperature"
 * Riceve i dati dal sensore, li salva nel DB e li "spinge" verso il WebSocket
 */
app.post("/temperature", (req, res, next) => {
    // Estrae i valori inviati dal client (es: Date.now() e il valore random)
    var temperature = req.body.temperature;
    var timestamp = req.body.timestamp;
    var sensor = req.body.sensor;

    // Esegue la funzione di scrittura sul DB
    writeToDb(temperature, timestamp, sensor)
        .then(console.log)
        .catch(console.error)
        .finally(() => client.close()); // Chiude la connessione dopo ogni operazione

    // Invia il valore della temperatura ai client WebSocket connessi
    pushToWsClient(temperature).catch();

    // Risponde al sensore con stato 200 (OK) per confermare la ricezione
    res.sendStatus(200);
});

// --- Avvio del Server Express ---
app.listen(port, () => {
    console.log(`Server attivo su http://localhost:${port}`);
    console.log("STATO: In attesa di dati dal sensore...");
});

/**
 * Funzione asincrona per recuperare l'ultimo dato dal DB
 * Utilizzata per mostrare il dato storico al caricamento della dashboard
 */
async function getLastTemperatureFromDB() {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('TemperatureDB');

    // Query per trovare documenti con timestamp valido
    const query = { timestamp: { $gt: 0 } };
    const options = {
        // Ordina i documenti in modo decrescente (-1) per timestamp (il più recente per primo)
        sort: { timestamp: -1 },
    };

    // Recupera il primo documento che risponde ai criteri (il più recente)
    const filteredDoc = await collection.findOne(query, options);
    console.log('Found latest document =>', filteredDoc);

    // Restituisce l'oggetto pulito (senza riferimenti circolari del driver)
    return JSON.parse(JSON.stringify(filteredDoc));
}

// --- WebSocket per ricezione automatica (Tempo Reale) ---
const WebSocket = require('ws');
const path = require('path');

// Crea un server WebSocket sulla porta 3001 (separata da quella web)
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', function connection(ws) {
    // Gestisce i messaggi in entrata dal browser (se presenti)
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    // Messaggio di benvenuto al collegamento (puoi rimuoverlo se vuoi solo i dati)
    ws.send('Benvenuto');
});

/**
 * Funzione per "spingere" la temperatura a tutti i browser aperti
 */
async function pushToWsClient(temperature) {
    // Cicla tra tutti i client (browser) attualmente connessi al WebSocket
    wss.clients.forEach(function each(client) {
        // Se la connessione è aperta, invia il valore della temperatura
        if (client.readyState === WebSocket.OPEN) {
            client.send(temperature.toString()); // Convertiamo in stringa per l'invio
        }
    });
}

/**
 * Rotta GET "/dashboard"
 * Invia al browser il file HTML che contiene il grafico o la visualizzazione live
 */
app.get('/dashboard', async (req, res) => {
    // Invia il file index.html situato nella stessa cartella del server
    res.sendFile(path.join(__dirname + '/index.html'));
});