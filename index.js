const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());

// testing

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.fawgdio.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const menusCollection = client.db("bistro-boss").collection("menus");
        const reviewsCollection = client.db("bistro-boss").collection("reviews");
        const cartCollection = client.db("bistro-boss").collection("carts");

        // read menus data from Bistro-Db
        app.get('/menus', async (req, res) => {
            const result = await menusCollection.find().toArray()
            res.send(result)
        })

        // read reviews data from Bistro-Db
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })


        // get cart specific item from all cart item's
        app.get('/allCarts', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (!email) {
                res.send([])
            }
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result)
        })

        // post cart item
        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item)
            res.send(result)
        })

        // delete specific item by id
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('the server is running')
})

app.listen(port, () => {
    console.log(`the server is running from ${port}`);
})