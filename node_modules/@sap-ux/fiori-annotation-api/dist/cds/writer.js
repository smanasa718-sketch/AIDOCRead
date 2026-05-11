"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDSWriter = void 0;
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const project_access_1 = require("@sap-ux/project-access");
const odata_annotation_core_1 = require("@sap-ux/odata-annotation-core");
const ux_cds_compiler_facade_1 = require("@sap/ux-cds-compiler-facade");
const cds_annotation_parser_1 = require("@sap-ux/cds-annotation-parser");
const cds_odata_annotation_converter_1 = require("@sap-ux/cds-odata-annotation-converter");
const utils_1 = require("../utils");
const error_1 = require("../error");
const document_1 = require("./document");
const deletion_1 = require("./deletion");
const pointer_1 = require("./pointer");
const change_1 = require("./change");
const preprocessor_1 = require("./preprocessor");
const cds_compiler_tokens_1 = require("./cds-compiler-tokens");
const indent_1 = require("./indent");
const printOptions = { ...odata_annotation_core_1.printOptions, useSnippetSyntax: false };
const ANNOTATION_START_PATTERN = /^@/i;
/**
 *
 */
class CDSWriter {
    facade;
    vocabularyService;
    document;
    comments;
    tokens;
    textDocument;
    projectRoot;
    annotationFile;
    changes = [];
    edits = [];
    referenceEdits = [];
    indentLevelCache = {};
    vocabularyAliases = new Set();
    deletionRangesMapForTarget = new Map();
    uniqueInserts = new Set();
    processedChanges = [];
    /**
     *
     * @param facade - CDS compiler facade instance.
     * @param vocabularyService - Vocabulary API.
     * @param document - CDS document AST root.
     * @param comments - All comments of the document.
     * @param tokens - All tokens in the document.
     * @param textDocument - TextDocument instance.
     * @param projectRoot - Absolute path to the project root.
     * @param annotationFile - Internal representation of the annotation file.
     */
    constructor(facade, vocabularyService, document, comments, tokens, textDocument, projectRoot, 
    /**
     * This should be removed once it is no longer needed by deletion logic
     *
     * @deprecated
     */
    annotationFile) {
        this.facade = facade;
        this.vocabularyService = vocabularyService;
        this.document = document;
        this.comments = comments;
        this.tokens = tokens;
        this.textDocument = textDocument;
        this.projectRoot = projectRoot;
        this.annotationFile = annotationFile;
        for (const [, vocabulary] of this.vocabularyService.getVocabularies()) {
            this.vocabularyAliases.add(vocabulary.defaultAlias);
        }
    }
    /**
     * Adds change to the stack.
     *
     * @param change - New change.
     */
    addChange(change) {
        this.changes.push(change);
    }
    /**
     * Creates text edits for the changes in the stack.
     *
     * @returns - Text edits.
     */
    async getTextEdits() {
        this.resetState();
        this.processedChanges = (0, preprocessor_1.preprocessChanges)(this.document, this.changes, this.tokens);
        for (const change of this.processedChanges) {
            const path = (0, pointer_1.getAstNodesFromPointer)(this.document, change.pointer).reverse();
            const handler = this[change.type];
            const result = handler(change, path);
            if (result instanceof Promise) {
                await result;
            }
        }
        for (const key of this.deletionRangesMapForTarget.keys()) {
            const deletionRanges = this.deletionRangesMapForTarget.get(key) ?? [];
            if (deletionRanges.length > 0) {
                const targetDeletions = (0, deletion_1.getTextEditsForDeletionRanges)(deletionRanges, this.vocabularyAliases, this.tokens, this.annotationFile, false);
                this.edits.push(...targetDeletions);
            }
        }
        this.edits.unshift(...this.referenceEdits);
        this.edits.sort(utils_1.compareByRange);
        return this.edits;
    }
    /**
     * Building text edits is a stateful process and needs to be cleared after each {@link CDSWriter.getTextEdits} call.
     *
     */
    resetState() {
        this.edits = [];
        this.referenceEdits = [];
        this.processedChanges = [];
        this.indentLevelCache = {};
        this.deletionRangesMapForTarget = new Map();
        this.uniqueInserts = new Set();
    }
    getIndentLevel(pointer) {
        const cachedValue = this.indentLevelCache[pointer];
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        const level = (0, indent_1.getIndentLevelFromPointer)(this.document, this.tokens, pointer);
        this.indentLevelCache[pointer] = level;
        return level;
    }
    //#region Inserts
    isFirstInsert(pointer, node, index = -1) {
        const childCount = (0, document_1.getChildCount)(node);
        const i = index > -1 ? Math.min(index, childCount) : childCount;
        const insertPositionKey = `${pointer}/${i}`;
        const firstInsert = !this.uniqueInserts.has(insertPositionKey);
        this.uniqueInserts.add(insertPositionKey);
        return firstInsert;
    }
    // Change Handlers
    [change_1.INSERT_TARGET_CHANGE_TYPE] = (change) => {
        if (!this.document.range) {
            return;
        }
        let prefix = '';
        const position = this.document.range.end;
        if (this.document.range.end.character > 0) {
            prefix = '\n';
            position.character = 0;
        }
        const newElements = prefix + (0, cds_odata_annotation_converter_1.printTarget)(change.target, change.complexTypePathSegments) + '\n';
        const edits = [odata_annotation_core_1.TextEdit.insert(position, newElements)];
        this.edits.push(...edits);
    };
    [change_1.INSERT_RECORD_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        const indentLevel = this.getIndentLevel(change.pointer);
        // inserting new record as value eg: annotate IncidentService.Incidents with @UI.Chart;
        if ((astNode?.type === cds_annotation_parser_1.ANNOTATION_TYPE || astNode?.type === cds_annotation_parser_1.RECORD_PROPERTY_TYPE) && astNode.range) {
            const recordText = ' : ' +
                (0, cds_odata_annotation_converter_1.indent)((0, cds_odata_annotation_converter_1.print)(change.element, printOptions, { indentResult: false }), {
                    level: indentLevel,
                    skipFirstLine: true
                });
            const position = astNode.range.end;
            this.edits.push(odata_annotation_core_1.TextEdit.insert(position, recordText));
        }
        if (astNode?.type === cds_annotation_parser_1.COLLECTION_TYPE) {
            const content = getContainerContent(astNode, this.comments, this.tokens);
            this.insertIntoNodeWithContent(content, astNode, change, indentLevel, this.isFirstInsert(change.pointer, astNode, change.index));
        }
    };
    [change_1.INSERT_COLLECTION_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        const indentLevel = this.getIndentLevel(change.pointer);
        const collectionText = change.element.content.length ? (0, cds_odata_annotation_converter_1.print)(change.element) : '[]';
        const textWithPrefix = ` : ${collectionText}`;
        const position = astNode?.range?.end;
        if (position) {
            const text = (0, cds_odata_annotation_converter_1.indent)(textWithPrefix, { level: indentLevel + 1, skipFirstLine: true });
            this.edits.push(odata_annotation_core_1.TextEdit.insert(position, text));
        }
    };
    [change_1.INSERT_ANNOTATION_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (astNode?.type !== cds_odata_annotation_converter_1.TARGET_TYPE && astNode?.type !== cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE) {
            return;
        }
        const indentLevel = this.getIndentLevel(change.pointer);
        const content = getContainerContent(astNode, this.comments, this.tokens);
        this.convertInsertNodeToTextEdits(content, astNode, change, indentLevel, this.isFirstInsert(change.pointer, astNode, change.index));
    };
    [change_1.INSERT_EMBEDDED_ANNOTATION_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode, parent] = reversePath;
        const indentLevel = this.getIndentLevel(change.pointer);
        if (astNode?.type === cds_annotation_parser_1.RECORD_TYPE) {
            const content = getContainerContent(astNode, this.comments, this.tokens);
            this.insertIntoNodeWithContent(content, astNode, change, indentLevel, this.isFirstInsert(change.pointer, astNode, change.index));
        }
        else if (astNode?.type === cds_annotation_parser_1.ANNOTATION_TYPE) {
            // we're inserting into the parent, not the value
            let adjustedIndentLevel = indentLevel - 1;
            if (willTargetAnnotationIncreaseIndent(this.processedChanges, change.pointer)) {
                adjustedIndentLevel++;
            }
            if (astNode.value?.range &&
                (parent?.type === cds_odata_annotation_converter_1.TARGET_TYPE || parent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE)) {
                const content = getContainerContent(parent, this.comments, this.tokens);
                this.insertIntoNodeWithContent(content, parent, change, adjustedIndentLevel, 
                // adjust pointer to match the parent node, because we're inserting into the parent
                this.isFirstInsert(change.pointer.split('/').slice(0, -2).join('/'), parent, change.index), astNode);
            }
        }
    };
    [change_1.INSERT_RECORD_PROPERTY_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        const indentLevel = this.getIndentLevel(change.pointer);
        if (astNode?.type !== cds_annotation_parser_1.RECORD_TYPE) {
            return;
        }
        const content = getContainerContent(astNode, this.comments, this.tokens);
        this.convertInsertNodeToTextEdits(content, astNode, change, indentLevel, this.isFirstInsert(change.pointer, astNode, change.index));
    };
    [change_1.INSERT_PRIMITIVE_VALUE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        const indentLevel = this.getIndentLevel(change.pointer);
        if (astNode?.type === cds_annotation_parser_1.COLLECTION_TYPE) {
            const content = getContainerContent(astNode, this.comments, this.tokens);
            this.convertInsertNodeToTextEdits(content, astNode, change, indentLevel, this.isFirstInsert(change.pointer, astNode, change.index));
        }
        else if ((astNode?.type === cds_annotation_parser_1.RECORD_PROPERTY_TYPE || astNode?.type === cds_annotation_parser_1.ANNOTATION_TYPE) && astNode.range) {
            const textNode = change.element.content[0];
            const value = textNode?.type === odata_annotation_core_1.TEXT_TYPE ? textNode.text : '';
            const recordText = ' : ' + (0, cds_odata_annotation_converter_1.indent)((0, cds_odata_annotation_converter_1.printPrimitiveValue)(change.element.name, value));
            this.edits.push(odata_annotation_core_1.TextEdit.insert(astNode.range.end, recordText));
        }
    };
    [change_1.INSERT_QUALIFIER_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (astNode?.type === cds_annotation_parser_1.ANNOTATION_TYPE && astNode.term.range) {
            this.edits.push(odata_annotation_core_1.TextEdit.insert(astNode.term.range.end, ` #${change.value}`));
        }
    };
    [change_1.INSERT_REFERENCE_CHANGE_TYPE] = async (change) => {
        const { position, prependNewLine } = getInsertReferencePosition(this.document.references);
        // TODO: this breaks memfs concept
        const text = `${prependNewLine ? '\n' : ''}${await getTextEditForMissingRefs(change.references, this.document.uri, this.projectRoot)}`;
        this.referenceEdits.push(odata_annotation_core_1.TextEdit.insert(position, text));
    };
    //#endregion
    //#region Deletes
    deleteNode(pointer, reversePath) {
        const [astNode, parent] = reversePath;
        const segments = pointer.split('/');
        const lastIndex = segments.pop();
        deleteValue(this.edits, pointer, astNode, parent, this.comments, this.tokens, lastIndex);
    }
    [change_1.DELETE_TARGET_CHANGE_TYPE] = (_change, reversePath) => {
        const [astNode] = reversePath;
        if (astNode?.type !== cds_odata_annotation_converter_1.TARGET_TYPE || !astNode.range || !astNode.nameRange) {
            return;
        }
        // TODO: check if we can relay on target.kind instead of going through edmx conversions
        const { edmxPath } = this.facade.collectMetadataForAbsolutePath(astNode.name, astNode.kind, (0, ux_cds_compiler_facade_1.createMetadataCollector)(new Map(), this.facade));
        const ranges = astNode.assignments
            .flatMap((assignment) => (assignment.type === cds_annotation_parser_1.ANNOTATION_TYPE ? [assignment] : assignment.items.items))
            .map((annotation, i) => {
            return (0, deletion_1.getDeletionRangeForNode)(this.vocabularyService, this.vocabularyAliases, i, this.tokens, annotation, edmxPath);
        })
            .filter((range) => !!range);
        const targetDeletions = (0, deletion_1.getTextEditsForDeletionRanges)(ranges, this.vocabularyAliases, this.tokens, this.annotationFile, true);
        if (targetDeletions) {
            this.edits.push(...targetDeletions);
        }
    };
    [change_1.DELETE_RECORD_CHANGE_TYPE] = (change, reversePath) => {
        this.deleteNode(change.pointer, reversePath);
    };
    [change_1.DELETE_RECORD_PROPERTY_CHANGE_TYPE] = (change, reversePath) => {
        this.deleteNode(change.pointer, reversePath);
    };
    [change_1.DELETE_ANNOTATION_GROUP_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode, parent] = reversePath;
        const segments = change.pointer.split('/');
        const lastIndex = segments.pop() ?? '';
        const index = Number.parseInt(lastIndex, 10);
        if (Number.isNaN(index) || astNode?.type !== cds_annotation_parser_1.ANNOTATION_GROUP_TYPE || parent?.type !== cds_odata_annotation_converter_1.TARGET_TYPE) {
            return;
        }
        const content = getContainerContent(parent, this.comments, this.tokens);
        const { startContentIndex } = findContentIndices(content, index, index);
        deleteBlock(this.edits, content, startContentIndex);
    };
    [change_1.DELETE_ANNOTATION_GROUP_ITEMS_CHANGE_TYPE] = () => {
        // should never be called
        // preprocessor converts these changes to DeleteAnnotationGroup
    };
    getDeletionRange(annotation, target, index) {
        const { edmxPath } = this.facade.collectMetadataForAbsolutePath(target.name, target.kind, (0, ux_cds_compiler_facade_1.createMetadataCollector)(new Map(), this.facade));
        return (0, deletion_1.getDeletionRangeForNode)(this.vocabularyService, this.vocabularyAliases, index, this.tokens, annotation, edmxPath);
    }
    [change_1.DELETE_ANNOTATION_CHANGE_TYPE] = (change, reversePath) => {
        const [annotation, parent, , greatGrandParent] = reversePath;
        const segments = change.pointer.split('/');
        const lastIndex = segments.pop();
        const isInAnnotationGroup = greatGrandParent?.type === cds_odata_annotation_converter_1.TARGET_TYPE;
        const target = isInAnnotationGroup ? greatGrandParent : parent;
        if (!lastIndex || annotation?.type !== cds_annotation_parser_1.ANNOTATION_TYPE || target.type !== cds_odata_annotation_converter_1.TARGET_TYPE) {
            return;
        }
        const targetPointer = change.pointer.split('/').slice(0, 3).join('/');
        const assignmentIndex = Number.parseInt(lastIndex, 10);
        if (Number.isNaN(assignmentIndex)) {
            return;
        }
        let index = 0;
        // We need to calculate correct indices for the annotations
        for (let i = 0; i < target.assignments.length; i++) {
            const assignment = target.assignments[i];
            if (assignment.type === cds_annotation_parser_1.ANNOTATION_GROUP_TYPE) {
                index += assignment.items.items.length;
            }
            else {
                if (i === assignmentIndex) {
                    break;
                }
                index++;
            }
        }
        const range = this.getDeletionRange(annotation, target, index);
        if (!range) {
            return;
        }
        let targetDeletionRanges = this.deletionRangesMapForTarget.get(targetPointer);
        if (!targetDeletionRanges) {
            targetDeletionRanges = [];
            this.deletionRangesMapForTarget.set(targetPointer, targetDeletionRanges);
        }
        targetDeletionRanges.push(range);
    };
    [change_1.DELETE_EMBEDDED_ANNOTATION_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode, parent] = reversePath;
        if (astNode?.type === cds_annotation_parser_1.ANNOTATION_TYPE) {
            if (parent.type === cds_annotation_parser_1.RECORD_TYPE) {
                // Transform $value back to normal primitive value representation if last embedded annotation is being deleted
                const firstProperty = parent.properties[0];
                const isTransformPossible = parent.annotations?.length === 1 &&
                    parent.properties.length === 1 &&
                    firstProperty.name.value === cds_annotation_parser_1.ReservedProperties.Value;
                if (isTransformPossible && parent.range && firstProperty.value?.range) {
                    // delete surrounding record parts, leaving property value only
                    this.edits.push(odata_annotation_core_1.TextEdit.del(odata_annotation_core_1.Range.create(parent.range.start, firstProperty.value.range.start)), odata_annotation_core_1.TextEdit.del(odata_annotation_core_1.Range.create(firstProperty.value.range.end, parent.range.end)));
                }
                else {
                    this.deleteNode(change.pointer, reversePath);
                }
            }
            else {
                this[change_1.DELETE_ANNOTATION_CHANGE_TYPE]((0, change_1.createDeleteAnnotationChange)(change.pointer), reversePath);
            }
        }
    };
    [change_1.DELETE_PRIMITIVE_VALUE_CHANGE_TYPE] = (change, reversePath) => {
        this.deleteNode(change.pointer, reversePath);
    };
    [change_1.DELETE_QUALIFIER_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (!astNode?.range) {
            return;
        }
        const range = (0, cds_annotation_parser_1.copyRange)(astNode.range);
        range.start.character--; // also include # character
        this.edits.push(odata_annotation_core_1.TextEdit.del(range));
    };
    //#endregion
    //#region Modifications
    [change_1.REPLACE_NODE_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (!astNode?.range) {
            return;
        }
        let indentLevel = this.getIndentLevel(change.pointer);
        if (willTargetAnnotationIncreaseIndent(this.processedChanges, change.pointer)) {
            indentLevel++;
        }
        const fragment = (0, cds_odata_annotation_converter_1.print)(change.newElement, printOptions);
        const indentedFragment = (0, utils_1.increaseIndent)(fragment, indentLevel, true);
        this.edits.push(odata_annotation_core_1.TextEdit.replace(astNode.range, indentedFragment));
    };
    [change_1.REPLACE_RECORD_PROPERTY_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        const indentLevel = this.getIndentLevel(change.pointer);
        if (!astNode?.range) {
            return;
        }
        const text = (0, cds_odata_annotation_converter_1.indent)((0, cds_odata_annotation_converter_1.print)(change.newProperty, printOptions, { indentResult: false }), {
            level: indentLevel + 1,
            skipFirstLine: true
        });
        this.edits.push(odata_annotation_core_1.TextEdit.replace(astNode.range, text));
    };
    [change_1.REPLACE_TEXT_VALUE_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (!astNode?.range) {
            return;
        }
        let expressionType = '';
        if (astNode?.type) {
            expressionType = convertCDSAstToEdmType(astNode.type);
        }
        if (expressionType === undefined) {
            console.warn(`Could not determine expression type for ${JSON.stringify(change, undefined, 2)}. For changing enum flags "set-flags" change should be used.`);
            return;
        }
        this.edits.push(odata_annotation_core_1.TextEdit.replace(astNode.range, (0, cds_odata_annotation_converter_1.printPrimitiveValue)(expressionType, change.newValue)));
    };
    [change_1.UPDATE_PRIMITIVE_VALUE_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (!astNode?.range) {
            return;
        }
        if (astNode.type === cds_annotation_parser_1.STRING_LITERAL_TYPE) {
            const range = (0, cds_annotation_parser_1.copyRange)(astNode.range);
            // string range includes quotes, but we only need to replace content.
            range.start.character++;
            range.end.character--;
            this.edits.push(odata_annotation_core_1.TextEdit.replace(range, change.newValue));
        }
        else if (astNode.type === cds_annotation_parser_1.ENUM_TYPE && astNode.path.range) {
            this.edits.push(odata_annotation_core_1.TextEdit.replace(astNode.range, (0, cds_odata_annotation_converter_1.printPrimitiveValue)("EnumMember" /* Edm.EnumMember */, change.newValue)));
        }
        else {
            this.edits.push(odata_annotation_core_1.TextEdit.replace(astNode.range, change.newValue));
        }
    };
    //#endregion
    [change_1.SET_FLAGS_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (astNode?.type === cds_annotation_parser_1.COLLECTION_TYPE && astNode.range) {
            this.edits.push(odata_annotation_core_1.TextEdit.replace(astNode.range, (0, cds_odata_annotation_converter_1.printPrimitiveValue)("EnumMember" /* Edm.EnumMember */, change.value)));
        }
        else if (astNode?.type === cds_annotation_parser_1.ENUM_TYPE) {
            console.warn(`Could not apply change "set-flags". Expected target to be '${cds_annotation_parser_1.COLLECTION_TYPE}, but got ${cds_annotation_parser_1.ENUM_TYPE}. To replace single enum value 'replace-text-value' change should be used`);
        }
    };
    [change_1.MOVE_COLLECTION_VALUE_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (astNode.type !== cds_annotation_parser_1.COLLECTION_TYPE) {
            return;
        }
        const content = getContainerContent(astNode, this.comments, this.tokens);
        const anchor = this.findInsertPosition(content, astNode, change.pointer, change.index);
        const indentLevel = this.getIndentLevel(change.pointer);
        if (anchor) {
            if (anchor.commaPosition) {
                this.edits.push(odata_annotation_core_1.TextEdit.insert(anchor.commaPosition, ','));
            }
            const ranges = createElementRanges(this.document, this.tokens, change.fromPointers);
            const moveEdits = getTextEditsForMove(this.textDocument, this.comments, this.tokens, this.processedChanges, this.document, anchor.position, ranges, indentLevel);
            this.edits.push(...moveEdits);
            if (astNode.closeToken?.range &&
                astNode.closeToken?.range?.end?.line === astNode.openToken?.range?.end?.line) {
                // [] is on the same line -> we need to expand this to multiple lines
                const indent = '    '.repeat(indentLevel);
                this.edits.push(odata_annotation_core_1.TextEdit.insert(astNode.closeToken.range.start, '\n' + indent));
            }
        }
    };
    [change_1.CONVERT_TO_COMPOUND_ANNOTATION_CHANGE_TYPE] = (change, reversePath) => {
        const [astNode] = reversePath;
        if (astNode?.type !== cds_odata_annotation_converter_1.TARGET_TYPE) {
            return;
        }
        const indentLevel = this.getIndentLevel(change.pointer);
        const conversionSteps = convertToCompoundAnnotation(this.tokens, astNode, indentLevel, change.applyContentIndentation);
        if (conversionSteps.length) {
            this.edits.push(...conversionSteps);
        }
    };
    insertIntoNodeWithContent(content, parent, change, indentLevel, firstInsert, referenceNode) {
        const index = getIndexForInsertion((0, document_1.getChildCount)(parent), change.index);
        // change.index should not be used in this scope, because changes with indices outside the container size are merged
        // and change.index would not correctly reflect the place where a change needs to be inserted
        if (!change || !parent.range) {
            return;
        }
        const newElements = printChange(parent, referenceNode)(change);
        if ((0, document_1.getChildCount)(parent) === 0) {
            const fragments = [];
            const range = (0, cds_annotation_parser_1.copyRange)(parent.range);
            // we need to adjust range to exclude boundary characters
            range.start.character++; // range includes '{' or '[' characters
            range.end.character--; // range includes '}' or ']' characters
            fragments.push('\n');
            fragments.push(newElements);
            fragments.push(',');
            const text = (0, cds_odata_annotation_converter_1.indent)(deIndent(fragments.join('')), {
                level: indentLevel + 1,
                skipFirstLine: true
            });
            this.insertText(range, text, indentLevel, firstInsert);
        }
        else {
            const anchor = this.findInsertPosition(content, parent, change.pointer, index ?? -1);
            if (!anchor) {
                return;
            }
            const fragments = [];
            if (firstInsert && anchor.commaPosition) {
                // for repeated inserts at the same spot we'll already have the trailing comma
                this.edits.push(odata_annotation_core_1.TextEdit.insert(anchor.commaPosition, ','));
            }
            fragments.push('\n');
            fragments.push(newElements);
            fragments.push(',');
            let finalText = fragments.join('');
            finalText = deIndent(finalText);
            const text = (0, cds_odata_annotation_converter_1.indent)(finalText, {
                level: indentLevel + 1,
                skipFirstLine: true
            });
            this.edits.push(odata_annotation_core_1.TextEdit.insert(anchor.position, text));
        }
    }
    insertText(range, text, indentLevel, firstInsert) {
        if (firstInsert) {
            this.edits.push(odata_annotation_core_1.TextEdit.replace(range, text + (0, cds_odata_annotation_converter_1.indent)('\n', { level: indentLevel, skipFirstLine: true })));
        }
        else {
            // Multiple inserts will have the same replacement range, we need to group them because
            // only one text edit with that replacement range can be applied.
            const edit = this.edits.find((edit) => isRangesEqual(edit.range, range));
            if (edit) {
                const lines = edit.newText.split('\n');
                lines[lines.length - 2] += text;
                edit.newText = lines.join('\n');
            }
        }
    }
    convertInsertNodeToTextEdits(content, parent, change, childIndentLevel, firstInsert) {
        if (!change) {
            return;
        }
        if (parent.type !== document_1.CDS_DOCUMENT_TYPE) {
            this.insertIntoNodeWithContent(content, parent, change, childIndentLevel, firstInsert);
        }
    }
    findInsertPosition(content, parent, insertionPointer, index = -1) {
        const childCount = (0, document_1.getChildCount)(parent);
        if (childCount === 0) {
            if (!parent.range) {
                return undefined;
            }
            const position = (0, cds_annotation_parser_1.copyPosition)(parent.range.start);
            position.character++; // range includes '{' or '[' characters
            return { position };
        }
        const i = index > -1 ? Math.min(index, childCount) : childCount;
        const { previousContentIndex, startContentIndex } = findContentIndices(content, i);
        const anchor = getStartAnchor(content, parent, previousContentIndex, startContentIndex);
        const previousElement = content[previousContentIndex];
        if (anchor) {
            if (previousElement?.type === 'element' &&
                !previousElement.trailingComma &&
                previousElement.element.range) {
                if (!skipCommaInsertion(this.changes, content, this.document, previousContentIndex)) {
                    return {
                        position: anchor,
                        commaPosition: (0, cds_annotation_parser_1.copyPosition)(previousElement.element.range.end)
                    };
                }
            }
            return { position: anchor };
        }
        return undefined;
    }
}
exports.CDSWriter = CDSWriter;
function willTargetAnnotationIncreaseIndent(changes, pointer) {
    const targetPointer = pointer.split('/').slice(0, 3).join('/');
    const conversionChange = changes.find((change) => change.pointer === targetPointer && change.type === change_1.CONVERT_TO_COMPOUND_ANNOTATION_CHANGE_TYPE);
    return !!conversionChange;
}
function convertToCompoundAnnotation(tokens, node, indentLevel, indentContent) {
    if (!node.range) {
        return [];
    }
    // All assignments are grouped to the same target, but we only need to replace the last one.
    const startPosition = node.assignments[node.assignments.length - 1]?.range?.start ?? node.range?.start;
    const startToken = (0, cds_compiler_tokens_1.findLastTokenBeforePosition)(ANNOTATION_START_PATTERN, tokens, startPosition);
    if (!startToken) {
        return [];
    }
    const nextToken = tokens[startToken.tokenIndex + 1];
    if (!nextToken || nextToken.text === '(') {
        return [];
    }
    // there can be trailing comma before the closing token ')' or ';'
    const afterEndToken = (0, cds_compiler_tokens_1.findFirstTokenAfterPosition)(/[^,]/, tokens, node.range?.end);
    // there should always be an afterEndToken
    // if it is an annotation on element then it would at least end with '}'
    // if it is an annotation on entity then it would be ';'
    if (!afterEndToken || afterEndToken.text === ')') {
        // either its a compound annotation or there is something else wrong and we should create text edits
        return [];
    }
    const endToken = (0, cds_compiler_tokens_1.findLastTokenBeforePosition)(undefined, tokens, node.range?.end);
    if (!endToken) {
        return [];
    }
    const indentText = '    '.repeat(indentLevel + 1);
    const closingIndent = '    '.repeat(indentLevel);
    const contentIndent = [];
    const startTokenLine = (0, cds_compiler_tokens_1.tokenLine)(startToken);
    const startTokenCharacter = (0, cds_compiler_tokens_1.tokenColumn)(startToken);
    const endTokenLine = (0, cds_compiler_tokens_1.tokenLine)(endToken);
    const endTokenCharacter = (0, cds_compiler_tokens_1.tokenColumn)(endToken);
    if (indentContent) {
        for (let index = startTokenLine + 1; index <= endTokenLine; index++) {
            contentIndent.push(odata_annotation_core_1.TextEdit.insert(odata_annotation_core_1.Position.create(index, 0), '    '));
        }
    }
    // if annotation ends with ';' we need to insert closing ')' before ';' otherwise we need to insert it after the last token
    // sometimes element annotations many end without ';'
    const afterEndTokenCharacter = (0, cds_compiler_tokens_1.tokenColumn)(afterEndToken);
    const afterEndTokenLine = (0, cds_compiler_tokens_1.tokenLine)(afterEndToken);
    const endCharacter = afterEndToken.text === ';' ? afterEndTokenCharacter : endTokenCharacter + endToken.text.length;
    const endReplaceRangeStart = odata_annotation_core_1.Position.create(endTokenLine, endCharacter);
    // if the closing '}' for element container is in the same line as the value it is likely there will be whitespace between,
    // we need to make sure that this whitespace is removed because `)` will be inserted in the same line
    const endReplaceRangeEnd = endTokenLine === afterEndTokenLine
        ? odata_annotation_core_1.Position.create(afterEndTokenLine, afterEndTokenCharacter)
        : endReplaceRangeStart;
    return [
        odata_annotation_core_1.TextEdit.insert(odata_annotation_core_1.Position.create(startTokenLine, startTokenCharacter + 1), `(\n${indentText}`),
        ...contentIndent,
        odata_annotation_core_1.TextEdit.replace(odata_annotation_core_1.Range.create(endReplaceRangeStart, endReplaceRangeEnd), `\n${closingIndent})`)
    ];
}
function deleteBlock(edits, content, blockIndex) {
    const block = content[blockIndex];
    if (block?.type !== 'element') {
        return;
    }
    edits.push(odata_annotation_core_1.TextEdit.del(block.range));
    const previous = content[blockIndex - 1];
    const next = content[blockIndex + 1];
    if (previous?.range) {
        removeWhitespaceForConsequentDeletes(edits, content, blockIndex, block, next);
        // if the last child element is being deleted then white space between the last and previous should be removed as well
        deletePreviousElementWhiteSpaces(previous, block, edits);
    }
    else if (next?.range) {
        // there could be whitespace to the next element which should be removed
        edits.push(odata_annotation_core_1.TextEdit.del(odata_annotation_core_1.Range.create(block.range.end, next.range.start)));
    }
}
function removeWhitespaceForConsequentDeletes(edits, content, blockIndex, block, next) {
    let hasDeleteSequence = true;
    for (let i = 0; i <= blockIndex; i++) {
        const prev = content[i];
        if (!edits.some((item) => isRangesEqual(item.range, prev.range))) {
            hasDeleteSequence = false;
            break;
        }
    }
    if (hasDeleteSequence && next?.range) {
        const edit = odata_annotation_core_1.TextEdit.del(odata_annotation_core_1.Range.create(block.range.end, next.range.start));
        // other deletion edits with the same range may already exist
        if (!edits.some((item) => isRangesEqual(item.range, edit.range))) {
            edits.push(edit);
        }
    }
}
function deletePreviousElementWhiteSpaces(previousElement, currentBlock, edits) {
    const edit = odata_annotation_core_1.TextEdit.del(odata_annotation_core_1.Range.create(previousElement.range.end, currentBlock.range.start));
    // other deletion edits with the same range may already exist
    if (!edits.some((item) => isRangesEqual(item.range, edit.range))) {
        edits.push(edit);
    }
}
function deleteValue(edits, pointer, astNode, parent, comments, tokens, lastIndex) {
    if (parent.type === cds_annotation_parser_1.COLLECTION_TYPE) {
        if (!lastIndex) {
            throw new error_1.ApiError(`${pointer} is not pointing to a collection element.`);
        }
        const content = getContainerContent(parent, comments, tokens);
        const index = Number.parseInt(lastIndex, 10);
        const { startContentIndex } = findContentIndices(content, index);
        deleteBlock(edits, content, startContentIndex);
    }
    else if (parent.type === cds_annotation_parser_1.RECORD_TYPE &&
        (astNode.type === cds_annotation_parser_1.RECORD_PROPERTY_TYPE || astNode.type === cds_annotation_parser_1.ANNOTATION_TYPE)) {
        if (!lastIndex) {
            throw new error_1.ApiError(`${pointer} is not pointing to a record property.`);
        }
        const content = getContainerContent(parent, comments, tokens);
        const index = Number.parseInt(lastIndex, 10);
        const { startContentIndex } = findContentIndices(content, index, index, astNode.type);
        deleteBlock(edits, content, startContentIndex);
    }
    else if (parent.type === cds_annotation_parser_1.ANNOTATION_TYPE || parent.type === cds_annotation_parser_1.RECORD_PROPERTY_TYPE) {
        // delete record value including ':'
        if (parent.colon?.range && astNode.range) {
            const range = odata_annotation_core_1.Range.create(parent.colon.range.start, astNode.range.end);
            edits.push(odata_annotation_core_1.TextEdit.del(range));
        }
    }
    else {
        throw new error_1.ApiError(`Invalid ${pointer} for 'delete-record' change.`);
    }
}
function printChange(parent, referenceNode) {
    return function (change) {
        if (change.type === change_1.INSERT_EMBEDDED_ANNOTATION_CHANGE_TYPE) {
            if (referenceNode) {
                const element = (0, preprocessor_1.createReferenceElement)(referenceNode);
                if (element) {
                    return (0, cds_odata_annotation_converter_1.print)(change.element, printOptions, {
                        indentResult: false,
                        annotationContext: [element]
                    });
                }
            }
            return '@' + (0, cds_odata_annotation_converter_1.print)(change.element, printOptions);
        }
        else if (change.type === change_1.INSERT_PRIMITIVE_VALUE_TYPE) {
            const text = change.element.content[0]?.type === odata_annotation_core_1.TEXT_TYPE ? change.element.content[0].text : '';
            return (0, cds_odata_annotation_converter_1.printPrimitiveValue)(change.element.name, text);
        }
        else if (parent?.type === cds_annotation_parser_1.RECORD_TYPE && change.element.name === "Annotation" /* Edm.Annotation */) {
            return (0, cds_odata_annotation_converter_1.print)(change.element, printOptions);
        }
        else {
            return (0, cds_odata_annotation_converter_1.print)(change.element, printOptions);
        }
    };
}
function getIndexForInsertion(containerSize, insertionIndex) {
    return insertionIndex !== undefined && insertionIndex > -1
        ? Math.min(insertionIndex, containerSize)
        : containerSize;
}
function getCommas(container, tokens) {
    if (container.type === cds_odata_annotation_converter_1.TARGET_TYPE) {
        if (!container.range) {
            return [];
        }
        return extractCommasFromCompilerTokens(container.range, container.assignments, tokens);
    }
    else {
        return container.commas;
    }
}
function extractCommasFromCompilerTokens(range, items, tokens) {
    const result = [];
    const { start, end } = range;
    const startTokenIndex = tokens.findIndex((0, cds_compiler_tokens_1.matchTokenByStart)(start));
    for (let i = startTokenIndex; i < tokens.length; i++) {
        const token = tokens[i];
        const tokenRange = (0, cds_compiler_tokens_1.createTokenRange)(token);
        if (token.text === ',' && !items.some((item) => item.range && (0, odata_annotation_core_1.rangeContained)(item.range, tokenRange))) {
            // we are only interested in commas separating items -> ignore commas that are inside an item
            result.push({
                type: 'token',
                value: ',',
                range: tokenRange
            });
        }
        if ((0, cds_compiler_tokens_1.isOldToken)(token)) {
            if ((token.line === end.line + 1 && token.column >= end.character) || token.line > end.line + 1) {
                break;
            }
        }
        else if ((token.location.line === end.line + 1 && token.location.col >= end.character + 1) ||
            token.location.line > end.line + 1) {
            break;
        }
    }
    return result;
}
function getStartAnchor(content, parent, previous, index) {
    const previousElement = content[previous];
    let startPosition = index === 0 ? parent.range?.start : previousElement?.range?.end;
    const element = content[index];
    if (startPosition) {
        startPosition = (0, cds_annotation_parser_1.copyPosition)(startPosition);
        if (index === 0) {
            startPosition.character++;
        }
    }
    if (!startPosition) {
        return undefined;
    }
    if (!element && previousElement?.type === 'element') {
        return startPosition;
    }
    const previousItem = content[index - 1];
    if (previousItem?.type === 'comment') {
        // multiple comments between previous item and starting item -> ignore them
        updatePosition(startPosition, previousItem.range.end);
    }
    return startPosition;
}
function serializeReference(data) {
    if (data.namespace) {
        if (data.alias) {
            return `using ${data.namespace} as ${data.alias} from '${data.referenceUri}';`;
        }
        else {
            return `using ${data.namespace} from '${data.referenceUri}';`;
        }
    }
    else {
        return `using from '${data.referenceUri}';`;
    }
}
async function getTextEditForMissingRefs(missingReferences, fileUri, projectRoot) {
    const missingReferencesTexts = [];
    for (const missingRef of missingReferences) {
        const relativePath = (0, node_path_1.relative)(projectRoot, (0, node_url_1.fileURLToPath)(fileUri));
        const referenceUri = await (0, project_access_1.toReferenceUri)(projectRoot, relativePath, missingRef);
        missingReferencesTexts.push(serializeReference({ namespace: '', referenceUri }));
    }
    return missingReferencesTexts.join('\n') + '\n';
}
function isRangesEqual(range1, range2) {
    if (!range1 || !range2) {
        return false;
    }
    return (range1.start.line === range2.start.line &&
        range1.start.character === range2.start.character &&
        range1.end.line === range2.end.line &&
        range1.end.character === range2.end.character);
}
function convertCDSAstToEdmType(kind) {
    switch (kind) {
        case 'time':
            return "TimeOfDay" /* Edm.TimeOfDay */;
        case 'date':
            return "Date" /* Edm.Date */;
        case 'timestamp':
            return "DateTimeOffset" /* Edm.DateTimeOffset */;
        case 'binary':
            return "Binary" /* Edm.Binary */;
        case 'path':
            return "Path" /* Edm.Path */;
        case 'boolean':
            return "Bool" /* Edm.Bool */;
        case 'string':
            return "String" /* Edm.String */;
        case 'enum':
            return "EnumMember" /* Edm.EnumMember */;
        case 'number':
            return "Decimal" /* Edm.Decimal */;
        default:
            return undefined;
    }
}
function deIndent(text) {
    return text
        .split('\n')
        .map((val) => val.trimStart())
        .join('\n');
}
function getInsertReferencePosition(references) {
    const range = references[references.length - 1]?.uriRange;
    if (!range) {
        return { position: odata_annotation_core_1.Position.create(0, 0), prependNewLine: false };
    }
    const position = (0, cds_annotation_parser_1.copyPosition)(range.end);
    // reference last position includes its last character, we need to insert after it.
    position.character++;
    return { position, prependNewLine: true };
}
function createElementRanges(document, tokens, pointers) {
    const ranges = [];
    const groups = pointers.reduce((acc, pointer) => {
        const segments = pointer.split('/');
        // remove /items/<index> suffix
        const containerPath = segments.slice(0, -2).join('/');
        const index = Number.parseInt(segments.slice(-1)[0], 10);
        const list = acc.get(containerPath);
        if (list) {
            list.push(index);
        }
        else {
            acc.set(containerPath, [index]);
        }
        return acc;
    }, new Map());
    for (const [containerPath, indices] of groups) {
        const [parent] = (0, pointer_1.getAstNodesFromPointer)(document, containerPath).reverse();
        if (parent?.type === cds_annotation_parser_1.COLLECTION_TYPE) {
            const indentLevel = (0, indent_1.getIndentLevelFromNode)(tokens, parent);
            indices.sort((index1, index2) => index1 - index2);
            for (let i = 1, start = indices[0], end = indices[0]; i <= indices.length; i++) {
                const current = indices[i];
                if (current === undefined) {
                    // end of collection
                    ranges.push({ parent, start, end, indentLevel });
                }
                else if (end + 1 === current) {
                    // indices are in sequence -> merge
                    end = current;
                }
                else {
                    // there is a gap between indices -> create a range
                    ranges.push({ parent, start, end, indentLevel });
                    start = end = current;
                }
            }
        }
    }
    return ranges;
}
function getTextEditsForMove(document, comments, tokens, changes, cdsDocument, position, ranges, indentLevel) {
    const edits = [];
    const text = [];
    for (const range of ranges) {
        const sourceContent = getContainerContent(range.parent, comments, tokens);
        cutRange(document, changes, cdsDocument, sourceContent, range, indentLevel, text, edits);
    }
    edits.push(odata_annotation_core_1.TextEdit.insert(position, ''.concat(...text)));
    return edits;
}
function findContentIndices(content, start, end = start, nodeType) {
    let previousContentIndex = -1;
    let startContentIndex = -1;
    let endContentIndex = -1;
    for (let index = 0, contentIndex = 0; index < content.length; index++) {
        const element = content[index];
        if (element.type === 'element' && (!nodeType || element.element.type === nodeType)) {
            if (start - 1 === contentIndex) {
                previousContentIndex = index;
            }
            if (start === contentIndex) {
                startContentIndex = index;
            }
            if (end === contentIndex) {
                endContentIndex = index;
                break;
            }
            contentIndex++;
        }
    }
    return {
        previousContentIndex,
        startContentIndex,
        endContentIndex
    };
}
function isComma(token) {
    return token?.type === 'token' && token.value === ',';
}
function findDeletionChange(document, changes, range) {
    return changes.some((change) => {
        if (change.type.startsWith('delete-')) {
            const [leaf] = (0, pointer_1.getAstNodesFromPointer)(document, change.pointer).reverse();
            if (leaf?.range) {
                return (0, odata_annotation_core_1.rangeContained)(leaf.range, range);
            }
        }
        return false;
    });
}
function cutRange(textDocument, changes, cdsDocument, content, cutRange, indentLevel, text, edits) {
    const { parent, start, end } = cutRange;
    const { previousContentIndex, endContentIndex } = findContentIndices(content, start, end);
    const previousElement = content[previousContentIndex];
    const endElement = content[endContentIndex];
    let startPosition = start === 0 ? parent.openToken?.range?.end : previousElement?.range?.end;
    let endPosition = endElement?.range?.end;
    if (startPosition) {
        startPosition = (0, cds_annotation_parser_1.copyPosition)(startPosition);
    }
    if (endPosition) {
        endPosition = (0, cds_annotation_parser_1.copyPosition)(endPosition);
    }
    if (!startPosition || !endPosition) {
        return;
    }
    let suffix;
    if (endElement?.type === 'element') {
        if (!endElement.trailingComma && endElement.trailingComment && endElement.element.range) {
            // ...} // some comment
            // ___|_______________|
            //  |        |
            // cut    suffix  range
            const range = (0, cds_annotation_parser_1.copyRange)(odata_annotation_core_1.Range.create(endElement.element.range.end, endElement.trailingComment.range.end));
            if (!findDeletionChange(cdsDocument, changes, range)) {
                edits.push(odata_annotation_core_1.TextEdit.del(range));
            }
            suffix = ',' + textDocument.getText(range);
            updatePosition(endPosition, endElement.element.range.end);
        }
        else if (!endElement.trailingComma) {
            // ...}
            suffix = ',';
        }
    }
    const range = (0, cds_annotation_parser_1.copyRange)(odata_annotation_core_1.Range.create(startPosition, endPosition));
    const originalText = textDocument.getText(range);
    text.push(makeCut(originalText, suffix, cutRange, indentLevel));
    if (!findDeletionChange(cdsDocument, changes, range)) {
        edits.push(odata_annotation_core_1.TextEdit.del(range));
    }
}
function makeCut(originalText, suffix, cutRange, indentLevel) {
    let cut = originalText;
    const difference = indentLevel - cutRange.indentLevel;
    if (difference > 0) {
        const indent = '    '.repeat(difference);
        cut = cut.replaceAll('\n', '\n' + indent);
    }
    else if (difference < 0) {
        const indent = '    '.repeat(difference * -1);
        cut = cut.replaceAll('\n' + indent, '\n');
    }
    if (suffix !== undefined) {
        return cut + suffix;
    }
    else {
        return cut;
    }
}
function updatePosition(a, b) {
    a.line = b.line;
    a.character = b.character;
}
function getContainerContent(collection, comments, tokens) {
    if (!collection.range) {
        return [];
    }
    const items = (0, document_1.getItems)(collection);
    const commas = getCommas(collection, tokens);
    const commentsInContent = (collection.range !== undefined
        ? comments.filter((comment) => (0, odata_annotation_core_1.rangeContained)(collection.range, comment.range))
        : []).filter((comment) => !items.some((item) => item.range && (0, odata_annotation_core_1.rangeContained)(item.range, comment.range)));
    const source = [...commas, ...items, ...commentsInContent].sort(utils_1.compareByRange);
    const content = [];
    for (const node of source) {
        processNode(content, node);
    }
    return content;
}
function processNode(content, item) {
    const previousItem = content[content.length - 1];
    if (!item.range) {
        return;
    }
    if (isComma(item)) {
        if (previousItem?.type === 'element') {
            previousItem.trailingComma = item;
            updatePosition(previousItem.range.end, item.range.end);
        }
        else {
            content.push(item);
        }
    }
    else if (item.type === 'comment') {
        if (previousItem?.type === 'element' && item.range.start.line === previousItem.range.end.line) {
            previousItem.trailingComment = item;
            updatePosition(previousItem.range.end, item.range.end);
        }
        else {
            content.push(item);
        }
    }
    else {
        const element = {
            type: 'element',
            element: item,
            elementRange: (0, cds_annotation_parser_1.copyRange)(item.range),
            range: (0, cds_annotation_parser_1.copyRange)(item.range)
        };
        const previousLine = element.range.start.line - 1;
        if (previousItem?.type === 'comment' &&
            (previousItem.range.end.line === previousLine || previousItem.range.end.line === element.range.start.line)) {
            // typescript can't infer that content.pop() === previousItem
            element.leadingComment = content.pop();
            updatePosition(element.range.start, previousItem.range.start);
        }
        content.push(element);
    }
}
function skipCommaInsertion(changes, content, document, insertAfterIndex) {
    return !!changes.find((change) => {
        if (!change.type.startsWith('delete')) {
            return false;
        }
        const astNodes = (0, pointer_1.getAstNodesFromPointer)(document, change.pointer);
        const toBeDeletedNodes = astNodes[astNodes.length - 1];
        const node = content[insertAfterIndex];
        if (node.type === 'element' && node?.element === toBeDeletedNodes) {
            if (toBeDeletedNodes.type === cds_annotation_parser_1.ANNOTATION_TYPE && content.length === 1) {
                return false;
            }
            return true;
        }
        else {
            return false;
        }
    });
}
//# sourceMappingURL=writer.js.map