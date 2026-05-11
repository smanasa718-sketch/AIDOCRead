import type { Position } from '@sap-ux/odata-annotation-core';
import { Range } from '@sap-ux/odata-annotation-core';
export interface Token {
    readonly type: number;
    readonly text: string;
    /**
     * line number, 1-based
     */
    readonly line: number;
    /**
     * column number, 0-based
     */
    readonly column: number;
    readonly tokenIndex: number;
    readonly isIdentifier?: string;
}
export interface TokenV6 {
    readonly type: string;
    readonly text: string;
    readonly location: {
        readonly line: number;
        readonly col: number;
        readonly endLine: number;
        readonly endCol: number;
        readonly file: string;
    };
    readonly tokenIndex: number;
    readonly parsedAs: 'keyword' | 'global' | 'UsingAlias';
    readonly keyword: string;
    readonly isIdentifier?: string;
}
export type CompilerToken = Token | TokenV6;
/**
 * Finds last matching token before a certain position.
 *
 * @param pattern - Regular expression to which the token text should match. If omitted, then will match any token.
 * @param tokens - All tokens in the document.
 * @param position - Position before which the token should be.
 * @returns Last token before the given position.
 */
export declare function findLastTokenBeforePosition(pattern: RegExp | undefined, tokens: CompilerToken[], position: Position): CompilerToken | undefined;
/**
 * Finds first matched token after a certain position.
 *
 * @param pattern - Regular expression to which the token text should match. If omitted, then will match any token.
 * @param tokens - All tokens in the document.
 * @param position - Position after which the token should be.
 * @returns First matched token after the given position.
 */
export declare function findFirstTokenAfterPosition(pattern: RegExp | undefined, tokens: CompilerToken[], position: Position): CompilerToken | undefined;
/**
 * Checks if token is after a certain position in the file.
 *
 * @param token - All tokens in the document.
 * @param position - Position after which the token should be.
 * @returns - True if token is after the give position.
 */
export declare function isTokenAfterPosition(token: CompilerToken, position: Position): boolean;
/**
 *  Checks token structure.
 *
 * @param token - Token to check
 * @returns True if token is of pre compiler v6 structure.
 */
export declare function isOldToken(token: Token | TokenV6): token is Token;
/**
 * Returns a function that checks if tokens position starts at the given position.
 *
 * @param start - Matching token start position.
 * @returns True if token starts at the given position.
 */
export declare function matchTokenByStart(start: Position): (token: CompilerToken) => boolean;
/**
 * Creates a range from the given token.
 *
 * @param token - Token to create range from.
 * @returns Token range.
 */
export declare function createTokenRange(token: CompilerToken): Range;
/**
 * Get token column.
 *
 * @param token - Token.
 * @returns column number.
 */
export declare function tokenColumn(token: CompilerToken): number;
/**
 * Get token line.
 *
 * @param token - Token.
 * @returns line number.
 */
export declare function tokenLine(token: CompilerToken): number;
//# sourceMappingURL=cds-compiler-tokens.d.ts.map