"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLastTokenBeforePosition = findLastTokenBeforePosition;
exports.findFirstTokenAfterPosition = findFirstTokenAfterPosition;
exports.isTokenAfterPosition = isTokenAfterPosition;
exports.isOldToken = isOldToken;
exports.matchTokenByStart = matchTokenByStart;
exports.createTokenRange = createTokenRange;
exports.tokenColumn = tokenColumn;
exports.tokenLine = tokenLine;
const odata_annotation_core_1 = require("@sap-ux/odata-annotation-core");
/**
 * Finds last matching token before a certain position.
 *
 * @param pattern - Regular expression to which the token text should match. If omitted, then will match any token.
 * @param tokens - All tokens in the document.
 * @param position - Position before which the token should be.
 * @returns Last token before the given position.
 */
function findLastTokenBeforePosition(pattern, tokens, position) {
    let matchedToken;
    for (const token of tokens) {
        if (isTokenAfterPosition(token, position)) {
            return matchedToken;
        }
        if (!pattern || pattern.test(token.text)) {
            matchedToken = token;
        }
    }
    return undefined;
}
/**
 * Finds first matched token after a certain position.
 *
 * @param pattern - Regular expression to which the token text should match. If omitted, then will match any token.
 * @param tokens - All tokens in the document.
 * @param position - Position after which the token should be.
 * @returns First matched token after the given position.
 */
function findFirstTokenAfterPosition(pattern, tokens, position) {
    for (const token of tokens) {
        if (isTokenAfterPosition(token, position) && (!pattern || pattern.test(token.text))) {
            return token;
        }
    }
    return undefined;
}
/**
 * Checks if token is after a certain position in the file.
 *
 * @param token - All tokens in the document.
 * @param position - Position after which the token should be.
 * @returns - True if token is after the give position.
 */
function isTokenAfterPosition(token, position) {
    if (isOldToken(token)) {
        const line = token.line - 1; // line is 1 based in Token, but 0 based in Range
        if (line > position.line) {
            return true;
        }
        return line === position.line && token.column >= position.character;
    }
    const line = token.location.line - 1; // line is 1 based in Token, but 0 based in Range
    if (line > position.line) {
        return true;
    }
    return line === position.line && token.location.col > position.character;
}
/**
 *  Checks token structure.
 *
 * @param token - Token to check
 * @returns True if token is of pre compiler v6 structure.
 */
function isOldToken(token) {
    return token.location === undefined;
}
/**
 * Returns a function that checks if tokens position starts at the given position.
 *
 * @param start - Matching token start position.
 * @returns True if token starts at the given position.
 */
function matchTokenByStart(start) {
    return (token) => {
        if (isOldToken(token)) {
            return token.line === start.line + 1 && token.column === start.character;
        }
        return token.location.line === start.line + 1 && token.location.col === start.character + 1;
    };
}
/**
 * Creates a range from the given token.
 *
 * @param token - Token to create range from.
 * @returns Token range.
 */
function createTokenRange(token) {
    if (isOldToken(token)) {
        return odata_annotation_core_1.Range.create(token.line - 1, token.column, token.line - 1, token.column + token.text.length);
    }
    return odata_annotation_core_1.Range.create(token.location.line - 1, token.location.col - 1, token.location.endLine - 1, token.location.endCol - 1);
}
/**
 * Get token column.
 *
 * @param token - Token.
 * @returns column number.
 */
function tokenColumn(token) {
    if (isOldToken(token)) {
        return token.column;
    }
    return token.location.col - 1;
}
/**
 * Get token line.
 *
 * @param token - Token.
 * @returns line number.
 */
function tokenLine(token) {
    if (isOldToken(token)) {
        return token.line - 1;
    }
    return token.location.line - 1;
}
//# sourceMappingURL=cds-compiler-tokens.js.map