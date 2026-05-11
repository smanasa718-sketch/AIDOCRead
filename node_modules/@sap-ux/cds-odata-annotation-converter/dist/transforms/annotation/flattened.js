"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFlattenedPath = convertFlattenedPath;
const cds_annotation_parser_1 = require("@sap-ux/cds-annotation-parser");
const odata_annotation_core_1 = require("@sap-ux/odata-annotation-core");
const creators_1 = require("./creators");
const type_resolver_1 = require("./type-resolver");
const range_1 = require("./range");
const i18n_1 = require("../../i18n");
/**
 * Builds a tree from a flattened annotation structure and updates context with the final value type.
 *
 * @param state VisitorSate for which context will be updated with the inferred value types.
 * @param segments Array of identifiers representing flattened record structure.
 * @param value annotation value.
 * @returns subtree representing flattened structure
 */
function convertFlattenedPath(state, segments, value) {
    // |________________Annotation____________________|
    // |         |                                    |
    // |         |___________Record(root)_____________|
    // |         |                                    |
    // |         |__________Property Value____________|
    // |         |                                    |
    // |         |           |________Record__________|
    // |         |           |                        |
    // |         |           |_____Property Value_____|
    // |         |           |                        |
    // |         |           |                        |
    //  UI.Chart.AxisScaling.ScaleBehavior : #AutoScale
    //  \______/|\_________/|\___________/   \________/
    //     |    |     |     |     |              |
    //     |    |     |     |     |              |
    //     |  Record  |   Record  |              |
    //     |          |           |              |
    //    Term        |           |              |
    //             Property    Property      Enum Member
    let root;
    let parent;
    const expandedStructures = convertToExpandedStructure(state, segments, value);
    if (!expandedStructures.length) {
        return;
    }
    for (const expandedStructure of expandedStructures) {
        if (parent) {
            if (expandedStructure.kind === 'record-type') {
                if (expandedStructure.element.range) {
                    parent.contentRange = (0, range_1.copyRange)(expandedStructure.element.range);
                }
                parent.content.push(expandedStructure.element);
            }
            else {
                const record = (0, odata_annotation_core_1.createElementNode)({
                    name: "Record" /* Edm.Record */,
                    range: expandedStructure.element.range ?? undefined,
                    content: [expandedStructure.element],
                    contentRange: expandedStructure.element.range ?? undefined
                });
                // property content range should include only child range
                parent.contentRange = record.range ?? undefined;
                parent.content.push(record);
            }
        }
        else {
            root = expandedStructure.element;
        }
        parent = expandedStructure.element;
    }
    state.pushContext({ ...state.context, ...createNewContext(expandedStructures) });
    if (!root || !parent) {
        return;
    }
    return {
        root,
        leaf: parent
    };
}
/**
 * Creates a new context.
 *
 * @param expandedStructures expanded structure either annotation or property kind.
 * @returns new context
 */
function createNewContext(expandedStructures) {
    const last = expandedStructures[expandedStructures.length - 1];
    const newContext = {
        valueType: last.vocabularyObject?.type,
        isCollection: last.vocabularyObject?.isCollection
    };
    if (last.kind === 'annotation') {
        newContext.termType = last.vocabularyObject?.type;
    }
    else if (last.kind === 'record-type') {
        newContext.recordType = last.element.attributes["Type" /* Edm.Type */].value;
    }
    else {
        newContext.propertyName = last.element.attributes["Property" /* Edm.Property */].value;
    }
    return newContext;
}
/**
 * Converts segments to expanded structure.
 *
 * @param state VisitorSate for which context will be updated with the inferred value types.
 * @param segments Array of identifiers representing flattened record structure.
 * @param value AnnotationValue
 * @returns expanded structure either annotation or property kind.
 */
function convertToExpandedStructure(state, segments, value) {
    const valueRange = value?.range;
    const expandedStructure = [];
    const initialType = state.context.recordType ?? state.context.termType;
    const lastSegment = valueRange ? undefined : segments[segments.length - 1];
    let i = 0;
    while (i < segments.length) {
        const segment = segments[i];
        const propertyRange = (0, range_1.createRange)(segment.range?.start, valueRange?.end ?? lastSegment?.range?.end);
        if (segment.value.startsWith('@')) {
            // handle embedded annotation syntax (supported starting with cds-compiler v3)
            // e.g. @Common.Text.@UI.TextArrangement : #TextFirst
            const vocabularyNameOrAlias = segment.value.substring(1);
            const termNameSegment = segments[i + 1];
            const termQualifiedName = termNameSegment
                ? `${vocabularyNameOrAlias}.${termNameSegment.value}`
                : vocabularyNameOrAlias;
            const termValueRange = termNameSegment
                ? (0, range_1.createRange)(segment.range?.start, termNameSegment.range?.end)
                : structuredClone(segment.range);
            const embeddedAnnotation = (0, odata_annotation_core_1.createElementNode)({
                name: "Annotation" /* Edm.Annotation */,
                range: propertyRange,
                attributes: {
                    ["Term" /* Edm.Term */]: (0, creators_1.createTermAttribute)(termQualifiedName, termValueRange)
                },
                content: []
            });
            expandedStructure.push({
                kind: 'annotation',
                name: termQualifiedName,
                vocabularyObject: (0, type_resolver_1.getTerm)(state.vocabularyService, vocabularyNameOrAlias, termNameSegment?.value),
                element: embeddedAnnotation
            });
            i += 2;
            continue;
        }
        if (segment.value === cds_annotation_parser_1.ReservedProperties.Type) {
            const hasSegmentAhead = segments[i + 1];
            if (hasSegmentAhead) {
                addDiagnosticForSegmentAfterType(state, segments.slice(i + 1), valueRange);
                break;
            }
            createRecordTypeAttribute(state, expandedStructure, segment, value, propertyRange);
        }
        else {
            const flatProperty = (0, odata_annotation_core_1.createElementNode)({
                name: "PropertyValue" /* Edm.PropertyValue */,
                range: propertyRange,
                contentRange: propertyRange,
                attributes: {
                    ["Property" /* Edm.Property */]: (0, creators_1.createPropertyAttribute)(segment.value, segment.range)
                }
            });
            const parentType = expandedStructure[expandedStructure.length - 1]?.vocabularyObject?.type ?? initialType;
            expandedStructure.push({
                kind: 'property',
                name: segment.value,
                vocabularyObject: (0, type_resolver_1.getPropertyType)(state.vocabularyService, parentType, segment.value),
                element: flatProperty
            });
        }
        i++;
    }
    adjustLastSegmentRange(expandedStructure, valueRange);
    return expandedStructure;
}
/**
 * Adjusts the last segment range of the expanded structure.
 *
 * @param expandedStructure expanded structure either annotation or property kind.
 * @param valueRange Value range
 */
function adjustLastSegmentRange(expandedStructure, valueRange) {
    // the leaf element should only include the values range in it's contentRange
    const last = expandedStructure[expandedStructure.length - 1];
    if (last) {
        if (valueRange && last.kind !== 'record-type') {
            last.element.contentRange = (0, range_1.copyRange)(valueRange);
        }
        else {
            // content range should not be added in case value does not exist
            // e.g  { AxisScaling. }
            delete last.element.contentRange;
        }
    }
}
/**
 * Adds a diagnostic for segments after $Type.
 *
 * @param state VisitorSate for which context will be updated with the inferred value types.
 * @param segments Array of identifiers representing flattened record structure.
 * @param valueRange value range
 */
function addDiagnosticForSegmentAfterType(state, segments, valueRange) {
    if (segments.length >= 1) {
        const message = i18n_1.i18n.t('No_segments_after_type');
        const lastSegment = segments[segments.length - 1];
        const propertyRange = (0, range_1.createRange)(segments[0].range?.start, valueRange?.end ?? lastSegment?.range?.end);
        if (propertyRange) {
            state.addDiagnostic({
                range: propertyRange,
                severity: odata_annotation_core_1.DiagnosticSeverity.Error,
                message
            });
        }
    }
}
/**
 * Adds a diagnostic for non-string literal type and no value scenarios.
 *
 * @param state VisitorSate for which context will be updated with the inferred value types.
 * @param value AnnotationValue
 * @param segmentRange segment range
 */
function addDiagnosticForNonStringLiteralType(state, value, segmentRange) {
    if (value?.type !== cds_annotation_parser_1.STRING_LITERAL_TYPE && value?.range) {
        const message = i18n_1.i18n.t('Type_value_must_be_string');
        state.addDiagnostic({
            range: value.range,
            severity: odata_annotation_core_1.DiagnosticSeverity.Error,
            message
        });
    }
    else if (!value && segmentRange) {
        state.addDiagnostic({
            range: segmentRange,
            severity: odata_annotation_core_1.DiagnosticSeverity.Error,
            message: i18n_1.i18n.t('Value_must_be_provided')
        });
    }
}
/**
 * Add record's type to the expanded structure.
 *
 * @param state VisitorSate for which context will be updated with the inferred value types.
 * @param expandedStructures expanded structure either annotation or property kind.
 * @param segment Identifiers representing flattened record structure.
 * @param value AnnotationValue
 * @param propertyRange Range
 */
function createRecordTypeAttribute(state, expandedStructures, segment, value, propertyRange) {
    if (value?.type === cds_annotation_parser_1.STRING_LITERAL_TYPE) {
        const flatProperty = (0, odata_annotation_core_1.createElementNode)({
            name: "Record" /* Edm.Record */,
            attributes: {
                ["Type" /* Edm.Type */]: (0, odata_annotation_core_1.createAttributeNode)("Type" /* Edm.Type */, value?.value, segment.range, (0, cds_annotation_parser_1.nodeRange)(value, false))
            },
            range: propertyRange
        });
        expandedStructures.push({
            kind: 'record-type',
            name: segment.value,
            element: flatProperty
        });
        return;
    }
    addDiagnosticForNonStringLiteralType(state, value, segment.range);
}
//# sourceMappingURL=flattened.js.map