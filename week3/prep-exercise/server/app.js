import express from 'express'
import bcrypt from "bcryptjs"
import newDatabase from './database.js'
import { v4 as uuidv4 } from 'uuid'
import jwt from "jsonwebtoken"

let app = express()

app.use(express.json())

// Serve the front-end application from the `client` folder
app.use(express.static('client'))

const database = newDatabase({ isPersistent: true })
const users = []
const SECRET = '123'


app.post("/auth/register", async (req, res, next) => {
    try {
        const {username, password} = req.body

        if (!username || !password) {
            return res.status(400).send({ message: 'Username and password are required' })
        }

        const existingUser = users.find(u => u.username === username)
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' })
        }

        const passwordSalt =  await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, passwordSalt)

        const newUser = await database.create({
            username,
            password: passwordHash,
        })

        users.push(newUser)

        res.status(201).send({id: newUser.id, username: newUser.username})
    } catch (error) {
        next(error)
    }
})

app.post("/auth/login", async (req, res, next) => {
    try {

        const {username, password} = req.body

        if (!username || !password) {
            return res.status(400).send({ message: 'Username and password are required' })
        }

        const user = users.find(user => user.username === username)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = jwt.sign({userId: user.id}, SECRET, {expiresIn: '1h'})

        res.status(201).json({token})
    } catch (error) {
        next(error)
    }
})

app.get("/auth/profile", async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, SECRET)
        const user = await database.getById(decoded.userId)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.status(200).json({ message: `Hi, ${user.username}` })
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
})

app.post("/auth/logout", (req, res, next) => {
    return res.sendStatus(204)
})



app.use((err, req, res, next) => {

    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal Server Error'

    res.status(status).json({ message })
})


app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
