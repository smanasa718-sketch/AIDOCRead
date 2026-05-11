"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTokenByPosition = findTokenByPosition;
exports.getTokenLocation = getTokenLocation;
exports.isOldToken = isOldToken;
function findTokenByPosition(tokens, line, column) {
    let left = 0;
    let right = tokens.length - 1;
    while (left <= right) {
        const m = Math.floor((left + right) / 2);
        const token = tokens[m];
        if (isOldToken(token)) {
            // can be removed when we drop support for v5 compiler
            if (token.line < line || (token.line === line && token.column < column - 1)) {
                left = m + 1;
            }
            else if (token.line > line || (token.line === line && token.column > column - 1)) {
                right = m - 1;
            }
            else {
                return token;
            }
        }
        else {
            if (token.location.line < line || (token.location.line === line && token.location.col < column)) {
                left = m + 1;
            }
            else if (token.location.line > line || (token.location.line === line && token.location.col > column)) {
                right = m - 1;
            }
            else {
                return token;
            }
        }
    }
    return undefined;
}
function getTokenLocation(token, text = token.text) {
    if (isOldToken(token)) {
        // can be removed when we drop support for v5 compiler
        return {
            line: token.line,
            column: token.column + 1,
            endLine: token.line + text.split(/\r?\n/).length - 1,
            endColumn: token.text.indexOf('\n') !== -1
                ? token.text.length - text.lastIndexOf('\n')
                : token.column + text.length + 1
        };
    }
    return {
        line: token.location.line,
        column: token.location.col,
        endLine: token.location.endLine,
        endColumn: token.location.endCol
    };
}
function isOldToken(token) {
    return token.location === undefined;
}
//# sourceMappingURL=tokenStream.js.map