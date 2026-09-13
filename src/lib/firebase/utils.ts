/**
 * Recursively cleans an object for Firestore by removing any keys with `undefined` values.
 * Also flattens any nested arrays, since Firestore throws an error if an array contains another array.
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    // If this array contains any nested arrays, flatten it completely
    const hasNested = data.some((item) => Array.isArray(item));
    if (hasNested) {
      return (data as any[]).flat(Infinity).map((item) => cleanFirestoreData(item)) as any;
    }
    return data.map((item) => cleanFirestoreData(item)) as any;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (Array.isArray(value) && value.some((v) => Array.isArray(v))) {
          cleaned[key] = (value as any[]).flat(Infinity).map((v) => cleanFirestoreData(v));
        } else {
          cleaned[key] = cleanFirestoreData(value);
        }
      }
    }
    return cleaned as any;
  }
  return data;
}
