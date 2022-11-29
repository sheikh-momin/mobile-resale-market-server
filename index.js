const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET);

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v3avrd5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next();
  })
}


async function run(){
    try{
      const categoriesCollection = client.db('mobileResaleMarket').collection('brandsCategories');
      const allPhoneCollection = client.db('mobileResaleMarket').collection('allPhones');
      const bookingsCollection = client.db('mobileResaleMarket').collection('bookings');
      const usersCollection = client.db('mobileResaleMarket').collection('users');
      const paymentsCollection = client.db('mobileResaleMarket').collection('payments');
      const reportedItemsCollection = client.db('mobileResaleMarket').collection('reportedItems');

      const verifyAdmin = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);
        if (user?.role !== 'admin') {
          return res.status(403).send({ message: 'forbidden access' })
        }
        next();
      }

      //phone categories
      app.get('/categories', async (req, res) => {
        const query = {};
        const result = await categoriesCollection.find(query).toArray();
        res.send(result);
      });

      app.get('/productCategory', async (req, res) => {
        const query = {}
        const result = await categoriesCollection.find(query).project({ name: 1 }).toArray();
        res.send(result);
      });

      app.get('/categories/:id', async (req, res) => {
        const id = req.params.id
        const query = { id: id };
        const result = await allPhoneCollection.find(query).toArray();
        res.send(result);
      });

      app.post('/products', async (req, res) => {
        const product = req.body;
        const result = await allPhoneCollection.insertOne(product);
        res.send(result);
      });

      app.get('/products', verifyJWT, async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const product = await allPhoneCollection.find(query).toArray();
        res.send(product);
      });

      app.get('/products/advertised', async (req, res) => {
        const query = { advertise: true };
        const result = await allPhoneCollection.find(query).toArray();
        res.send(result);
      });

      app.put('/products/advertise/:id', verifyJWT, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            advertise: true
          }
        }
        const result = await allPhoneCollection.updateOne(filter, updatedDoc, options);
        res.send(result);
      });
    }
    finally{}
}
run().catch(console.log);




app.get('/', (req, res) => {
  res.send('phone resale house server running')
});

app.listen(port, () => {
  console.log(`phone resale house ${port}`);
});

