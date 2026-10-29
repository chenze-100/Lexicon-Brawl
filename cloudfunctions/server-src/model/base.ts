import cloud from 'wx-server-sdk'

export default class Base {
  protected collection: string
  protected openid: string

  constructor(Model: typeof Base) {
    if (typeof (Model as any).$collection !== 'string') {
      throw Error('Model 需要增加 $collection 静态属性，用于绑定集合名称')
    }
    this.collection = (Model as any).$collection
    this.openid = cloud.getWXContext().OPENID
  }

  static $collection: string

  /** 当前集合的操作句柄（每次实时获取，保证环境正确） */
  protected get model() {
    return cloud.database().collection(this.collection)
  }

  /** 数据库操作符，如 inc、gt、neq */
  protected get command() {
    return cloud.database().command
  }
}
