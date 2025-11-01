import { readFile, writeFile } from 'fs/promises'
import express from "express";
import { existsSync } from 'fs'
const app = express();

app.use(express.json())

const FILE_PATH = './db.json'

const readBlogs = async () => {
    try {
        if (!existsSync(FILE_PATH)) {
            await writeFile(FILE_PATH, JSON.stringify([], null, 2))
            return []
        }

        const data = await readFile(FILE_PATH, 'utf-8')

        if (!data.trim()) {
            return []
        }

        return JSON.parse(data)
    } catch (error) {
        console.error('Failed to read blogs:', error)
        return []
    }
}

const writeBlogs = async (blogs) => {
    await writeFile(FILE_PATH, JSON.stringify(blogs, null, 2))
}

app.get('/blogs',  async (req, res) => {
    try {
        const blogs = await readBlogs()

        if (blogs.length === 0) {
            return res.status(404).send('No blogs found')
        }
        return res.json(blogs)

    } catch (error) {
       return  res.status(500).json({ error: 'Failed to read blogs' })
    }
})

app.post('/blogs',  async (req, res) => {
    try {
        const blogs = await readBlogs()
        const { title, content } = req.body

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' })
        }
        const newBlog = {
            id: Date.now(),
            title,
            content,
        }

        blogs.push(newBlog)

        await writeBlogs(blogs)
        res.status(201).json(newBlog)

    } catch (error) {
        return res.status(500).json({ error: 'Failed to add blog' })
    }
})

app.put('/blogs/:id',  async (req, res) => {
    try {
        const blogs = await readBlogs()
        const id  = +req.params.id

        const { title, content } = req.body
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' })
        }

        let existingBlog = blogs.find(blog => blog.id === id)

        if (!existingBlog) {
            return res.status(404).send('No blog found with id ' + id)
        }

        const updatedBlog = {
            ...existingBlog,
            title,
            content,
        }

        const updatedBlogs = blogs.map(blog =>
            blog.id === id ? updatedBlog : blog
        )

        await writeBlogs(updatedBlogs)
        return res.status(201).json(updatedBlog)

    } catch (error) {
        return res.status(500).json({ error: 'Failed to change blog' })
    }
})

app.delete('/blogs/:id',  async (req, res) => {
    try {
        const blogs = await readBlogs()
        const id  = +req.params.id

        let existingBlog = blogs.find(blog => blog.id === id)

        if (!existingBlog) {
            return res.status(404).send('No blog found with id ' + id)
        }

        const newBlogs = blogs.filter(blog => blog.id !== id)

        await writeBlogs(newBlogs)
        res.status(200).json({ message: `Blog with id ${id} deleted` })

    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete blog' })
    }
})




app.listen(3000, () => console.log('Server running on http://localhost:3000'))