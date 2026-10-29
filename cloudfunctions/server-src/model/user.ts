import Base from './base'
import { DEFAULT_USER_SELECT_BOOK_ID } from '../utils/constants'

type LoginUserInfo = any // User & { book: Book[] }

export default class UserModel extends Base {
  static $collection = 'user'

  /** 查询当前用户信息，并关联出他选中的单词书 */
  async getSelf(): Promise<LoginUserInfo | null> {
    const data = await this.model.aggregate()
      .match({ _openid: this.openid })
      .limit(1)
      .lookup({
        from: 'book',
        localField: 'bookId',
        foreignField: '_id',
        as: 'book'
      })
      .end()
    if (!data || !data.list.length) return null
    return data.list[0]
  }

  /** 新用户注册：插入一条默认记录 */
  async register(): Promise<void> {
    const userDefault = {
      _openid: this.openid,
      experience: 0,
      totalGames: 0,
      winGames: 0,
      totalTip: 0,
      avatar: '',
      nickname: '',
      config: {
        combatQuestionNumber: 15,
        pronounce: true,
        backgroundMusic: true,
        vibrate: true
      },
      learning: {
        maxScore: 0,
        bookShortName: ''
      },
      // 默认选中随机单词书
      bookId: DEFAULT_USER_SELECT_BOOK_ID
    }
    await this.model.add({ data: userDefault })
  }

  /** 切换当前用户选中的单词书 */
  async changeSelectBook(newBookId: string): Promise<boolean> {
    const { stats } = await this.model
      .where({ _openid: this.openid })
      .update({ data: { bookId: newBookId } })
    return stats.updated > 0
  }

  /** 经验值排行榜：前 20 名 + 我的名次 */
  async getExperienceRanking() {
    const rankPromise = this.model
      .where({ experience: this.command.neq(0) })
      .orderBy('experience', 'desc')
      .limit(20)
      .field({ avatar: true, nickname: true, experience: true })
      .get()

    const [user, list] = await Promise.all([this.getSelf(), rankPromise])
    const { total } = await this.model
      .where({ experience: this.command.gte(user!.experience) })
      .count()

    return {
      mine: { ...user!, index: total },
      list: list.data.map((item: any, index: number) => ({ ...item, index: index + 1 }))
    }
  }

  /** 每日词汇最高分排行榜：逻辑同上 */
  async getLearningRanking() {
    const rankPromise = this.model
      .where({ learning: { maxScore: this.command.neq(0) } })
      .orderBy('learning.maxScore', 'desc')
      .limit(20)
      .field({ avatar: true, nickname: true, learning: true })
      .get()

    const [user, list] = await Promise.all([this.getSelf(), rankPromise])
    const { total } = await this.model
      .where({ 'learning.maxScore': this.command.gte(user!.learning.maxScore) })
      .count()

    return {
      mine: { avatar: user!.avatar, nickname: user!.nickname, learning: user!.learning, index: total },
      list: list.data.map((item: any, index: number) => ({ ...item, index: index + 1 }))
    }
  }
}
