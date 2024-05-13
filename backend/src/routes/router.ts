import { signinInput, signupInput } from "@akashsg1398/medium-common";
import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign, decode, verify } from "hono/jwt";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
}>()

userRouter.post('/api/v1/user/signup', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    const body = await c.req.json()
    const { success } = signupInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message: "Invalid Inputs"
        })
    }
  
    try {
  
      const user = await prisma.user.create({
        data: {
          username: body.username,
          password: body.password,
          name: body.name
        }
      })
  
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET)
  
      return c.text(jwt)
  
    } catch(e) {
      c.status(411)
      return c.text("Invalid Entries")
    }
  
  })
  
userRouter.post('/api/v1/user/signin', async (c) => {
  
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate())
  
    const body = await c.req.json()
    const { success } = signinInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message: "Invalid Inputs"
        })
    }
  
    try {const user = await prisma.user.findFirst({
      where:
      {
        username: body.username,
        password: body.password
      }
    })
  
    if(!user){
        c.status(403)
        return c.json({message : "Invalid Credentials"})
    }
  
    const jwt = await sign({
      id: body.id
    }, c.env.JWT_SECRET)
  
    return c.text(jwt)
  } catch(e){
    c.status(411)
    return c.json({message : "Unable to Sign In"})
  }
  })
  