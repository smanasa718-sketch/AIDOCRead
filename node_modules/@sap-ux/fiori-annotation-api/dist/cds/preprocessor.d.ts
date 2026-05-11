import type { Element } from '@sap-ux/odata-annotation-core-types';
import type { CDSDocumentChange } from './change';
import { type AstNode, type CDSDocument } from './document';
import type { CompilerToken } from './cds-compiler-tokens';
/**
 * Prepares changes so that they can be processed sequentially without interfering with each other.
 * This includes removing duplicates, merging deletions etc.
 *
 * @param document - CDS document.
 * @param changes - CDS document changes.
 * @param tokens - All tokens in the document.
 * @returns Optimized CDS document changes.
 */
export declare function preprocessChanges(document: CDSDocument, changes: CDSDocumentChange[], tokens: CompilerToken[]): CDSDocumentChange[];
/**
 * Creates a reference element used for building flattened annotation keys.
 *
 * @param astNode - AST node to be converted to a reference element.
 * @returns Reference element.
 */
export declare function createReferenceElement(astNode?: AstNode): Element | undefined;
//# sourceMappingURL=preprocessor.d.ts.map