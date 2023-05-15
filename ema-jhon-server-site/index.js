const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

// middleware
app.use(cors())
app.use(express.json())


app.get('/',(req,res)=>{
    res.send('ema-jhon')
})
app.listen(port,()=>{
    console.log(`PORT is running in - ${port}`)
})