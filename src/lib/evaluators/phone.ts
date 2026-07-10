function scientificNotationToPlainDigits(value: string) {
  const match = value.trim().match(/^([+-]?)(\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);

  if (!match) {
    return value.trim();
  }

  const [, sign, coefficient, exponentText] = match;
  const exponent = Number.parseInt(exponentText, 10);

  if (!Number.isFinite(exponent)) {
    return value.trim();
  }

  const [wholePart, fractionalPart = ""] = coefficient.split(".");
  const digits = `${wholePart}${fractionalPart}`.replace(/^0+(?=\d)/, "") || "0";
  const decimalIndex = wholePart.length + exponent;

  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(Math.abs(decimalIndex))}${digits}`;
  }

  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }

  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

export function normalizePhoneNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const withoutLeadingQuote = trimmedValue.replace(/^'+/, "");
  const withoutWhitespace = withoutLeadingQuote.replace(/\s+/g, "");
  const normalizedScientificValue = scientificNotationToPlainDigits(withoutWhitespace);

  if (!normalizedScientificValue.includes(".")) {
    return normalizedScientificValue;
  }

  return normalizedScientificValue.replace(/\.0+$/, "");
}

export function formatPhoneNumberForDisplay(value: string) {
  return normalizePhoneNumber(value);
}
