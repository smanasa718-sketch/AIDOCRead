import type { Element, TextNode, Target, FormatterOptions, ElementName, AttributeName, TargetPath } from '@sap-ux/odata-annotation-core';
/**
 * Kind of target which is annotated
 * - describes expected CDS syntax, i.e. where to be deleted annotation is contained
 * - does not distinguish between annotation before or after element (or parameter)
 */
export declare const enum PrintPattern {
    artifact = "artifact",// annotate <topLevelArtifact> with <annotations>
    element = "element",// annotate <entity> with { <element> <annotation>}
    parameter = "parameter",// annotate <unboundAction> with ( <parameter> <annotation> )
    boundAction = "boundAction",// annotate <entity> with actions { <action> <annotation> }
    boundParameter = "boundParameter"
}
/**
 * Get print pattern based on (EDMX) target path.
 *
 * @param targetPath - i.e. for bound action: AdminService.addRating(AdminService.Books).
 * @returns object containing root element name, bound action and function names, print pattern and child segments.
 */
export declare const resolveTarget: (targetPath: TargetPath) => {
    rootElementName: string;
    boundActionFunctionName: string;
    printPattern: PrintPattern;
    childSegments: string[];
};
export declare const printTarget: (target: Target, complexTypePathSegments?: string[]) => string;
export interface PrintOptions {
    indentResult: boolean;
    /**
     * Used to build prefix for annotation terms on annotations and record properties.
     */
    annotationContext: Element[];
}
export declare const print: (node: Element | TextNode | (Element | TextNode)[], formatterOptions?: FormatterOptions, printOptions?: Partial<PrintOptions>) => string;
export declare const printCsdlNode: (node: Element | TextNode, context: Element[], options: FormatterOptions) => string;
/**
 * Flatten OData structure into a CDS key.
 *
 * @param context - Annotation elements
 * @returns The key string
 */
export declare const printKey: (context: Element[]) => string;
export declare const printPrimitiveValue: (expressionName: ElementName | AttributeName, expressionValue: string) => string;
//# sourceMappingURL=csdl-to-cds.d.ts.map