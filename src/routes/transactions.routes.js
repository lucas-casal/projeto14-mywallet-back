import { Router } from "express";  
import { deleteTransaction, editTransaction, getTransactions, newTransaction } from "../controllers/transactionsControllers.js";
import { newTransactionSchema } from "../schemas/transactionsSchemas.js";
import { validateSchemas } from "../middlewares/validateSchema.js";
import { validateAuth } from "../middlewares/validateAuth.js";


const transactionsRouter = Router()

transactionsRouter.post('/nova-transacao/:tipo', validateAuth, validateSchemas(newTransactionSchema), newTransaction )
transactionsRouter.get('/home', validateAuth, getTransactions )
transactionsRouter.delete('/nova-transacao', validateAuth, deleteTransaction)
transactionsRouter.put('/editar-registro/:tipo/:id', validateAuth, editTransaction)

export default transactionsRouter