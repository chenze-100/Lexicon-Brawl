interface IResponse<T = any> {
  state: 0 | -1
  data: T
}

const success = <T = any>(data: T): IResponse<T> => ({ state: 0, data })
const fail = (data: string): IResponse<string> => ({ state: -1, data })

const Response = { success, fail }
export default Response
