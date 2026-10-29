import cloud from 'wx-server-sdk'
import UserController from './controller/user'
import Router from './utils/Router'

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

export const main = async (event: any, context: any) => {
  const controllers = { user: UserController }
  const router = new Router(controllers)
  return await router.run(event, context)
}
