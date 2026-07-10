const GENERATED_EVALUATOR_PHOTO_NAME_PATTERNS = [
  /^evaluator-\d+\.png$/i,
  /^generated-evaluator-avatar-\d+\.png$/i,
];

export function buildGeneratedEvaluatorPhotoName(rowNumber: number) {
  return `generated-evaluator-avatar-${rowNumber}.png`;
}

export function isGeneratedEvaluatorPhotoName(fileName: string) {
  const normalizedFileName = fileName.trim();

  if (!normalizedFileName) {
    return false;
  }

  return GENERATED_EVALUATOR_PHOTO_NAME_PATTERNS.some((pattern) =>
    pattern.test(normalizedFileName),
  );
}
