/* eslint-disable prettier/prettier */
import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const createMealSchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isOnDiet, date } = createMealSchema.parse(
        request.body,
      )

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        isOnDiet,
        date: date.getTime(),
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      return reply.send({ meals })
    },
  )

  app.get(
    '/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramsSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramsSchema.parse(request.params)

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      return reply.send({ meal })
    },
  )

  app.put('/:mealId', 
    {
        preHandler: [checkSessionIdExists]
    },
    async (request, reply) => {
        const paramsSchema = z.object({
            mealId: z.string().uuid()
        })

        const { mealId } = paramsSchema.parse(request.params)

        const updateMealSchema = z.object({
            name: z.string(),
            description: z.string(),
            isOnDiet: z.boolean(),
            date: z.coerce.date(),
        })

        const {name, description, isOnDiet, date } = updateMealSchema.parse(request.body)
        
        const meal = await knex('meals').where({ id: mealId }).first()

        if (!meal) {
            return reply.status(404).send({ error: 'Meal not found'})
        }

        await knex('meals').where({ id: mealId }).update({
            name,
            description,
            isOnDiet,
            date: date.getTime()
        })

        return reply.status(204).send()
    }
  )

  app.delete(
    '/:mealId',
    { 
        preHandler: [checkSessionIdExists] 
    },
    async (request, reply) => {
      const paramsSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramsSchema.parse(request.params)

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id: mealId }).delete()

      return reply.status(204).send()
    },
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const totalMealsOnDiet = await knex('meals')
        .where({ user_id: request.user?.id, isOnDiet: true })
        .count('id', { as: 'total' })
        .first()

      const totalMealsOffDiet = await knex('meals')
        .where({ user_id: request.user?.id, isOnDiet: false })
        .count('id', { as: 'total' })
        .first()

      const totalMeals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.isOnDiet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalMeals.length,
        totalMealsOnDiet: totalMealsOnDiet?.total,
        totalMealsOffDiet: totalMealsOffDiet?.total,
        bestOnDietSequence,
      })
    },
  )
}
