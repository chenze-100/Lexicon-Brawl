type IActionThis = {
  success: <T>(data: T) => { state: 0; data: T }
  fail: (data: string) => { state: -1; data: string }
  openId: string
  event: any
  context: any
}

/**
 * 控制器包装函数：原样返回 actions 对象。
 * 主要价值是给 this 提供类型（this 上有 success/fail/openId，由 Router 注入）
 */
function BaseController<T>(actions: T & ThisType<IActionThis>): T {
  return actions
}

export default BaseController
