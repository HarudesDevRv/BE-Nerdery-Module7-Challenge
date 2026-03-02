export interface FieldMapConfig<TSelect> {
  // Always fetched (auth keys, DataLoader correlation keys)
  mandatory: Partial<Record<keyof TSelect, true>>;

  // GQL field name → one or more Prisma select entries
  // Handles both scalars and relation-derived fields
  fieldMap: Record<string, Partial<Record<keyof TSelect, unknown>>>;

  // @ResolveField fields — skip entirely (DataLoader handles them)
  resolveFields: Set<string>;
}

function deepMergeInto(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  for (const key of Object.keys(source)) {
    const src = source[key];
    const tgt = target[key];
    if (
      src !== null &&
      typeof src === 'object' &&
      !Array.isArray(src) &&
      tgt !== null &&
      typeof tgt === 'object' &&
      !Array.isArray(tgt)
    ) {
      deepMergeInto(
        tgt as Record<string, unknown>,
        src as Record<string, unknown>,
      );
    } else {
      target[key] = src;
    }
  }
}

export function buildSelect<TSelect>(
  requestedFields: string[],
  config: FieldMapConfig<TSelect>,
): Partial<Record<keyof TSelect, unknown>> {
  const select = { ...config.mandatory } as Record<string, unknown>;

  for (const field of requestedFields) {
    if (config.resolveFields.has(field)) continue;
    const mapping = config.fieldMap[field];
    if (mapping) deepMergeInto(select, mapping as Record<string, unknown>);
  }

  return select as Partial<Record<keyof TSelect, unknown>>;
}
