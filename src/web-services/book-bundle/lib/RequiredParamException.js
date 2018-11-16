import { RunTimeException } from './RunTimeException'

export class RequiredParamException extends RunTimeException {
  constructor (...params) {
    super(...params)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function requiredParam (param) {
  throw new RequiredParamException(`Required parameter, "${param}" is mandatory.`)
}
