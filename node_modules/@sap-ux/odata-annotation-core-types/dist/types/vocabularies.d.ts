/**
 * All types representing vocabulary objects should go here
 * (expected: one type per $Kind)
 *
 * Vocabularies will be imported from their json format
 *  described here: (https://docs.oasis-open.org/odata/odata-csdl-json/v4.01/odata-csdl-json-v4.01.html)
 *
 * Typescript types should represent at minimum those features of a vocabulary object that are used in
 * annotation-modeler core or annotation modeler APIs
 */
import type { FullyQualifiedName, FullyQualifiedTypeName } from '../specification';
/**
 * Constraints can be provided via Annotations on terms or properties
 * (commented out terms have been considered but discarded)
 */
export interface Constraints {
    allowedValues?: AllowedValues[];
    openPropertyTypeConstraints?: FullyQualifiedTypeName[];
    allowedTerms?: FullyQualifiedTypeName[];
    applicableTerms?: FullyQualifiedTypeName[];
    derivedTypeConstraints?: FullyQualifiedTypeName[];
    isLanguageDependent?: boolean;
    requiresType?: FullyQualifiedName;
}
export interface AllowedValues {
    value: any;
    description: string;
    longDescription: string;
}
//# sourceMappingURL=vocabularies.d.ts.map