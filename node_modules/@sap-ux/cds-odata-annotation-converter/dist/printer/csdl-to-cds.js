"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printPrimitiveValue = exports.printKey = exports.printCsdlNode = exports.print = exports.printTarget = exports.resolveTarget = void 0;
const odata_annotation_core_1 = require("@sap-ux/odata-annotation-core");
const primitives_1 = require("./primitives");
const edm_json_1 = require("./edm-json");
const indent_1 = require("./indent");
/**
 * Get print pattern based on (EDMX) target path.
 *
 * @param targetPath - i.e. for bound action: AdminService.addRating(AdminService.Books).
 * @returns object containing root element name, bound action and function names, print pattern and child segments.
 */
const resolveTarget = (targetPath) => {
    let printPattern;
    let rootElementName = '';
    let boundActionFunctionName = '';
    let isBoundActionFunction = false;
    const segments = targetPath.split('/');
    const actionSegmentIndex = checkParenthesis(segments);
    if (actionSegmentIndex >= 0 && segments[actionSegmentIndex].indexOf('()') < 0) {
        isBoundActionFunction = true;
    }
    rootElementName = segments[0];
    const childSegments = segments.slice(1);
    if (actionSegmentIndex < 0) {
        // no action
        printPattern = segments.length === 1 ? "artifact" /* PrintPattern.artifact */ : "element" /* PrintPattern.element */;
    }
    else if (isBoundActionFunction) {
        // bound action
        const fqboundActionFunctionName = rootElementName.split('(')[0];
        boundActionFunctionName = fqboundActionFunctionName.split('.').pop();
        const matchResult = /\((.{0,127})\)/.exec(rootElementName);
        // Check if matchResult is not null before using pop
        const extractedValue = matchResult ? matchResult.pop() : null;
        rootElementName = extractedValue ?? ''; //restrict simple identifier max-length 128
        printPattern =
            actionSegmentIndex === segments.length - 1 ? "boundAction" /* PrintPattern.boundAction */ : "boundParameter" /* PrintPattern.boundParameter */;
    }
    else {
        // unbound action
        rootElementName = rootElementName.split('(')[0];
        printPattern = actionSegmentIndex === segments.length - 1 ? "artifact" /* PrintPattern.artifact */ : "parameter" /* PrintPattern.parameter */;
    }
    return { rootElementName, boundActionFunctionName, printPattern, childSegments };
};
exports.resolveTarget = resolveTarget;
/**
 * Checks path segments for parentheses and returns the index of the first segment containing them.
 *
 * @param segments - array of path string.
 * @returns check (,) and return if condition meet.
 */
function checkParenthesis(segments) {
    return segments.findIndex((segment) => segment.indexOf('(') > 0 && segment.indexOf('(') < segment.indexOf(')'));
}
const printTarget = (target, complexTypePathSegments) => {
    const resolvedTarget = (0, exports.resolveTarget)(target.name);
    const rootElementName = resolvedTarget.rootElementName;
    const childSegments = resolvedTarget.childSegments;
    const boundActionFunctionName = resolvedTarget.boundActionFunctionName;
    const options = { ...odata_annotation_core_1.printOptions, useSnippetSyntax: false };
    const terms = [...target.terms.flatMap((term) => internalPrint(term, options))];
    if (terms.length > 1 && !terms[terms.length - 1].endsWith(',')) {
        // make sure there is trailing comma
        terms[terms.length - 1] += ',';
    }
    let result = terms.join(',\n') + (complexTypePathSegments?.length ? ';' : '\n');
    if (!childSegments || childSegments.length === 0) {
        if (boundActionFunctionName) {
            result = getTargetForBoundActionFunctions(target, result, rootElementName, boundActionFunctionName);
        }
        else {
            // target is root element, use following syntax
            // annotate <targetRootElementName> with @(
            //    <term> <qualifier>: <value>
            // );
            result = `annotate ${rootElementName} with @(\n${result});\n`;
        }
    }
    else if (childSegments.length === 1) {
        if (boundActionFunctionName) {
            result = getTargetForBoundActionFunctions(target, result, rootElementName, boundActionFunctionName, childSegments[0]);
        }
        else {
            // target is child of root element, use following syntax
            // annotate <targetRootElementName> with {
            //     <targetChildElementName> @(
            //        <term> <qualifier>: <value>
            //     );
            // }
            const assignment = terms.length > 1 ? `@(\n${result})` : `@${result}`;
            if (complexTypePathSegments?.length) {
                const complexTarget = complexTypePathSegments?.join('.');
                result = `annotate ${rootElementName} : ${complexTarget} with ${assignment}\n`;
            }
            else {
                result = `annotate ${rootElementName} with {\n${childSegments[0]} ${assignment}};\n`;
            }
        }
    }
    result = (0, indent_1.indent)(result);
    return result;
};
exports.printTarget = printTarget;
/**
 * Get print options replacing missing values with defaults.
 *
 * @param printOptions - Options for printing.
 * @returns The complete print options with defaults applied.
 */
function getPrintOptions(printOptions) {
    return {
        indentResult: printOptions.indentResult ?? true,
        annotationContext: printOptions.annotationContext ?? []
    };
}
const print = (node, formatterOptions = odata_annotation_core_1.printOptions, printOptions = {}) => {
    const { indentResult, annotationContext } = getPrintOptions(printOptions);
    if (Array.isArray(node)) {
        const nodes = node;
        const withTrailingCommas = nodes
            .map((item) => (0, exports.printCsdlNode)(item, annotationContext, formatterOptions) + ',')
            .join('\n');
        return indentResult ? (0, indent_1.indent)(withTrailingCommas) : withTrailingCommas;
    }
    return indentResult
        ? (0, indent_1.indent)((0, exports.printCsdlNode)(node, annotationContext, formatterOptions))
        : (0, exports.printCsdlNode)(node, annotationContext, formatterOptions);
};
exports.print = print;
const internalPrint = (node, options) => {
    if (node.type === odata_annotation_core_1.ELEMENT_TYPE && node.name === "Annotation" /* Edm.Annotation */) {
        return printNonRecordNode(node, [], options);
    }
    return [(0, exports.printCsdlNode)(node, [], options)];
};
const escapeText = (input) => {
    if (!input || typeof input !== 'string') {
        return input;
    }
    return input.replace(/'/g, "''");
};
const printCsdlNode = (node, context, options) => {
    switch (node.type) {
        case odata_annotation_core_1.ELEMENT_TYPE:
            if (node.name === "Record" /* Edm.Record */) {
                return printRecord(node, [], options);
            }
            else {
                return printNonRecordNode(node, context, options).join(',\n');
            }
        case odata_annotation_core_1.TEXT_TYPE:
            // text nodes can have all kinds of primitive values which might need enclosing '' or not (e.g. true, false, paths)
            return escapeText(node.text);
        default:
            return '';
    }
};
exports.printCsdlNode = printCsdlNode;
const printNonRecordNode = (node, context, options) => {
    const value = printNonRecordValue(node, context, options);
    if (node.name === "Annotation" /* Edm.Annotation */ || node.name === "PropertyValue" /* Edm.PropertyValue */) {
        // Annotation and PropertyValue need special handling because they also include 'key' part of the key value pair
        const annotations = flattenAnnotations(node, context, options);
        const key = (0, exports.printKey)([...context, node]);
        return [value === undefined ? (0, primitives_1.keyAlone)(key) : (0, primitives_1.valuePair)(key, value), ...annotations];
    }
    return [value];
};
const printAnnotationTerm = (element, embedded, isLastSegment) => {
    const term = (0, odata_annotation_core_1.getElementAttributeValue)(element, "Term" /* Edm.Term */);
    const qualifier = (0, odata_annotation_core_1.getElementAttributeValue)(element, "Qualifier" /* Edm.Qualifier */);
    if (!term) {
        return '';
    }
    const embeddedPrefix = embedded ? '@' : '';
    if (qualifier) {
        if (!isLastSegment) {
            return (0, primitives_1.delimitedIdentifier)(`${embeddedPrefix}${term}#${qualifier}`);
        }
        return `${embeddedPrefix}${term} #${qualifier}`;
    }
    else {
        return embeddedPrefix + term;
    }
};
const flattenAnnotations = (node, context, options) => {
    const annotations = (node.content ?? []).filter(annotationFilter);
    if (annotations.length) {
        return annotations.flatMap((annotation) => printNonRecordNode(annotation, [...context, node], options));
    }
    return [];
};
/**
 * Flatten OData structure into a CDS key.
 *
 * @param context - Annotation elements
 * @returns The key string
 */
const printKey = (context) => {
    return context
        .map((element, i) => {
        if (element.name === "Annotation" /* Edm.Annotation */) {
            return printAnnotationTerm(element, i !== 0, i === context.length - 1 && (i !== 0 || context.length === 1));
        }
        else if (element.name === "PropertyValue" /* Edm.PropertyValue */) {
            const propertyName = (0, odata_annotation_core_1.getElementAttributeValue)(element, "Property" /* Edm.Property */);
            if (!propertyName) {
                return '';
            }
            return propertyName;
        }
        return '';
    })
        .filter((segment) => segment !== '')
        .join('.');
};
exports.printKey = printKey;
const printContainerNode = (context, options) => (node) => {
    const value = (0, exports.printCsdlNode)(node, context, options);
    if (options.useSnippetSyntax && value.startsWith('$')) {
        return {
            placeholder: true,
            value
        };
    }
    return value;
};
const printNonRecordValue = (node, context, options) => {
    switch (node.name) {
        case "Annotation" /* Edm.Annotation */:
        case "PropertyValue" /* Edm.PropertyValue */: {
            return printValue(node, context, options);
        }
        case "Collection" /* Edm.Collection */: {
            const items = (node.content ?? [])
                .filter((node) => node.type === odata_annotation_core_1.ELEMENT_TYPE || node.text.trim() !== '')
                .map(printContainerNode(context, options));
            return (0, primitives_1.collection)(items);
        }
        case "Null" /* Edm.Null */: {
            return (0, exports.printPrimitiveValue)(node.name, '');
        }
        case "If" /* Edm.If */:
        case "Not" /* Edm.Not */:
        case "Apply" /* Edm.Apply */: {
            // fallback to EdmJson syntax
            return (0, edm_json_1.printEdmJson)(node, {
                ...options,
                includeEdmJson: true,
                removeRootElementContainer: false,
                skipIndent: true
            });
        }
        default: {
            if (node.content && node.content.length > 0) {
                return node.content
                    .map((nodeContent) => nodeContent.type === odata_annotation_core_1.TEXT_TYPE
                    ? (0, exports.printPrimitiveValue)(node.name, nodeContent.text)
                    : (0, exports.printCsdlNode)(nodeContent, context, options))
                    .join('');
            }
            else {
                return '';
            }
        }
    }
};
const printAttributePrimitiveValue = (element) => {
    const attributes = element.attributes ?? {};
    const { value, placeholder } = Object.keys(attributes).reduce((accumulator, attributeName) => {
        if (primitives_1.PRIMITIVE_VALUE_ATTRIBUTE_NAMES.has(attributeName)) {
            return {
                ...accumulator,
                value: (0, exports.printPrimitiveValue)(attributeName, attributes[attributeName].value)
            };
        }
        if (attributeName.startsWith('$')) {
            return {
                ...accumulator,
                placeholder: attributeName
            };
        }
        return accumulator;
    }, {});
    if (value) {
        return value;
    }
    if (placeholder) {
        return placeholder;
    }
    return undefined;
};
const annotationFilter = (node) => node.type === odata_annotation_core_1.ELEMENT_TYPE && node.name === "Annotation" /* Edm.Annotation */;
const encodeSnippet = (options, text) => options.useSnippetSyntax ? text.replace(/\$/g, '\\$') : text;
const printValue = (element, context, options) => {
    const valueElement = (element.content ?? []).find((node) => node.type === odata_annotation_core_1.ELEMENT_TYPE && node.name !== "Annotation" /* Edm.Annotation */) ??
        (element.content ?? []).find((node) => node.type !== odata_annotation_core_1.ELEMENT_TYPE && node.text.trim() !== '');
    const edmDynamicTypes = ["If" /* Edm.If */, "Not" /* Edm.Not */, "Apply" /* Edm.Apply */];
    if (valueElement?.type === odata_annotation_core_1.ELEMENT_TYPE && edmDynamicTypes.includes(valueElement.name)) {
        // fallback to EdmJson syntax
        return (0, edm_json_1.printEdmJson)(valueElement, {
            ...options,
            includeEdmJson: true,
            removeRootElementContainer: false,
            skipIndent: true
        });
    }
    if (valueElement) {
        return (0, exports.printCsdlNode)(valueElement, context, options);
    }
    const primitiveAttributeValue = printAttributePrimitiveValue(element);
    if (primitiveAttributeValue) {
        return primitiveAttributeValue;
    }
    return undefined;
};
const printRecord = (element, context, options) => {
    const content = element.content ?? [];
    const skipTextNodes = content.find((child) => child.type === odata_annotation_core_1.ELEMENT_TYPE && child.name !== "Annotation" /* Edm.Annotation */) !== undefined;
    const properties = content
        .filter((child) => (!skipTextNodes && child.type !== odata_annotation_core_1.ELEMENT_TYPE) ||
        (child.type === odata_annotation_core_1.ELEMENT_TYPE && child.name !== "Annotation" /* Edm.Annotation */))
        .map(printContainerNode(context, options));
    const annotations = content
        .filter(annotationFilter)
        .flatMap((annotation) => printNonRecordNode(annotation, [...context, element], options));
    const typeAttribute = element.attributes ? element.attributes['Type'] : undefined;
    if (typeAttribute?.value) {
        const type = (0, primitives_1.valuePair)(encodeSnippet(options, '$Type'), `'${typeAttribute.value}'`);
        return (0, primitives_1.struct)([type, ...properties, ...annotations]);
    }
    else {
        return (0, primitives_1.struct)([...properties, ...annotations]);
    }
};
const printPathValue = (path) => {
    if (path.indexOf('@') >= 0) {
        // if @ contained: use special syntax
        return (0, primitives_1.delimitedIdentifier)(path);
    }
    else {
        // convert path to native cds paths
        return path.split('/').join('.');
    }
};
const printPrimitiveValue = (expressionName, expressionValue) => {
    let result = '';
    let enumValues;
    switch (expressionName) {
        // constant expressions http://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/cs01/odata-csdl-xml-v4.01-cs01.html#sec_ConstantExpression
        case "Bool" /* Edm.Bool */:
        case "Decimal" /* Edm.Decimal */:
        case "Duration" /* Edm.Duration */:
        case "Float" /* Edm.Float */:
        case "Int" /* Edm.Int */:
            // native values should work in CDS - don't use quotation marks
            result = expressionValue;
            break;
        case "Null" /* Edm.Null */:
            result = primitives_1.CDS_NULL_EXPRESSION_LITERAL;
            break;
        case "DateTimeOffset" /* Edm.DateTimeOffset */:
        case "TimeOfDay" /* Edm.TimeOfDay */:
        case "Date" /* Edm.Date */:
            result = (0, primitives_1.stringLiteral)(expressionValue);
            break;
        case "String" /* Edm.String */:
            result = (0, primitives_1.stringLiteral)(escapeText(expressionValue));
            break;
        case "EnumMember" /* Edm.EnumMember */:
            // enum values start with # and do not include type name in CDS, render multiple once as array
            enumValues = expressionValue.split(' ');
            if (enumValues.length > 1) {
                result = enumValues.map((enumValue) => '#' + enumValue.split('/').pop()).join(', ');
                result = `[ ${result} ]`;
            }
            else {
                result = '#' + expressionValue.split('/').pop();
            }
            break;
        case "Guid" /* Edm.Guid */:
        case "Binary" /* Edm.Binary */:
            // not (yet) supported!
            result = (0, primitives_1.stringLiteral)(expressionValue);
            break;
        // path expressions http://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/cs01/odata-csdl-xml-v4.01-cs01.html#sec_PathExpressions
        case "AnnotationPath" /* Edm.AnnotationPath */:
            // annotation path:  always use quotation mark (e.g. for snippet value $0) and keep format as in csdl
            result = (0, primitives_1.stringLiteral)(expressionValue);
            break;
        case "ModelElementPath" /* Edm.ModelElementPath */:
        case "NavigationPropertyPath" /* Edm.NavigationPropertyPath */:
        case "PropertyPath" /* Edm.PropertyPath */:
        case "Path" /* Edm.Path */:
            // other paths: use quotation mark only if @ is contained
            if (expressionValue.trim() === '') {
                result = (0, primitives_1.stringLiteral)(expressionValue);
            }
            else {
                result = printPathValue(expressionValue);
            }
            break;
        default:
            return '';
    }
    return result;
};
exports.printPrimitiveValue = printPrimitiveValue;
/**
 * Generates an annotation string for bound action functions in CDS (Core Data Services).
 *
 * @param target - The target to be annotated.
 * @param terms - The terms to be used in the annotation.
 * @param rootElementName - The root element name for the annotation.
 * @param boundActionFunctionName - The name of the bound action function.
 * @param [childSegment] - The optional child segment for the annotation.
 * @returns The generated annotation string for bound action functions.
 */
function getTargetForBoundActionFunctions(target, terms, rootElementName, boundActionFunctionName, childSegment) {
    let result = `annotate ${rootElementName} with actions {\n${boundActionFunctionName} `;
    if (target.terms.length > 1) {
        if (childSegment) {
            result += `(\n${childSegment} @(${terms}))\n};`;
        }
        else {
            result += `@${terms}};`;
        }
    }
    else if (childSegment) {
        result += `(\n${childSegment} @${terms})\n};`;
    }
    else {
        result += `@${terms}};`;
    }
    return result;
}
//# sourceMappingURL=csdl-to-cds.js.map