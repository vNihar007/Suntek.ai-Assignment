import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

export async function connectDB() {
    const uri = process.env.MONGO_URI
    if (!uri) {
        throw new Error('MONGO_URI is not set')
    }
    await mongoose.connect(uri)
    console.log('MongoDB connected')
}

