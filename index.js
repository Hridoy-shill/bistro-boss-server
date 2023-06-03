const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());

// middleware for  JWT
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }

    //bearer token 
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        
        console.log('decode email', req.decoded);
        next();
    })
}


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

        // user's collection
        const UserCollection = client.db("bistro-boss").collection("users");

        // menu's collection's
        const menusCollection = client.db("bistro-boss").collection("menus");
        const reviewsCollection = client.db("bistro-boss").collection("reviews");
        const cartCollection = client.db("bistro-boss").collection("carts");


        // creating JWT token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log('user' ,user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            console.log(token);
            res.send({ token })
        })

        // create new user in db
        app.post('/newUser', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await UserCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already duke boshe ace' })
            }
            const result = await UserCollection.insertOne(user)
            console.log({ result, user });
            res.send(result)
        })

        // read user's data from dn
        app.get('/allUsers', verifyJWT, async (req, res) => {
            const result = await UserCollection.find().toArray();
            res.send(result)
        })

        // check admin from user's
        app.get('/allUsers/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            
            const query = { email: email }
            const user = await UserCollection.findOne(query)
            const result = { admin: user?.role === 'admin' };
            res.send(result)
        })

        // update Single user role
        app.patch('/allUsers/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await UserCollection.updateOne(filter, updateDoc);
            console.log(result);
            res.send(result)
        })

        // Delete user
        app.delete('/allUsers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await UserCollection.deleteOne(query)
            res.send(result)
        })

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
        app.get('/allCarts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (!email) {
                res.send([])
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access'})
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