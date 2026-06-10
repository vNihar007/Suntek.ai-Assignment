import cors from "cors"
import dotenv from "dotenv"
import express from "express"


import {toNodeHandler} from 'better-auth/node'
import {auth} from './lib/auth'
import { connectDB } from './lib/db'
import { errorHandler } from "./middleware/errorHandler"
import taskRoutes from './routes/tasks'
import timeRoutes from './routes/timers'
import summaryRoutes from './routes/summary'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001 



app.use(cors({
    origin:process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}))

// BetterAuth handles its own body parsing — mount BEFORE express.json()
app.all('/api/auth/*splat', toNodeHandler(auth))

// express.json() for the other routes 
app.use(express.json())

app.get("/health" , (req,res) =>{
    console.log("API RUNING")   
    res.json({success:true , message: 'API RUNING'})
})

//  place to add routes 

app.use('/api/tasks', taskRoutes)
app.use('/api/tasks/:id', timeRoutes)
app.use('/api/summary', summaryRoutes)

//  error handler 
app.use(errorHandler)

connectDB().then(()=>{
    app.listen(PORT , ()=>{
        console.log(`Server running on port ${PORT}`)
    })
}).catch((err)=>{
    console.error('Failed to connect to MongoDB:', err)
    process.exit(1)
})

export default app 

