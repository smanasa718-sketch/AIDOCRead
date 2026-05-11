import type { Token, TokenV6 } from '@sap/cds-compiler-types';
export declare function findTokenByPosition(tokens: readonly TokenV6[] | readonly Token[], line: number, column: number): TokenV6 | Token | undefined;
export declare function getTokenLocation(token: Token | TokenV6, text?: string): {
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
};
export declare function isOldToken(token: Token | TokenV6): token is Token;
//# sourceMappingURL=tokenStream.d.ts.map