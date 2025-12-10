import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

const app = express()
dotenv.config

const port = 3005
app.use(cors({ origin: '*' })) // cors
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: false }))

app.listen(port, function () {
    console.log(`Api corriendo en http://localhost:${port}!`)
})

app.get('/',(rep,res)=>{
    console.log('mi primer endpoint')
    res.status(200).send('hola, la API esta funcionando correctamente');
});