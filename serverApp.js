var express = require("express");
const { MongoClient } = require('mongodb');
var app = express();

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'TemperatureDB';

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.use(
    express.urlencoded({
        extended: true
    })
)

app.use(express.json());

//asynchronous method to be executed to write info in the DB
async function writeToDb(temperature, timestamp, sensor) {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('TemperatureDB');
    const doc = {
        value: temperature,
        timestamp: timestamp,
        sensorId: sensor,
        roomId: 'room1'
    };

    // insert the info in the database
    const insertResult = await collection.insertMany([doc]);
    console.log('Inserted documents =>', insertResult);
    return 'done.';
}


app.post("/temperature", (req, res, next) => {
    var temperature = req.body.temperature;
    var timestamp = req.body.timestamp;
    var sensor = req.body.sensor;
    writeToDb(temperature, timestamp, sensor)
        .then(console.log)
        .catch(console.error)
        .finally(() => client.close());
    res.sendStatus(200);

});

//asynchronous method to be executed to write info in the DB
async function getLastTemperatureFromDB() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('TemperatureDB');
    const query = { timestamp: {$gt: 0}};
    const options = {
        // sort matched documents in descending order by timestamp
        sort: { timestamp: -1 },
    };

    //get all the documents that respect the query
    const filteredDocs = await collection.find(query, options).toArray();
    //get the first document that respect the query
    const filteredDoc = await collection.findOne(query, options);
    console.log('Found documents filtered by timestamp: {$gt: 0} =>', filteredDoc);

    return JSON.parse(JSON.stringify(filteredDoc));
}


app.get('/dashboard', async (req, res) => {

    let finalTemp = await getLastTemperatureFromDB()
    res.send('Temperature: ' + finalTemp.value)
    //res.json(finalTemp.value)
})

