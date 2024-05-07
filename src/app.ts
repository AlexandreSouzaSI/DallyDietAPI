/* eslint-disable prettier/prettier */
import cookie from '@fastify/cookie'
import fastify from 'fastify'
import { userRoutes } from './routes/userRoutes'
import { mealsRoutes } from './routes/mealsRautes'

export const app = fastify()

app.register(cookie)

app.register(userRoutes, {
  prefix: 'users',
})
app.register(mealsRoutes, {
  prefix: 'meals'
})
