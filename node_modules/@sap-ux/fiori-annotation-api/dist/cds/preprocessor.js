"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessChanges = preprocessChanges;
exports.createReferenceElement = createReferenceElement;
const odata_annotation_core_types_1 = require("@sap-ux/odata-annotation-core-types");
const cds_odata_annotation_converter_1 = require("@sap-ux/cds-odata-annotation-converter");
const cds_annotation_parser_1 = require("@sap-ux/cds-annotation-parser");
const change_1 = require("./change");
const document_1 = require("./document");
const pointer_1 = require("./pointer");
const cds_compiler_tokens_1 = require("./cds-compiler-tokens");
const odata_annotation_core_1 = require("@sap-ux/odata-annotation-core");
/**
 *
 */
class ChangePreprocessor {
    document;
    input;
    tokens;
    commands = new Map();
    /**
     *
     * @param document - CDS document object.
     * @param input - CDS document changes.
     * @param tokens - All tokens in the document.
     */
    constructor(document, input, tokens) {
        this.document = document;
        this.input = input;
        this.tokens = tokens;
    }
    /**
     * Optimizes changes to remove duplicates and conflicting changes.
     *
     * @returns Optimized CDS document changes.
     */
    run() {
        this.normalizeInsertIndex();
        this.removeDuplicates();
        this.combineInsertsWithDeletions();
        this.expandToCompoundAnnotations();
        this.mergeDeletes();
        const result = [];
        for (let index = 0; index < this.input.length; index++) {
            const change = this.input[index];
            const command = this.commands.get(index);
            if (command?.type === 'drop') {
                continue;
            }
            else if (command?.type === 'replace') {
                result.push(...command.changes);
            }
            else if (command === undefined || command?.type === 'pick') {
                result.push(change);
            }
        }
        this.adjustMoveIndices(result); // for this to correctly work we need the final delete changes with adjusted pointers
        return result;
    }
    /**
     * Makes sure that inserts in an empty container have the same insert positions.
     */
    normalizeInsertIndex() {
        for (let i = 0; i < this.input.length; i++) {
            const change = this.input[i];
            const [parent] = (0, pointer_1.getAstNodesFromPointer)(this.document, change.pointer).reverse();
            if (!parent ||
                (parent.type !== cds_annotation_parser_1.COLLECTION_TYPE &&
                    parent.type !== cds_annotation_parser_1.RECORD_TYPE &&
                    parent.type !== cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE &&
                    parent.type !== odata_annotation_core_types_1.TARGET_TYPE)) {
                continue;
            }
            if ((0, document_1.getChildCount)(parent) > 0 ||
                ![
                    change_1.INSERT_RECORD_CHANGE_TYPE,
                    change_1.INSERT_ANNOTATION_CHANGE_TYPE,
                    change_1.INSERT_EMBEDDED_ANNOTATION_CHANGE_TYPE,
                    change_1.INSERT_RECORD_PROPERTY_CHANGE_TYPE,
                    change_1.INSERT_PRIMITIVE_VALUE_TYPE,
                    change_1.INSERT_TARGET_CHANGE_TYPE
                ].includes(change.type)) {
                continue;
            }
            const newChange = structuredClone(change);
            newChange.index = 0;
            this.commands.set(i, {
                type: 'replace',
                changes: [newChange]
            });
        }
    }
    removeDuplicates() {
        for (let index = this.input.length - 1; index >= 0; index--) {
            const currentChange = this.input[index];
            if (!currentChange.type.startsWith('delete') &&
                !currentChange.type.startsWith('replace') &&
                currentChange.type !== change_1.UPDATE_PRIMITIVE_VALUE_CHANGE_TYPE &&
                currentChange.type !== change_1.SET_FLAGS_CHANGE_TYPE) {
                continue;
            }
            for (let j = 0; j < index; j++) {
                const otherChange = this.input[j];
                const isOtherChangeDestructive = otherChange.type.startsWith('delete') || otherChange.type.startsWith('replace');
                if (index !== j &&
                    ((currentChange.type === otherChange.type && currentChange.pointer === otherChange.pointer) ||
                        // if parent element is modified, child can't be modified => drop child changes
                        (isOtherChangeDestructive && isChildOf(otherChange.pointer, currentChange.pointer)))) {
                    this.commands.set(j, {
                        type: 'drop'
                    });
                }
                else if (index !== j &&
                    isOtherChangeDestructive &&
                    // child property change is after parent property deletion => drop child change
                    isChildOf(currentChange.pointer, otherChange.pointer)) {
                    this.commands.set(index, {
                        type: 'drop'
                    });
                }
            }
        }
    }
    processChangesInputEntry(deletionMap, insertionMap, index) {
        const command = this.commands.get(index);
        if (command?.type === 'drop') {
            // if the change is already dropped it is not relevant for further processing
            return;
        }
        const change = this.input[index];
        if (change.type === change_1.DELETE_TARGET_CHANGE_TYPE) {
            const deletionsInParent = (deletionMap[change.pointer] ??= []);
            deletionsInParent.push({
                change,
                index
            });
        }
        if (change.type === change_1.DELETE_ANNOTATION_CHANGE_TYPE ||
            change.type === change_1.DELETE_ANNOTATION_GROUP_CHANGE_TYPE ||
            change.type === change_1.DELETE_EMBEDDED_ANNOTATION_CHANGE_TYPE ||
            change.type === change_1.DELETE_RECORD_PROPERTY_CHANGE_TYPE) {
            const parentPointer = change.pointer.split('/').slice(0, -2).join('/');
            const realPointer = parentPointer === '' ? change.pointer : parentPointer;
            const deletionsInParent = (deletionMap[realPointer] ??= []);
            deletionsInParent.push({
                change,
                index
            });
        }
        if (change.type === change_1.DELETE_ANNOTATION_GROUP_ITEMS_CHANGE_TYPE) {
            const parentPointer = change.pointer.split('/').slice(0, -1).join('/');
            const deletionsInParent = (deletionMap[parentPointer] ??= []);
            deletionsInParent.push({
                change,
                index
            });
        }
        if (change.type === change_1.INSERT_RECORD_PROPERTY_CHANGE_TYPE ||
            change.type === change_1.INSERT_EMBEDDED_ANNOTATION_CHANGE_TYPE ||
            change.type === change_1.INSERT_ANNOTATION_CHANGE_TYPE) {
            insertionMap[change.pointer] = true;
        }
    }
    mergeDeletes() {
        const deletionMap = {};
        const insertionMap = {};
        // optimize deletion changes
        for (let index = 0; index < this.input.length; index++) {
            this.processChangesInputEntry(deletionMap, insertionMap, index);
        }
        this.processDeletionMap(deletionMap, insertionMap);
    }
    processDeletionMap(deletionMap, insertionMap) {
        while (Object.keys(deletionMap).length > 0) {
            // picking longest pointer ensures that the deletion changes are bubbling up
            const parentPointer = Object.keys(deletionMap).reduce((longest, pointer) => (longest.split('/').length < pointer.split('/').length ? pointer : longest), '/');
            const [parent, grandParent, greatGrandParent] = (0, pointer_1.getAstNodesFromPointer)(this.document, parentPointer).reverse();
            if (parent?.type === cds_annotation_parser_1.RECORD_TYPE) {
                this.processRecordDeletion(parent, grandParent, greatGrandParent, parentPointer, deletionMap, insertionMap);
            }
            else if (parent?.type === odata_annotation_core_types_1.TARGET_TYPE) {
                this.processTargetDeletion(parent, parentPointer, deletionMap, insertionMap);
            }
            else if (parent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_TYPE && grandParent?.type === odata_annotation_core_types_1.TARGET_TYPE) {
                this.processAnnotationGroupDeletion(parent, grandParent, parentPointer, deletionMap, insertionMap);
            }
            else if (parent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE &&
                grandParent.type === cds_annotation_parser_1.ANNOTATION_GROUP_TYPE &&
                greatGrandParent?.type === odata_annotation_core_types_1.TARGET_TYPE) {
                this.processAnnotationGroupItemsDeletion(parent, grandParent, parentPointer, deletionMap, insertionMap);
            }
            delete deletionMap[parentPointer];
        }
    }
    processRecordDeletion(parent, grandParent, greatGrandParent, parentPointer, deletionMap, insertionMap) {
        const childPointers = new Set([
            ...parent.properties.map((_, i) => `${parentPointer}/properties/${i}`),
            ...(parent.annotations ?? []).map((_, i) => `${parentPointer}/annotations/${i}`)
        ]);
        for (const indexedValue of deletionMap[parentPointer]) {
            childPointers.delete(indexedValue.change.pointer);
        }
        if (childPointers.size === 0 && !insertionMap[parentPointer]) {
            this.bubbleUpDeleteChange(deletionMap, grandParent, greatGrandParent, parentPointer);
        }
    }
    processTargetDeletion(parent, parentPointer, deletionMap, insertionMap) {
        const childPointers = new Set([...parent.assignments.map((_, i) => `${parentPointer}/assignments/${i}`)]);
        for (const indexedValue of deletionMap[parentPointer]) {
            childPointers.delete(indexedValue.change.pointer);
        }
        if (childPointers.size === 0 && !insertionMap[parentPointer]) {
            this.bubbleUpDeleteChange(deletionMap, parent, undefined, parentPointer);
        }
    }
    processAnnotationGroupDeletion(parent, grandParent, parentPointer, deletionMap, insertionMap) {
        if (!insertionMap[parentPointer]) {
            // most probably this if-check is redundant but is left just for safety reasons
            this.bubbleUpDeleteChange(deletionMap, parent, grandParent, parentPointer);
        }
    }
    processAnnotationGroupItemsDeletion(parent, grandParent, parentPointer, deletionMap, insertionMap) {
        const childPointers = new Set([...parent.items.map((_, i) => `${parentPointer}/items/${i}`)]);
        for (const indexedValue of deletionMap[parentPointer]) {
            childPointers.delete(indexedValue.change.pointer);
        }
        if (childPointers.size === 0 &&
            !insertionMap[parentPointer] &&
            !insertionMap[parentPointer.split('/').slice(0, -1).join('/')]) {
            this.bubbleUpDeleteChange(deletionMap, parent, grandParent, parentPointer);
        }
    }
    bubbleUpDeleteChange(deletionMap, grandParent, greatGrandParent, parentPointer) {
        // no more children => delete record
        // propagate change of the parent up (if required)
        // only skip for collection entries
        const lastChange = this.dropMergedDeletionChanges(deletionMap[parentPointer]);
        if (lastChange === -1 || !grandParent) {
            return;
        }
        const nextParentPointer = this.getBubbleUpParentPointer(grandParent, greatGrandParent, parentPointer);
        const newChange = this.getMergedChange(grandParent, parentPointer, greatGrandParent);
        if (!newChange) {
            return;
        }
        if (nextParentPointer) {
            const deletionsInParent = (deletionMap[nextParentPointer] ??= []);
            deletionsInParent.push({
                change: newChange,
                index: lastChange
            });
        }
        this.commands.set(lastChange, {
            type: 'replace',
            changes: [newChange]
        });
    }
    getBubbleUpParentPointer(grandParent, greatGrandParent, parentPointer) {
        if (greatGrandParent?.type === cds_annotation_parser_1.RECORD_TYPE) {
            return parentPointer.split('/').slice(0, -3).join('/');
        }
        else if (greatGrandParent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE) {
            return parentPointer.split('/').slice(0, -3).join('/');
        }
        else if (grandParent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE &&
            greatGrandParent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_TYPE) {
            return parentPointer.split('/').slice(0, -1).join('/');
        }
        else if (greatGrandParent?.type === odata_annotation_core_types_1.TARGET_TYPE) {
            if (grandParent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_TYPE) {
                return parentPointer.split('/').slice(0, -2).join('/');
            }
            else {
                return parentPointer.split('/').slice(0, -3).join('/');
            }
        }
        return undefined;
    }
    getMergedChange(grandParent, parentPointer, greatGrandParent) {
        const grandParentPointer = parentPointer.split('/').slice(0, -1).join('/');
        if (grandParent.type === cds_annotation_parser_1.ANNOTATION_TYPE) {
            if (greatGrandParent?.type === odata_annotation_core_types_1.TARGET_TYPE || greatGrandParent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE) {
                return (0, change_1.createDeleteAnnotationChange)(grandParentPointer);
            }
            else {
                return (0, change_1.createDeleteEmbeddedChange)(grandParentPointer);
            }
        }
        else if (grandParent.type === cds_annotation_parser_1.RECORD_PROPERTY_TYPE) {
            return (0, change_1.createDeleteRecordPropertyChange)(grandParentPointer);
        }
        else if (grandParent.type === cds_annotation_parser_1.COLLECTION_TYPE) {
            return (0, change_1.createDeleteRecordChange)(parentPointer);
        }
        else if (grandParent.type === odata_annotation_core_types_1.TARGET_TYPE) {
            return (0, change_1.createDeleteTargetChange)(parentPointer);
        }
        else if (grandParent.type === cds_annotation_parser_1.ANNOTATION_GROUP_TYPE) {
            return (0, change_1.createDeleteAnnotationGroupChange)(parentPointer);
        }
        else if (grandParent.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE) {
            return (0, change_1.createDeleteAnnotationGroupItemsChange)(grandParentPointer);
        }
        return undefined;
    }
    /**
     * Avoid conflicting insert and deletion changes for the same position.
     */
    combineInsertsWithDeletions() {
        // Inserts are usually merged together, so we need to replace the last insert of the batch for the same index
        for (let i = 0; i < this.input.length; i++) {
            const change = this.input[i];
            const [parent, grandParent] = (0, pointer_1.getAstNodesFromPointer)(this.document, change.pointer).reverse();
            if (change.type === change_1.INSERT_ANNOTATION_CHANGE_TYPE &&
                (parent?.type === odata_annotation_core_types_1.TARGET_TYPE || parent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE)) {
                const pointerFragments = [change.pointer];
                if (parent.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE) {
                    const index = change.index ?? parent.items.length - 1;
                    pointerFragments.push(index.toString());
                }
                else {
                    const index = change.index ?? parent.assignments.length - 1;
                    pointerFragments.push('assignments');
                    pointerFragments.push(index.toString());
                }
                const pointer = pointerFragments.join('/');
                // merge inserts and deletions
                const deletionChangeIndex = this.input.findIndex((c) => c.pointer === pointer && c.type === change_1.DELETE_ANNOTATION_CHANGE_TYPE);
                const command = this.commands.get(deletionChangeIndex);
                if (command?.type === 'drop') {
                    continue;
                }
                if (deletionChangeIndex !== -1) {
                    this.createReplaceCommand(pointer, change, deletionChangeIndex, i);
                }
            }
            else if (change.type === change_1.INSERT_EMBEDDED_ANNOTATION_CHANGE_TYPE &&
                (grandParent?.type === odata_annotation_core_types_1.TARGET_TYPE || grandParent?.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE)) {
                // currently this is not supported for longer deeper structures
                // e.g multiple levels of annotations on an annotation with a primitive value
                const index = change.index ??
                    (grandParent.type === cds_annotation_parser_1.ANNOTATION_GROUP_ITEMS_TYPE
                        ? grandParent.items.length - 1
                        : grandParent.assignments.length - 1);
                const pointer = `${change.pointer.split('/').slice(0, -1).join('/')}/${index}`;
                const deletionChangeIndex = this.input.findIndex((c) => c.pointer === pointer && c.type === change_1.DELETE_ANNOTATION_CHANGE_TYPE);
                const command = this.commands.get(deletionChangeIndex);
                if (command?.type === 'drop') {
                    continue;
                }
                if (deletionChangeIndex !== -1) {
                    this.flattenAnnotationTerm(change, parent);
                    this.createReplaceCommand(pointer, change, deletionChangeIndex, i);
                }
            }
        }
    }
    createReplaceCommand(pointer, change, deletionChangeIndex, changeIndex) {
        this.commands.set(changeIndex, {
            type: 'replace',
            changes: [(0, change_1.createReplaceNodeChange)(pointer, change.element)]
        });
        this.commands.set(deletionChangeIndex, {
            type: 'drop'
        });
    }
    flattenAnnotationTerm(change, parent) {
        const element = createReferenceElement(parent);
        const last = structuredClone(change.element);
        delete last.attributes["Qualifier" /* Edm.Qualifier */];
        const context = [last];
        if (element) {
            context.unshift(element);
            const term = (0, odata_annotation_core_1.getElementAttribute)(change.element, "Term" /* Edm.Term */);
            if (term) {
                term.value = (0, cds_odata_annotation_converter_1.printKey)(context);
            }
        }
    }
    expandToCompoundAnnotations() {
        // Inserts are usually merged together, so we need to replace the last insert of the batch for the same index
        const handledAssignments = new Set();
        // we need to start from the end because the conversion change should come after last insert
        for (let i = this.input.length - 1; i >= 0; i--) {
            const change = this.input[i];
            const path = (0, pointer_1.getAstNodesFromPointer)(this.document, change.pointer);
            const [parent, grandParent] = path.toReversed();
            let pointer = change.pointer;
            let target = parent;
            if (change.type === change_1.INSERT_EMBEDDED_ANNOTATION_CHANGE_TYPE &&
                parent.type === cds_annotation_parser_1.ANNOTATION_TYPE &&
                grandParent.type === odata_annotation_core_types_1.TARGET_TYPE &&
                path.length === 2) {
                // annotations on top level annotations will be appended to the current assignment
                // update pointer to target
                target = grandParent;
                pointer = change.pointer.split('/').slice(0, -2).join('/');
            }
            else if (change.type !== change_1.INSERT_ANNOTATION_CHANGE_TYPE || target?.type !== odata_annotation_core_types_1.TARGET_TYPE) {
                continue;
            }
            const command = this.commands.get(i);
            if (command && command.type !== 'pick') {
                // if the change is replaced or dropped we shouldn't do anything
                continue;
            }
            if (!handledAssignments.has(pointer)) {
                handledAssignments.add(pointer);
                // make sure that the assignment isn't already a compound assignment
                const startPosition = target.assignments[target.assignments.length - 1]?.range?.start ?? target.range?.start;
                if (!startPosition) {
                    continue;
                }
                const startToken = (0, cds_compiler_tokens_1.findLastTokenBeforePosition)(/^@/i, this.tokens, startPosition);
                if (!startToken) {
                    continue;
                }
                const nextToken = this.tokens[startToken.tokenIndex + 1];
                if (!nextToken || nextToken.text === '(') {
                    continue;
                }
                const deletion = this.input.find((c) => (c.type.startsWith('delete') || c.type.startsWith('replace')) && c.pointer.startsWith(pointer));
                this.commands.set(i, {
                    type: 'replace',
                    changes: [change, (0, change_1.createConvertToCompoundAnnotationChange)(pointer, deletion === undefined)]
                });
            }
        }
    }
    dropMergedDeletionChanges(index) {
        let lastChange = -1;
        for (const indexedValue of index) {
            if (indexedValue.index > lastChange) {
                lastChange = indexedValue.index;
            }
            this.commands.set(indexedValue.index, { type: 'drop' });
        }
        return lastChange;
    }
    adjustMoveIndices(changes) {
        // there is a non standard case where an item is moved to position that is after deleted item
        // it interferes with deletion logic and would be more difficult to handle it during text edit generation
        // the expected text is the same as if we would insert before the deleted item, so we adjust the move index here
        const moves = [];
        const deletes = [];
        for (const change of changes) {
            if (change.type === change_1.MOVE_COLLECTION_VALUE_CHANGE_TYPE) {
                moves.push(change);
            }
            else if (change.type === change_1.DELETE_RECORD_CHANGE_TYPE) {
                deletes.push(change);
            }
        }
        if (moves.length === 0 || deletes.length === 0) {
            return;
        }
        for (const move of moves) {
            if (move.index === undefined) {
                // it will be inserted at the start, not relevant case
                continue;
            }
            const pointer = `${move.pointer}/items/${move.index - 1}`;
            const match = deletes.find((change) => change.pointer === pointer);
            if (match) {
                move.index--;
            }
        }
    }
}
/**
 * Checks if pointer of first element is a child of the second one.
 *
 * @param child - Pointer to the child.
 * @param parent - Pointer to the parent.
 * @returns True if first pointer is a child of the second pointer.
 */
function isChildOf(child, parent) {
    const childSegments = child.split('/');
    const parentSegments = parent.split('/');
    if (childSegments.length < parentSegments.length) {
        return false;
    }
    for (let index = 0; index < parentSegments.length; index++) {
        const parentSegment = parentSegments[index];
        const childSegment = childSegments[index];
        if (childSegment !== parentSegment) {
            return false;
        }
    }
    return true;
}
/**
 * Prepares changes so that they can be processed sequentially without interfering with each other.
 * This includes removing duplicates, merging deletions etc.
 *
 * @param document - CDS document.
 * @param changes - CDS document changes.
 * @param tokens - All tokens in the document.
 * @returns Optimized CDS document changes.
 */
function preprocessChanges(document, changes, tokens) {
    //
    const preprocessor = new ChangePreprocessor(document, changes, tokens);
    return preprocessor.run();
}
/**
 * Creates a reference element used for building flattened annotation keys.
 *
 * @param astNode - AST node to be converted to a reference element.
 * @returns Reference element.
 */
function createReferenceElement(astNode) {
    if (astNode?.type === cds_annotation_parser_1.ANNOTATION_TYPE) {
        const element = (0, odata_annotation_core_types_1.createElementNode)({
            name: "Annotation" /* Edm.Annotation */,
            attributes: {
                ["Term" /* Edm.Term */]: (0, odata_annotation_core_types_1.createAttributeNode)("Term" /* Edm.Term */, astNode.term.value)
            }
        });
        if (astNode.qualifier) {
            element.attributes["Qualifier" /* Edm.Qualifier */] = (0, odata_annotation_core_types_1.createAttributeNode)("Qualifier" /* Edm.Qualifier */, astNode.qualifier.value);
        }
        return element;
    }
    else if (astNode?.type === cds_annotation_parser_1.RECORD_PROPERTY_TYPE) {
        const element = (0, odata_annotation_core_types_1.createElementNode)({
            name: "PropertyValue" /* Edm.PropertyValue */,
            attributes: {
                ["Property" /* Edm.Property */]: (0, odata_annotation_core_types_1.createAttributeNode)("Property" /* Edm.Property */, astNode.name.value)
            }
        });
        return element;
    }
    return undefined;
}
//# sourceMappingURL=preprocessor.js.map