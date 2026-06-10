import dotenv from "dotenv"
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb"


dotenv.config()

const client  = new MongoClient(process.env.MONGO_URI!)
const db = client.db()

export const auth = betterAuth({
    database: mongodbAdapter(db,{client}),
    emailAndPassword : {
        enabled : true , 
        minPasswordLength : 8 ,
    },
    trustedOrigins : [
        process.env.CLIENT_URL ?? 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ],
    secret : process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
})