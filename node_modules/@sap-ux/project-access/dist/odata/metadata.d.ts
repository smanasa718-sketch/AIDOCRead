import type { EntitySet } from '@sap-ux/vocabularies-types';
/**
 * Finds the RecursiveHierarchy annotation key for the given entity set.
 * This is a helper function that both existence check and qualifier extraction can use.
 *
 * @param entitySet The entity set to check for recursive hierarchy annotation.
 * @returns The RecursiveHierarchy key if found, undefined otherwise.
 */
export declare function findRecursiveHierarchyKey(entitySet: EntitySet): string | undefined;
/**
 * Determines table capabilities for a given entity set, analyzing its transformations and hierarchy.
 *
 * @param entitySet The entity set for which capabilities are being evaluated.
 * @param requiredTransformations An optional array of required transformation names to be considered.
 * @returns An object containing flags for aggregate transformations and recursive hierarchy specific to the entity set:
 * - `hasAggregateTransformations`: Indicates if aggregate transformations are present in general.
 * - `hasAggregateTransformationsForEntitySet`: Indicates if aggregate transformations are applicable to the specific entity set.
 * - `hasRecursiveHierarchyForEntitySet`: Indicates if a recursive hierarchy is present for the specific entity set.
 */
export declare function getTableCapabilitiesByEntitySet(entitySet: EntitySet, requiredTransformations?: readonly string[]): {
    hasAggregateTransformations: boolean;
    hasAggregateTransformationsForEntitySet: boolean;
    hasRecursiveHierarchyForEntitySet: boolean;
};
//# sourceMappingURL=metadata.d.ts.map