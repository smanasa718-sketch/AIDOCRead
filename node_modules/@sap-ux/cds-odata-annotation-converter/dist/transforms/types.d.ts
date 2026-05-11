import type { Position, Range, Element, ExtendedDiagnostic } from '@sap-ux/odata-annotation-core';
import type { VocabularyService } from '@sap-ux/odata-vocabularies';
export interface ToTermsOptions {
    record?: {
        type?: string;
    };
    term?: {
        type?: string;
    };
    group?: {
        name?: string;
    };
    position?: Position;
    valueType?: string;
    isCollection?: boolean;
    propName?: string;
    vocabularyService: VocabularyService;
    embededAnnotationsContext?: boolean;
    constraints?: {
        openPropertyTypeConstraints?: string[];
    };
}
export interface Reference {
    /**
     * Range of the reference.
     */
    range: Range;
    path: string;
}
export type VisitorReturnValue = {
    nodes: Element[];
    path: (string | number)[];
    nodeRange?: Range;
    pathSet?: Set<string>;
    references?: Reference[];
    diagnostics?: ExtendedDiagnostic[];
};
//# sourceMappingURL=types.d.ts.map