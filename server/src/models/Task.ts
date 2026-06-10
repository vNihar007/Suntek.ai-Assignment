import mongoose, { Document, Schema } from "mongoose"

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface ITask extends Document {
    userId: string
    title: string
    description: string
    rawInput: string
    status: TaskStatus
    createdAt: Date
    updatedAt: Date
}

const TaskSchema = new Schema<ITask>({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    rawInput: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
}, { timestamps: true })

export const Task = mongoose.model<ITask>('Task', TaskSchema)