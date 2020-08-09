interface GenericCallback {
  (err?: Error, result?): void
}

interface LooseObject {
  [key: string]: any
}
