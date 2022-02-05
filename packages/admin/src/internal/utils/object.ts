export const extractKeys = Object.keys as <T>(o: T) => Extract<keyof T, string>[];
