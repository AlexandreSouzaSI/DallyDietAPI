/* eslint-disable prettier/prettier */
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'
import { afterAll, beforeAll, expect, describe, it, beforeEach } from 'vitest'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Alexandre M', email: 'alex@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Pizza',
        description: "A melhor pizza",
        isOnDiet: false,
        date: new Date(),
      })
      .expect(201)
  })

  it('should be able to list all meals from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Alexandre M', email: 'alex@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Salada',
        description: "Comida fitnes",
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Brocolis',
        description: "Arvore",
        isOnDiet: true,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    expect(mealsResponse.body.meals).toHaveLength(2)

    // This validate if the order is correct
    expect(mealsResponse.body.meals[0].name).toBe('Brocolis')
    expect(mealsResponse.body.meals[1].name).toBe('Salada')
  })

  it('should be able to show a single meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Alexandre M S', email: 'alexms@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Hamburguer',
        description: "triplo bacon",
        isOnDiet: false,
        date: new Date(),
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    expect(mealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Hamburguer',
        description: "triplo bacon",
        isOnDiet: 0,
        date: expect.any(Number),
      }),
    })
  })

  it('should be able to update a meal from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Alexandre', email: 'alex@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Legumes',
        description: "Legumes saudaveis",
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Pipoca',
        description: "Pipoca com manteiga",
        isOnDiet: true,
        date: new Date(),
      })
      .expect(204)
  })

  it('should be able to delete a meal from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Alexandre', email: 'alex@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Panqueca',
        description: "panqueca",
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(204)
  })

  it('should be able to get metrics from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Alexandre M', email: 'alex@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Limonada',
        description: "Refrescante",
        isOnDiet: true,
        date: new Date('2021-01-01T08:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'MilkShake',
        description: "De Chocolate",
        isOnDiet: false,
        date: new Date('2021-01-01T12:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Tomate',
        description: "salada",
        isOnDiet: true,
        date: new Date('2021-01-01T15:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Alface',
        description: "Complemento da salada",
        isOnDiet: true,
        date: new Date('2021-01-01T20:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Ovos',
        description: "proteina",
        isOnDiet: true,
        date: new Date('2021-01-02T08:00:00'),
      })

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 5,
      totalMealsOnDiet: 4,
      totalMealsOffDiet: 1,
      bestOnDietSequence: 3,
    })
  })
})