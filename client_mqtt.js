const mqtt = require('mqtt');

// Stabilisce la connessione con il broker pubblico HiveMQ
// clientId: "mqttjs01" è l'identificativo univoco di questo client sul broker
var client = mqtt.connect("mqtt://broker.hivemq.com", { clientId: "mqttjs01" });

// Callback attivata quando la connessione al broker avviene con successo
client.on("connect", function () {
    console.log("connected");
});

// Callback attivata in caso di errore durante il tentativo di connessione
client.on("error", function (error) {
    console.log("Can't connect" + error);
});

// Imposta un timer ciclico che esegue il codice ogni 2000ms (2 secondi)
setInterval(function () {
    // Definizione del range di temperatura per la simulazione
    var highTem = 30; // Limite massimo (30°C)
    var lowTem = 10;  // Limite minimo (10°C)
    
    // Calcola una temperatura casuale all'interno del range (10-30)
    var randomTemparature = Math.random() * (highTem - lowTem) + lowTem;
    
    // Stampa a console il valore generato arrotondato a una cifra decimale
    console.log('Temperature:', randomTemparature.toFixed(1) + 'C');

    // Crea il pacchetto JSON da inviare
    const postData = JSON.stringify({
        'sensor': 'ID1',             // Identificativo del sensore
        'timestamp': Date.now(),      // Timestamp attuale in millisecondi
        'temperature': randomTemparature.toFixed(1) // Valore formattato come stringa (es: "22.4")
    });

    // Pubblica il pacchetto JSON sul topic specificato
    // Nota: Assicurati che il server sia iscritto a "test-topic-handson/data" per riceverlo
    client.publish("test-topic-handson/data", postData);

}, 2000);