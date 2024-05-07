/* eslint-disable prettier/prettier */
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
      const createUserSchema = z.object({
          name: z.string(),
          email: z.string().email(),
        })
        
        let sessionId = request.cookies.sessionId
        console.log(request.body)
        
    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    const { name, email } = createUserSchema.parse(request.body)

    const userByEmail = await knex('users').where({ email }).first()

    if (userByEmail) {
      return reply.status(400).send({ message: 'User Already Exists' })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.get('/', 
  {
    preHandler: [checkSessionIdExists]
  },
  async (request) => {
    const { sessionId } = request.cookies

    const users = await knex('users').where('session_id', sessionId).select()

    return {
        users
    }
  }
)
}
