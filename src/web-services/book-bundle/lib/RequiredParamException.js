const { RunTimeException } = require('./RunTimeException')

class RequiredParamException extends RunTimeException {
  constructor (...params) {
    super(...params)
    Error.captureStackTrace(this, this.constructor)
  }
}

function required (param) {
  throw new RequiredParamException(`Required parameter, "${param}" is mandatory.`)
}

module.exports = {
  required
}