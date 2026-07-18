import { createPatch, applyPatch } from 'diff';

/**
 * Creates a unified diff between original and modified code.
 * @param {string} filename File name for headers
 * @param {string} originalCode Original source code
 * @param {string} modifiedCode Modified source code
 * @returns {string} Unified diff patch
 */
export function createUnifiedDiff(filename, originalCode, modifiedCode) {
  return createPatch(filename, originalCode, modifiedCode, 'a/' + filename, 'b/' + filename);
}

/**
 * Applies a unified diff patch to the original code.
 * @param {string} originalCode Original source code
 * @param {string} diffPatch Unified diff patch string
 * @returns {string|boolean} Modified code, or false if the patch failed to apply
 */
export function applyUnifiedDiff(originalCode, diffPatch) {
  const result = applyPatch(originalCode, diffPatch);
  return result === false ? null : result;
}
