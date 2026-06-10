import dotenv from 'dotenv'
import { connectDB } from './lib/db'
import { Task } from './models/Task'
import { TimeLog } from './models/TimeLog'


dotenv.config()

async function run() {
    await connectDB()
  
    const task = await Task.create({
      userId: 'test-user-1',
      title: 'Test Task',
      rawInput: 'test task',
    })
    console.log('Task created:', task._id.toString())
  
    const log = await TimeLog.create({
      userId: 'test-user-1',
      taskId: task._id,
      startedAt: new Date(),
    })
    console.log('TimeLog created:', log._id.toString())
  
    await Task.deleteOne({ _id: task._id })
    await TimeLog.deleteOne({ _id: log._id })
    console.log('Cleanup done')
    process.exit(0)
  }


run ().catch(console.error)
