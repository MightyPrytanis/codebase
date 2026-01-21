export function processFile(file: File) {
  // Simulate async processing
  return new Promise(resolve => setTimeout(() => resolve("processed: " + file.name), 1000));
