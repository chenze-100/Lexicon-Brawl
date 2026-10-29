import Response from './response'

interface IEvent {
  url: string
  userInfo: { openId: string }
  [key: string]: any
}

type Action = (this: any, event: IEvent) => any
type Controllers = Record<string, Record<string, Action>>

export default class Router {
  private map: Record<string, Action> = {}

  constructor(controllers: Controllers) {
    // 拍平：{ user: { login: fn } } -> { 'user/login': fn }
    Object.keys(controllers).forEach(contr => {
      Object.keys(controllers[contr]).forEach(action => {
        this.map[`${contr}/${action}`] = controllers[contr][action]
      })
    })
  }

  async run(event: IEvent, context: any) {
    const { url } = event
    if (!url) return Response.fail('请传入 url 参数')

    const fn = this.map[url]
    if (!fn || typeof fn !== 'function') return Response.fail('路由未找到')

    // 给 controller 方法注入 this：event、context、openId、success、fail
    const ActionThis = {
      event,
      context,
      openId: event.userInfo.openId,
      ...Response
    }
    console.log('debug: url =>', url)
    console.log('debug: event =>', event)
    return await fn.call(ActionThis, event)
  }
}
