export type UnknownRecord = Record<string, unknown>;

// @lat: [[architecture#Runtime Data Validation]]
export function parseJsonUnknown(text: string): unknown {
  return JSON.parse(text) as unknown;
}

export function asUnknownRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

export function asUnknownRecordArray(value: unknown): UnknownRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => asUnknownRecord(entry))
    .filter((entry): entry is UnknownRecord => entry !== null);
}

function isCompatibleSavedValue(defaultValue: unknown, savedValue: unknown): boolean {
  if (Array.isArray(defaultValue)) {
    if (!Array.isArray(savedValue)) {
      return false;
    }
    const defaultItems = defaultValue as unknown[];
    const savedItems = savedValue as unknown[];
    const exemplar = defaultItems[0];
    if (exemplar === undefined) {
      return true;
    }
    const exemplarRecord = asUnknownRecord(exemplar);
    if (!exemplarRecord) {
      return savedItems.every((entry) => isCompatibleSavedValue(exemplar, entry));
    }
    return savedItems.every((entry) => {
      const entryRecord = asUnknownRecord(entry);
      if (!entryRecord) {
        return false;
      }
      return Object.entries(exemplarRecord).every(([key, nestedDefault]) => (
        key in entryRecord && isCompatibleSavedValue(nestedDefault, entryRecord[key])
      ));
    });
  }

  const defaultRecord = asUnknownRecord(defaultValue);
  if (defaultRecord) {
    const savedRecord = asUnknownRecord(savedValue);
    if (!savedRecord) {
      return false;
    }
    const defaultEntries = Object.entries(defaultRecord);
    if (defaultEntries.length === 0) {
      return true;
    }
    const exemplar = defaultEntries[0][1];
    const isDynamicRecord = defaultEntries.every(([, value]) => asUnknownRecord(value) !== null);
    if (isDynamicRecord) {
      return Object.values(savedRecord).every((value) => isCompatibleSavedValue(exemplar, value));
    }
    return defaultEntries.every(([key, nestedDefault]) => (
      key in savedRecord && isCompatibleSavedValue(nestedDefault, savedRecord[key])
    ));
  }

  if (defaultValue === null) {
    return savedValue === null;
  }
  return typeof savedValue === typeof defaultValue;
}

export function mergeCompatibleSettings<T extends object>(defaults: T, savedValue: unknown): T {
  const saved = asUnknownRecord(savedValue);
  if (!saved) {
    return { ...defaults };
  }

  const defaultRecord = defaults as UnknownRecord;
  const result: UnknownRecord = { ...defaultRecord };
  for (const [key, value] of Object.entries(saved)) {
    if (
      Object.prototype.hasOwnProperty.call(defaultRecord, key)
      && isCompatibleSavedValue(defaultRecord[key], value)
    ) {
      result[key] = value;
    }
  }
  return result as T;
}
