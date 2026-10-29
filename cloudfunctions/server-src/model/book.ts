import Base from './base'

export default class BookModel extends Base {
  static $collection = 'book'

  /** 判断某本书是否存在 */
  async exist(bookId: string): Promise<boolean> {
    const { total } = await this.model.where({ _id: bookId }).count()
    return total > 0
  }

  /** 切换选中的书：新书人数 +1，旧书人数 -1 */
  async changeSelectBook(newSelectBookId: string, oldSelectBookId?: string): Promise<void> {
    if (newSelectBookId === oldSelectBookId) return

    await this.model
      .where({ _id: newSelectBookId })
      .update({ data: { peopleNumber: this.command.inc(1) } })

    if (oldSelectBookId) {
      await this.model
        .where({ _id: oldSelectBookId, peopleNumber: this.command.gt(0) })
        .update({ data: { peopleNumber: this.command.inc(-1) } })
    }
  }
}
