/* eslint-disable prettier/prettier */
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'
import { afterAll, beforeAll, expect, describe, it, beforeEach } from 'vitest'

describe('Userss router', () => {
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

  it('Shoud be able to create a new user', async () => {
    const response = await request(app.server)
      .post('/users')
      .send({
        name: 'Alexandre',
        email: 'ale@hotmail.com',
      })
      .expect(201)

    const cookie = response.get('Set-Cookie')

    expect(cookie).toEqual(
      expect.arrayContaining([expect.stringContaining('sessionId')]),
    )
  })
})
