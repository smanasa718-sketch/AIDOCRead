import type { ParsedPath } from './parse';
/**
 * Converts path to fully qualified representation.
 *
 * @param namespaceMap namespace map
 * @param currentNamespace namespace
 * @param path path
 * @returns fully qualified path string
 */
export declare function toFullyQualifiedPath(namespaceMap: {
    [aliasOrNamespace: string]: string;
}, currentNamespace: string, path: ParsedPath): string;
//# sourceMappingURL=normalization.d.ts.map