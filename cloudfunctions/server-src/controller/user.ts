import BaseController from './base'
import UserModel from '../model/user'
import BookModel from '../model/book'
import UserWordModel from '../model/userWord'
import { DEFAULT_USER_SELECT_BOOK_ID } from '../utils/constants'

interface IChangeSelectBookEvent {
  newSelectBookId: string
  oldSelectBookId?: string
}

const UserController = BaseController({
  /** user/login —— 登录（不存在则自动注册） */
  async login() {
    const user = new UserModel()
    let self = await user.getSelf()

    if (!self) {
      await user.register()
      // NOTE: 新用户注册后，默认选择的单词书选择人数 + 1
      const book = new BookModel()
      void book.changeSelectBook(DEFAULT_USER_SELECT_BOOK_ID)
      self = await user.getSelf()
    }

    if (!self) return this.fail('获取用户信息失败，请稍后重试 ~')
    return this.success(self)
  },

  /** user/changeSelectBook —— 切换单词书 */
  async changeSelectBook({ newSelectBookId, oldSelectBookId }: IChangeSelectBookEvent) {
    if (!newSelectBookId) return this.fail('获取新的单词书 id 失败')

    const book = new BookModel()
    const hasBook = await book.exist(newSelectBookId)
    if (!hasBook) return this.fail('获取单词书信息失败')

    const user = new UserModel()
    const changed = await user.changeSelectBook(newSelectBookId)
    if (changed) {
      await book.changeSelectBook(newSelectBookId, oldSelectBookId)
      return this.success('更新单词书成功')
    }
    return this.fail('更新单词书失败，请重试')
  },

  /** user/getReviewList —— 分页获取生词本 */
  async getReviewList({ page }: { page: number }) {
    const pageSize = 20
    try {
      const userWord = new UserWordModel()
      const [list, total] = await Promise.all([
        userWord.getMyList(page, pageSize),
        userWord.getMyTotal()
      ])
      const totalPage = Math.ceil(total / pageSize)
      const nextPage = page + 1
      return this.success({
        list,
        nextPage: nextPage <= totalPage ? nextPage : null
      })
    } catch (error) {
      console.log('生词本获取失败')
      console.log(error)
      return this.fail('生词本获取失败，请稍后重试')
    }
  },

  /** user/getRanking —— 排行榜（type: experience | learning） */
  async getRanking({ type }: { type: 'experience' | 'learning' }) {
    const user = new UserModel()
    try {
      if (type === 'experience') {
        const data = await user.getExperienceRanking()
        return this.success(data)
      }
      if (type === 'learning') {
        const data = await user.getLearningRanking()
        return this.success(data)
      }
      throw new Error('未设置排名类型')
    } catch (error) {
      console.log('获取排行榜失败 ↓')
      console.log(error)
      return this.fail('获取排行榜失败, 请稍后重试')
    }
  },

  /** user/clearUserWords —— 清空生词本 */
  async clearUserWords() {
    try {
      const userWord = new UserWordModel()
      await userWord.deleteAll()
      return this.success(true)
    } catch (error) {
      console.log('生词清空失败')
      return this.fail('生词清空失败，请稍后重试')
    }
  }
})

export default UserController
