const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 4000

// middleware
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

        // client.connect();

        const galleryCollections = client.db("toyWorldDB").collection("gallery");

        const allCategoryCollections = client.db("toyWorldDB").collection("allCategories");
        const categoryCollections = client.db("toyWorldDB").collection("Categories");

        const premiumCollections = client.db("toyWorldDB").collection("premium");

        const reviewCollections = client.db("toyWorldDB").collection("reviews");


        // const indexKeys = { categoryName: 1 };
        // const indexOptions = { name: "toyCategory" };
        // const result = await allCategoryCollections.createIndex(indexKeys, indexOptions);
        // console.log(result);



        app.get("/searchToysByText/:text", async (req, res) => {
            const text = req.params.text;
            const result = await allCategoryCollections
                .find({ categoryName: { $regex: text, $options: "i" } }).toArray();
            res.send(result);
        });

        app.get('/gallery', async (req, res) => {
            const result = await galleryCollections.find().toArray();
            res.send(result)
        })

        app.get('/premium', async (req, res) => {
            const result = await premiumCollections.find().toArray();
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewCollections.find().toArray();
            res.send(result)
        })

        app.get('/category', async (req, res) => {
            const result = await categoryCollections.find().toArray();
            res.send(result)
        })


        app.get('/myCategory', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { sellerEmail: req.query.email }
            }
            const sortDirection = req.query?.isAscending === 'true' ? 1 : -1;
            const result = await allCategoryCollections.find(query).sort({ Price: sortDirection }).collation({ locale: "en_US", numericOrdering: true }).toArray();
            res.send(result)
        })

        app.get('/allCategory', async (req, res) => {
            const limit = parseInt(req.query.limit) || 20;
            const result = await allCategoryCollections.find().limit(limit).toArray();
            res.send(result)
        })


        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await allCategoryCollections.findOne(query);
            res.send(result)
        })

        app.post('/allCategory', async (req, res) => {
            const data = req.body
            const result = await allCategoryCollections.insertOne(data);
            res.send(result)
        })

        app.patch('/toy/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateData = req.body
            const updateDoc = {
                $set: {
                    categoryName: updateData.categoryName,
                    Picture: updateData.Picture,
                    Name: updateData.Name,
                    Price: parseInt(updateData.Price),
                    Rating: parseInt(updateData.Rating),
                    Quantity: updateData.Quantity,
                    Detail: updateData.Detail,
                    sellerEmail: updateData.sellerEmail,
                    sellerName: updateData.sellerName
                }
            };
            const result = await allCategoryCollections.updateOne(filter, updateDoc);
            res.send(result)
        })

        app.delete('/toy/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await allCategoryCollections.deleteOne(query);
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
    res.send('toys server')
})

app.listen(port, () => {
    console.log(`PORT IS RUNNING IN - ${port}`)
})