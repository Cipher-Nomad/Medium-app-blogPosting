import { createBlogInput, updateBlogInput } from "@akashsg1398/medium-common";
import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
    Variables: {
        userId: string
    }
}>()

blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || ""
    try {const user = await verify(authHeader, c.env.JWT_SECRET)

    if(user){
        c.set("userId", user.id)
        await next()
    }
    else{
        c.status(403)
        return c.json({message: "You are not Logged In"})
    }} catch (e) {
        c.status(403)
        return c.json({
            message: "You are not Logged In"
        })
    }
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json()
    const authorId = c.get("userId")
    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    const { success } = createBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message: "Invalid Inputs"
        })
    }

    const blog = await prisma.blog.create({
        data:{
            title: body.title,
            content: body.content,
            authorId: Number(authorId)
        }
    })

    return c.json({
        id: blog.id
    })
})

blogRouter.put('/', async (c) => {
    const body = await c.req.json()
    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    const { success } = updateBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message: "Invalid Inputs"
        })
    }

    try {const blog = await prisma.blog.update({
        where:{
            id: body.id
        },
        data:{
            title: body.title,
            content: body.content
        }
    })

    return c.json({
        message: "Blog post Updated"
    })} catch (e) {
        c.status(403)
        return c.json({
            message: "Error in updating Blog Post"
        })
    }
})

blogRouter.get('/bulk', async (c) => {
    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try {const blogs = await prisma.blog.findMany()
    return c.json({
        blogs
    })} catch(e) {
        c.status(411)
        return c.json({
            message: "Error in fetching Blogs!"
        })
    }
})

blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id")
    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try {const blog = await prisma.blog.findFirst({
        where:{
            id: Number(id)
        }
    })
    return c.json({
        blog
    })} catch (e) {
        c.status(411)
        return c.json({
            message: "Error while fetching Blog post."
        })
    }
})
