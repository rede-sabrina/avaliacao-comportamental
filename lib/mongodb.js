const { MongoClient } = require('mongodb');

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to environment variables');
}

const uri = process.env.MONGODB_URI;
const options = {};

if (!client) {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

module.exports = { client, clientPromise };
