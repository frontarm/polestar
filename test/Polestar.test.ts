import { createPolestar } from '../src'
import { testFetcher } from './fixtures'

test("evaluates code without dependencies", async () => {
  let global: any = {}

  let polestar = createPolestar({
    globals: { global }
  })

  let module = await polestar.evaluate([], `
    global.test = 1
    module.exports.test = 2
  `)

  expect(global.test).toBe(1)
  expect(module.exports.test).toBe(2)
})

test("evaluates code with nested dependencies", async () => {
  let polestar = createPolestar({
    fetcher: testFetcher,
  })
  let module = await polestar.evaluate(['cjs-with-deps'], `
    module.exports = require('cjs-with-deps')
  `)
  expect(module.exports.name).toBe('cjs-with-deps')
  expect(module.exports.areDependenciesAvailable).toBe(true)
})

test("requires modules with nested dependencies", async () => {
  let polestar = createPolestar({
    fetcher: testFetcher,
  })
  let module = await polestar.require('cjs-with-deps')
  expect(module.exports.name).toBe('cjs-with-deps')
  expect(module.exports.areDependenciesAvailable).toBe(true)
})

test("requires modules with cyclical dependencies", async () => {
  let polestar = createPolestar({
    fetcher: testFetcher,
  })
  let module = await polestar.require('cjs-cyclical')
  expect(module.exports.name).toBe('cjs-cyclical')
  expect(module.exports.areDependenciesAvailable).toBe(true)
})