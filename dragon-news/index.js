const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000

app.use(cors())

const categories = require('./categories.json')

const news = require('./news.json')

app.get('/datas', (req, res) => {
    res.send(categories)
})

app.get('/news', (req, res) => {
    res.send(news)
})

app.get('/news/:id', (req, res) => {
    const id = req.params.id
    const singleNews = news.find(n => n._id == id)
    res.send(singleNews)
})


app.get('/categories/:id', (req, res) => {
    const id = req.params.id
    if (id == 0) {
        res.send(news)
    }
    else {
        const categoriesNews = news.filter(n => n.category_id == id)
        res.send(categoriesNews)
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})