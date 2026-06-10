import mongoose, { Document, Schema, Types } from "mongoose"

export interface ITimeLog extends Document {
    userId: string
    taskId: Types.ObjectId
    startedAt: Date
    stoppedAt: Date | null
    duration: number
}

const TimeLogSchema = new Schema<ITimeLog>({
    userId:    { type: String, required: true, index: true },
    taskId:    { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    startedAt: { type: Date, required: true },
    stoppedAt: { type: Date, default: null },
    duration:  { type: Number, default: 0 },
  })

export const TimeLog = mongoose.model<ITimeLog>('TimeLog', TimeLogSchema)