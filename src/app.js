import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from 'dotenv'
import Joi from "joi"
import dayjs from "dayjs"
import bcrypt from "bcrypt"
import { v4 as uuid } from 'uuid'

dotenv.config()
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
 .then(() => db = mongoClient.db())
 .catch((err) => console.log(err.message));

const app = express();
app.use(cors());
app.use(express.json())

app.post('/cadastro', async (req, res) =>{
    const {name, email, password} = req.body;
    const schema = Joi.object({
        name:Joi.string().required(),
        email:Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password:Joi.string().min(3).required()
    })
    const user = {name, email, password}

    if (schema.validate(user).error) return res.sendStatus(422)
    try{
        const hash = bcrypt.hashSync(password, 10)
        const existUser = await db.collection('users').findOne({email: email})
        if (existUser) return res.sendStatus(409);
        user.balance = '0'
        user.password = hash
        await db.collection('users').insertOne(user)
        res.sendStatus(201)
    }
    catch{
        res.sendStatus(400)
    }
})

app.post('/', async (req, res) =>{
    const {email, password} = req.body;
    const schema = Joi.object({
        email:Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password:Joi.string().min(3).required()
    })
    const loginInfo = {email, password}
    if(schema.validate(loginInfo).error) return res.sendStatus(422)
    try{
        const user = await db.collection('users').findOne({email: email})
        if (!user) return res.sendStatus(404)
        if (!bcrypt.compareSync(password, user.password)) return res.sendStatus(401)
        
        const token = uuid()
        delete user.password
        user.token = token
        await db.collection('sessions').insertOne(user)
        console.log(user)
        res.status(200).send(token)    
    }
    catch{
        res.sendStatus(400)
    }
})

app.delete('/', async (req, res) => {
    const {token} = req.headers;
    if(!token) return res.sendStatus(422)

    try{
        //await db.collection('sessions').updateOne({token}, {$set: {active: false}})
        await db.collection('sessions').deleteOne({token})
        res.sendStatus(200)
    }
    catch{
        res.sendStatus(400)
    }
})

app.post('/nova-transacao/:tipo', async (req, res) => {
    const {tipo} = req.params;
    const {token} = req.headers;
    const {value, description} = req.body;
    const schema = Joi.object({
        tipo: Joi.string().valid('entrada', 'saida').required(),
        token: Joi.string().required(),
        value:Joi.number().positive().required(),
        description:Joi.string().required()
    })

    const transaction = {tipo, token, value, description}
    if(schema.validate(transaction).error) return res.sendStatus(422)
    try{
        const {userId} = await db.collection('sessions').findOne({token});
        if (!userId) return res.sendStatus(401);
        const user = await db.collection('users').findOne({_id: userId});
        transaction.userId = userId
        transaction.time = dayjs(Date.now()).format('HH:mm:ss')
        let saldo = parseFloat(user.balance);
        const valor = parseFloat(value)
        tipo === "entrada" ? saldo += valor : saldo -= valor
        await db.collection('transactions').insertOne(transaction)
        await db.collection('users').updateOne({_id: userId}, {$set:{balance: saldo}})
        res.sendStatus(200)
        console.log(saldo)
    }
    catch{
        res.sendStatus(400)
    }
})

app.get('/home', async (req, res) => {
    const {token} = req.headers;
    if(!token) return res.sendStatus(401);

    try{
        const {_id, name, balance} = await db.collection('sessions').findOne({token})

        const relatedTransactions = await db.collection('transactions').find({userId: _id}).toArray()

        res.status(200).send({name, balance, relatedTransactions})
        
    }
    catch{
        res.sendStatus(400)
    }

})






const PORT = 5000;
app.listen(PORT, ()=>console.log(`Servidor rodando na porta ${PORT}`))