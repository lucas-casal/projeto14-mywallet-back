import Joi from "joi"
import bcrypt from "bcrypt"
import { v4 as uuid } from "uuid";
import { db } from "../database.js";

export const signUp = async (req, res) =>{
    const {name, email, password} = req.body;
    const user = {name, email, password}
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
}
export const signIn = async (req, res) =>{
    const {email, password} = req.body;
    console.log(req.body)
    try{
        const user = await db.collection('users').findOne({email: email})
        if (!user) return res.sendStatus(404)
     
        if (!bcrypt.compareSync(password, user.password)) return res.sendStatus(401)
       
        const token = uuid()
        const userId = user._id
        user.userId = userId
        user.token = token
        delete user.password
        delete user._id
        const anotherSession = await db.collection('sessions').findOne({userId})
        if (anotherSession){
        await db.collection('sessions').deleteOne({userId})
        }
        await db.collection('sessions').insertOne(user)
        console.log(user)
        res.status(200).send(token)  
    }
    catch{
        res.sendStatus(425)
    }
}
export const signOut =  async (req, res) => {
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
}
