/**
 * Read `items[index]` in a spec, failing loudly when the slot is empty.
 * Negative indexes count from the end, like `Array.prototype.at`. Prefer this
 * over `?.` in assertions — optional chaining would turn a missing element
 * into a vacuous `undefined` comparison instead of a test failure.
 */
export const nth = <T>(items: ArrayLike<T>, index: number): T => {
  const item = items[index < 0 ? items.length + index : index]
  if (item === undefined) throw new Error(`Expected an item at index ${index} (length ${items.length})`)
  return item
}
