/**
 *  Indent a string representing a complete element.
 *  Indentation is performed now after the element has completely been composed.
 *  The advantage is that the context is that the indentation level can be easily calculated.
 *  by counting opening and closing brackets.
 *  (The element 'string' must not contain any indentation when calling this method).
 *
 * @param string - String representing a complete element
 * @param indentInfo - indentation level, default 0 and skipFirstLine a boolean flag, flag to skip indenting first line if insert position is known.
 * @param indentInfo.level
 * @param indentInfo.skipFirstLine
 * @returns Indent a string representing a complete element.
 */
export declare function indent(string: string, { level, skipFirstLine }?: {
    level?: number | undefined;
    skipFirstLine?: boolean | undefined;
}): string;
//# sourceMappingURL=indent.d.ts.map