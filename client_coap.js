const coap = require('coap');

// Imposta un intervallo ciclico per l'invio dei dati ogni 2000ms (2 secondi)
setInterval(function () {
    // Definizione del range di simulazione per la temperatura
    var highTem = 30; // Limite massimo (30°C)
    var lowTem = 10;  // Limite minimo (10°C)
    
    // Generazione di un valore casuale tra 10 e 30
    var randomTemparature = Math.random() * (highTem - lowTem) + lowTem;
    
    // Log a console del valore che stiamo per inviare (formattato a 1 decimale)
    console.log('Temperature:', randomTemparature.toFixed(1) + 'C');

    // Creazione del payload JSON con i metadati del sensore
    const postData = JSON.stringify({
        'sensor': 'ID1',
        'timestamp': Date.now(),
        'temperature': randomTemparature.toFixed(1)
    });

    // Configurazione dei parametri della richiesta CoAP
    const options = {
        hostname: '127.0.0.1', // Indirizzo del server (stessa macchina)
        port: 5683,            // Porta standard CoAP
        //ATTENZIONE: con path non funziona, usare pathname
        pathname: '/temperature',  // Endpoint che il server sta ascoltando
        method: 'POST',        // Metodo per l'invio dati
    };

    // Creazione della richiesta CoAP basata sulle opzioni definite
    const req = coap.request(options);

    // Gestione della risposta proveniente dal server (se prevista dal server)
    req.on('response', res => {
        res.on('data', d => {
            // Stampa la risposta ricevuta dal server nel terminale
            process.stdout.write(d);
        });
    });

    // Gestione di eventuali errori di rete o di irraggiungibilità del server
    req.on('error', error => {
        console.error("Errore durante la richiesta CoAP:", error);
    });

    // Inserisce i dati JSON nel corpo della richiesta
    req.write(postData);

    // Conclude e invia effettivamente il pacchetto CoAP (UDP)
    req.end();

}, 2000);