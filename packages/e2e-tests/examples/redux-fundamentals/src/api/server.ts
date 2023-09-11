/* eslint-disable no-unused-vars */

import { rest } from 'msw'
import { setupWorker } from 'msw'
// @ts-ignore
import seedrandom from 'seedrandom'

// Set up a seeded random number generator, so that we get
// a consistent set of users / entries each time the page loads.
// This can be reset by deleting this localStorage value,
// or turned off by setting `useSeededRNG` to false.
let useSeededRNG = false

let rng = seedrandom()

if (useSeededRNG) {
  let randomSeedString = localStorage.getItem('randomTimestampSeed')
  let seedDate

  if (randomSeedString) {
    seedDate = new Date(randomSeedString)
  } else {
    seedDate = new Date()
    randomSeedString = seedDate.toISOString()
    localStorage.setItem('randomTimestampSeed', randomSeedString)
  }

  rng = seedrandom(randomSeedString)
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(rng() * (max - min + 1)) + min
}

const randomFromArray = <T>(array: T[]) => {
  const index = getRandomInt(0, array.length - 1)
  return array[index]
}

const todoTemplates = [
  { base: 'Buy $THING', values: ['milk', 'bread', 'cheese', 'toys'] },
  { base: 'Clean $THING', values: ['house', 'yard', 'bedroom', 'car'] },
  { base: 'Read $THING', values: ['newspaper', 'book', 'email'] },
]

interface Todo {
  id: number
  text: string
  completed: boolean
  color: string
}

const generateTodoText = () => {
  const template = randomFromArray(todoTemplates)
  const value = randomFromArray(template.values)
  const text = template.base.replace('$THING', value)
  return text
}

let nextId = 0

let todos: Todo[] = Array.from({ length: 5 }).map((_, index) => ({
  id: nextId++,
  text: generateTodoText(),
  completed: false,
  color: '',
}))

export const handlers = [
  rest.get('/fakeApi/todos', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(todos))
  }),

  rest.post('/fakeApi/todos', async (req, res, ctx) => {
    const body = await req.json()

    if (body.text === 'error') {
      throw new Error('Could not save the todo!')
    }

    const todo: Todo = { ...body, id: nextId++ }
    todos.push(todo)
    return res(ctx.status(200), ctx.json(todo))
  }),
]

export const worker = setupWorker(...handlers)
