import { z } from "zod";

/**
 * Minimal Zod-to-JSON-schema converter covering the shapes used by our tool
 * input schemas (objects, strings, numbers, enums, arrays, optionals). This
 * avoids adding an extra dependency for a small, well-scoped need.
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  return toSchema(schema);
}

function toSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = toSchema(value);
      if (!isOptional(value)) required.push(key);
    }
    return {
      type: "object",
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    };
  }
  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }
  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }
  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }
  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: schema.options as string[] };
  }
  if (schema instanceof z.ZodArray) {
    return { type: "array", items: toSchema(schema.element) };
  }
  if (schema instanceof z.ZodOptional) {
    return toSchema(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return toSchema(schema._def.innerType);
  }
  if (schema instanceof z.ZodEffects) {
    return toSchema(schema.innerType());
  }
  return {};
}

function isOptional(schema: z.ZodTypeAny): boolean {
  return (
    schema instanceof z.ZodOptional || schema instanceof z.ZodDefault
  );
}
