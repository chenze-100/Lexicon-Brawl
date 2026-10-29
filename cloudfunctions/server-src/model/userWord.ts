import Base from './base'

export default class UserWordModel extends Base {
  static $collection = 'userWord'

  /** 分页查询我的生词，并关联出 word 集合里的单词详情 */
  async getMyList<T = any>(page: number, size: number): Promise<T[]> {
    const { list } = await this.model.aggregate()
      .match({ _openid: this.openid })
      .sort({ timestamp: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lookup({
        from: 'word',
        localField: 'wordId',
        foreignField: '_id',
        as: 'words'
      })
      .unwind('$words')
      .replaceRoot({
        newRoot: this.command.aggregate.mergeObjects(['$words', { _id: '$$ROOT._id' }])
      })
      .end()
    return list
  }

  /** 我的生词总数 */
  async getMyTotal(): Promise<number> {
    const { total } = await this.model.where({ _openid: this.openid }).count()
    return total
  }

  /** 清空我的全部生词 */
  async deleteAll() {
    return await this.model.where({ _openid: this.openid }).remove()
  }
}
