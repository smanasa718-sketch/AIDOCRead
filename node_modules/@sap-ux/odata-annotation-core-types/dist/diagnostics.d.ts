import type { FullyQualifiedName, NamespaceString, Alias, ElementName, AttributeName, DiagnosticSeverity, Range } from '.';
import type { Facets, Constraints } from './types';
import type { MultilineType } from './annotation-file';
import type { TextEdit } from './language-server';
/**
 * hold all type information required for checking a value
 */
export interface ValueType {
    name: FullyQualifiedName;
    asCollection?: boolean;
    facets?: Facets;
    constraints?: Constraints;
}
export interface CaseCheck {
    value: string;
    proposedValue?: string;
    lookupPath: string[];
    isNamespacedValue?: boolean;
}
export interface CaseCheckBase {
    currentValue?: string;
    proposedValue?: string;
    caseCheck?: CaseCheck;
    caseIssue?: CaseIssue;
    value?: string;
}
export interface DiagnosticBaseWithOptionalRule<R extends RuleType = string, T = undefined> {
    severity: DiagnosticSeverity;
    message: string;
    quickFixes?: [];
    range: Range;
    rule?: R;
    data?: T;
}
export interface DiagnosticBase<R extends RuleType, T = undefined> {
    severity: DiagnosticSeverity;
    message: string;
    quickFixes?: [];
    range: Range;
    rule: R;
    data: T;
}
export declare const NO_UNUSED_NAMESPACE_TYPE = "no-unused-namespace";
export declare const NO_UNDEFINED_NAMESPACE_TYPE = "no-undefined-namespace";
export declare const NAME_CASE_ISSUE_PATH_VALUE = "name-case-issue-path-value";
export declare const MISSING_I18N_KEY = "missing-i18n-key";
export declare const VALUE_REQUIRED = "value-required";
export declare const NO_WHITESPACE_IN_PATH_EXPRESSION = "no-whitespace-in-path-expression";
export declare const INCOMPLETE_EXPRESSION_CC_FORWARD_SLASH = "incomplete-expression-cc-forward-slash";
export declare const INCOMPLETE_EXPRESSION_FORWARD_SLASH = "incomplete-expression-forward-slash";
export declare const IGNORE_TARGET_VALIDATION = "ignore-target-validation";
export declare const UNKNOWN_TERM = "unknown-term";
export declare const UN_SUPPORTED_VOCABULARY = "un-supported-vocabulary";
export declare const ATTRIBUTE_NOT_ALLOWED_HERE = "attribute-not-allowed-here";
export declare const MISSING_REQUIRED_PROPERTY = "missing-required-property";
export declare const MISSING_REQUIRED_ATTRIBUTE = "missing-required-attribute";
export declare const MISSING_REQUIRED_VALUE_FOR_ATTRIBUTE = "missing-required-value-for-attribute";
export declare const TERM_NOT_APPLICABLE = "term-not-applicable";
export declare const NOT_IN_APPLICABLE_TERMS_CONSTRAINT = "not-in-applicable-terms-constraint";
export declare const RECORD_COLLECTION_PATH_NOT_ALLOWED = "record-collection-path-not-allowed";
export declare const ODATA_FUNCTION_WRONG_RETURN_TYPE = "odata-function-wrong-return-type";
export declare const IGNORE_DUPLICATE = "ignore-duplicate";
export declare const INVALID_PATH_EXPRESSION = "invlid-path-expression";
export declare const INVALID_ENUM_MEMBER_TYPE = "unknown-enum-member";
export declare const INVALID_TYPE_TYPE = "invalid-type";
export declare const NO_VALIDATION_FOR_SUBNODES = "no-validation-subnodes";
export declare const INCOMPLETE_PATH_WITH_TYPE = "incomplete-path-with-type";
export declare const INCOMPLETE_PATH_WITH_COMPATIBLE_TYPES = "incomplete-path-with-compatible-types";
export declare const COMMON_CASE_ISSUE = "common-case-issue";
export declare const ODATA_PATH_SEPARATOR_RULE = "no-odata-path-separator";
export declare const INVALID_PRIMITIVE_TYPE = "invalid-primitive-type";
export declare const DEPRECATED_$VALUE_SYNTAX = "deprecated-$value-syntax";
export interface ReplacementData {
    value: string;
    proposedValue: string;
}
export interface CaseIssue {
    correct: string;
    wrong: string;
}
export interface NamespaceData {
    namespace: NamespaceString;
    alias?: Alias;
}
export interface NoUndefinedNamespaceData extends NamespaceData {
    referenceUri: string;
}
export interface I18nMissingKey {
    value: string;
    multilineType?: MultilineType;
}
export interface InvalidType {
    alias: string;
    name: string;
}
export type NoUndefinedNamespaceDiagnostic = DiagnosticBase<typeof NO_UNDEFINED_NAMESPACE_TYPE, NoUndefinedNamespaceData>;
export type NoUnusedNamespaceDiagnostic = DiagnosticBase<typeof NO_UNUSED_NAMESPACE_TYPE, NamespaceData>;
export type NameCasePathValueDiagnostic = DiagnosticBase<typeof NAME_CASE_ISSUE_PATH_VALUE, CaseIssue>;
export type MissingI18nKeyDiagnostic = DiagnosticBase<typeof MISSING_I18N_KEY, I18nMissingKey>;
export type InvalidTypeDiagnostic = DiagnosticBase<typeof INVALID_TYPE_TYPE, InvalidType>;
export type ValueRequired = DiagnosticBase<typeof VALUE_REQUIRED, {
    name: string;
}>;
export type NoWhitespaceInPathExpression = DiagnosticBase<typeof NO_WHITESPACE_IN_PATH_EXPRESSION, {
    whitespaceRanges: Range[];
}>;
export type InvalidPrimitiveType = DiagnosticBase<typeof INVALID_PRIMITIVE_TYPE, {
    name: string;
}>;
export type NoVaidationForSubNodes = DiagnosticBase<typeof NO_VALIDATION_FOR_SUBNODES, {
    name: string;
}>;
export type IncompleteExpressionCCForwardSlash = DiagnosticBase<typeof INCOMPLETE_EXPRESSION_CC_FORWARD_SLASH, {
    name: ElementName | AttributeName;
}>;
export type IncompleteExpressionForwardSlash = DiagnosticBase<typeof INCOMPLETE_EXPRESSION_FORWARD_SLASH, {
    name: ElementName | AttributeName;
}>;
export type IgnoreTargetValidation = DiagnosticBase<typeof IGNORE_TARGET_VALIDATION>;
export type UnknowTerm = DiagnosticBase<typeof UNKNOWN_TERM, {
    name: string;
}>;
export type UnsupportedVocabulary = DiagnosticBase<typeof UN_SUPPORTED_VOCABULARY, {
    name: string;
}>;
export type AttributeNotAllowedHere = DiagnosticBase<typeof ATTRIBUTE_NOT_ALLOWED_HERE, {
    name: string;
}>;
export type MissingRequiredProperty = DiagnosticBase<typeof MISSING_REQUIRED_PROPERTY>;
export type MissingRequiredAttribute = DiagnosticBase<typeof MISSING_REQUIRED_ATTRIBUTE>;
export type MissingRequiredValueForAttribute = DiagnosticBase<typeof MISSING_REQUIRED_VALUE_FOR_ATTRIBUTE>;
export type TermNotApplicable = DiagnosticBase<typeof TERM_NOT_APPLICABLE, {
    name: string;
    wrong: string;
    correct: string;
}>;
export type RecordCollectionPathNotAllowed = DiagnosticBase<typeof RECORD_COLLECTION_PATH_NOT_ALLOWED, {
    name: string;
    type: ValueType;
}>;
export type OdataFunctionWrongReturnType = DiagnosticBase<typeof ODATA_FUNCTION_WRONG_RETURN_TYPE, {
    name: string;
    type: ValueType;
}>;
export type IgnoreDuplicate = DiagnosticBase<typeof IGNORE_DUPLICATE>;
export type InvalidPathExpression = DiagnosticBase<typeof INVALID_PATH_EXPRESSION, {
    name: string;
    value: string;
}>;
export type InvalidEnumMember = DiagnosticBase<typeof INVALID_ENUM_MEMBER_TYPE, CaseCheckBase>;
export type IncompletePathWithType = DiagnosticBase<typeof INCOMPLETE_PATH_WITH_TYPE, {
    pathValue: string;
    abstractName: string;
    expectedType: string;
}>;
export type IncompletePathWithCompatibleTypes = DiagnosticBase<typeof INCOMPLETE_PATH_WITH_COMPATIBLE_TYPES, {
    pathValue: string;
    abstractName: string;
    expectedType: string;
    expressionName: string;
    isCollection: boolean;
}>;
export type ODataPathSeparatorDiagnostic = DiagnosticBase<typeof ODATA_PATH_SEPARATOR_RULE, ReplacementData>;
export type CommonCaseIssue = DiagnosticBase<typeof COMMON_CASE_ISSUE, CaseCheckBase>;
export type Deprecated$ValueSyntax = DiagnosticBase<typeof DEPRECATED_$VALUE_SYNTAX, {
    descriptionLink: string;
    valueReplacement: TextEdit[];
    additionalAnnotationRanges: Range[];
    prefix: string;
    parentRange: Range;
}>;
export type DiagnosticWithRule = NoUndefinedNamespaceDiagnostic | NoUnusedNamespaceDiagnostic | NameCasePathValueDiagnostic | MissingI18nKeyDiagnostic | ValueRequired | NoWhitespaceInPathExpression | IncompleteExpressionCCForwardSlash | IncompleteExpressionForwardSlash | IgnoreTargetValidation | UnknowTerm | UnsupportedVocabulary | AttributeNotAllowedHere | MissingRequiredProperty | MissingRequiredAttribute | MissingRequiredValueForAttribute | TermNotApplicable | RecordCollectionPathNotAllowed | OdataFunctionWrongReturnType | IgnoreDuplicate | InvalidPathExpression | InvalidTypeDiagnostic | NoVaidationForSubNodes | InvalidEnumMember | IncompletePathWithType | IncompletePathWithCompatibleTypes | CommonCaseIssue | ODataPathSeparatorDiagnostic | InvalidPrimitiveType | Deprecated$ValueSyntax;
export type ExtendedDiagnostic = DiagnosticBaseWithOptionalRule | DiagnosticWithRule;
export type RuleTypes = DiagnosticWithRule['rule'];
export type RuleType = RuleTypes | string;
export interface CompilerMessage {
    hasSyntaxErrors: boolean;
    messages: DiagnosticBaseWithOptionalRule[];
}
//# sourceMappingURL=diagnostics.d.ts.map