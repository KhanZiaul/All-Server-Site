const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 7000

// Middlewares
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_TITLE}:${process.env.DB_PASS}@cluster0.mf37tl1.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const reviewCollection = client.db("bistroDB").collection("reviews");
        const menuCollection = client.db("bistroDB").collection("menu");
        const cartsCollection = client.db("bistroDB").collection("carts");
        const usersCollection = client.db("bistroDB").collection("users");

        // users-------

        app.post('/users', async(req,res) =>{
            const user = req.body
            const query = {email : user.email}
            const existUser = await usersCollection.findOne(query)
            if(existUser){
                return res.send({message : 'USER ALREADY EXIST'})
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.patch('/users/admin/:id', async(req,res) =>{
            const id = req.params.id
            const query = {_id : new ObjectId(id)}
            const updateDoc = {
                $set: {
                  role : 'admin'
                },
              };
            const result = await usersCollection.updateOne(query,updateDoc)
            res.send(result)
        })

        app.get('/users', async(req,res) =>{
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        
        // cart--------

        app.post('/carts', async (req, res) => {
            const query = req.body
            const result = await cartsCollection.insertOne(query)
            res.send(result)
        })

        app.get('/carts', async (req, res) => {
            const userEmail = req.query.email ;
            if(!userEmail){
                res.send([])
            }
            const query = { email : userEmail}
            const result = await cartsCollection.find(query).toArray()
            res.send(result)
        })

        
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id : new ObjectId(id)}
            const result = await cartsCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('BISTRO BOSS')
})

app.listen(port, () => {
    console.log(`PORT IS RUNNING IN - ${port}`)
})