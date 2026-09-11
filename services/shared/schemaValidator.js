const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const SCHEMAS_DIR = path.join(__dirname, '..', '..', 'schemas');
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const compiledCache = new Map();

/**
 * Loads and compiles a schema by filename (e.g. "flight.disrupted.v1.schema.json")
 * from the repo-level schemas/ directory — the single source of truth for event shapes.
 */
function getValidator(schemaFileName) {
  if (compiledCache.has(schemaFileName)) {
    return compiledCache.get(schemaFileName);
  }
  const schemaPath = path.join(SCHEMAS_DIR, schemaFileName);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);
  compiledCache.set(schemaFileName, validate);
  return validate;
}

/**
 * Validates a payload against a named schema. Throws with the Ajv error details
 * on failure so callers can route the message to a dead-letter topic (see ADR 0001).
 */
function assertValid(schemaFileName, payload) {
  const validate = getValidator(schemaFileName);
  const valid = validate(payload);
  if (!valid) {
    const err = new Error(`Schema validation failed for ${schemaFileName}`);
    err.validationErrors = validate.errors;
    throw err;
  }
  return payload;
}

module.exports = { getValidator, assertValid };
