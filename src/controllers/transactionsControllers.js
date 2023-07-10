import dayjs from "dayjs"
import { db } from "../database.js";
import { ObjectId } from "mongodb";

export const newTransaction = async (req, res) => {
    const {tipo} = req.params;
    const {token} = req.headers;
    const {value, description} = req.body;
    
    console.log(req.body)
    const transaction = {tipo, token, value, description}
    try{
        const {userId} = await db.collection('sessions').findOne({token});
        if (!userId) return res.sendStatus(401);
        const user = await db.collection('users').findOne({_id: userId});
        transaction.userId = userId
        transaction.time = dayjs(Date.now()).format('DD/MM')
        let saldo = parseFloat(user.balance);
        let valor = parseFloat(value)
        tipo === "entrada" ? saldo += valor : saldo -= valor
        

        await db.collection('transactions').insertOne(transaction)
        await db.collection('users').updateOne({_id: userId}, {$set:{balance: saldo.toFixed(2)}})
        await db.collection('sessions').updateOne({userId: userId}, {$set:{balance: saldo.toFixed(2)}})
        res.sendStatus(200)
    }
    catch{
        res.sendStatus(400)
    }
}

export const getTransactions = async (req, res) => {
    const {token} = req.headers;
    if(!token) return res.sendStatus(401);

    try{
        const {userId, name, balance} = await db.collection('sessions').findOne({token})

        const relatedTransactions = await db.collection('transactions').find({userId}).toArray()

        res.status(200).send({name, balance, relatedTransactions})
        
    }
    catch{
        res.sendStatus(400)
    }

}

export const deleteTransaction = async (req, res) => {
    const {tid} = req.headers
    console.log(req.headers)
    if(!tid) return res.status(422).send(req.body)

    try{
    const {tipo, userId, value} = await db.collection('transactions').findOne({_id: new ObjectId(tid)})
    if (!userId) return res.sendStatus(404)
    const {balance} = await db.collection('sessions').findOne({userId})
    const valor = parseFloat(value)
    let saldo = parseFloat(balance)
    
    tipo === "entrada" ? saldo -= valor : saldo += valor
    

    await db.collection('users').updateOne({_id: userId}, {$set: {balance: saldo.toFixed(2)}})
    await db.collection('sessions').updateOne({userId}, {$set: {balance: saldo.toFixed(2)}})
    await db.collection('transactions').deleteOne({_id: new ObjectId(tid)})
    res.sendStatus(200)

}catch(err){
    res.sendStatus(400)
}
}

export const editTransaction = async (req, res) => {
    const {id} = req.params
    const {value, description} = req.body
    console.log({id, value, description})

    try{
        const transaction = await db.collection('transactions').findOne({_id: new ObjectId(id)})
        if(!transaction) return res.sendStatus(404)
        const user = await db.collection('users').findOne({_id: transaction.userId});
        const valorI = parseFloat(transaction.value)
        const valorF = parseFloat(value)
        let saldo = parseFloat(user.balance)

        transaction.tipo === 'entrada' ? (saldo += valorF - valorI): (saldo -= valorF - valorI)

        await db.collection('transactions').updateOne({_id: new ObjectId(id)}, {$set: {value, description}})
        await db.collection('users').updateOne({_id: transaction.userId}, {$set: {balance: saldo}})
        await db.collection('sessions').updateOne({userId: transaction.userId}, {$set: {balance: saldo}})
    
        res.sendStatus(200)
    } catch{
        res.sendStatus(400)
    }
}