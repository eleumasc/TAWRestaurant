export function enumHasValue(e: object, v: any): boolean {
  return Object.getOwnPropertyNames(e).some(k => v === e[k]);
}
