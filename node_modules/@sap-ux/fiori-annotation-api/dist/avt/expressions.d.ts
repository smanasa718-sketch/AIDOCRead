import type { AndExpression, AnnotationPathExpression, ApplyExpression, BoolExpression, Collection, DateExpression, DecimalExpression, EnumMemberExpression, EqExpression, FloatExpression, GeExpression, GtExpression, IfExpression, IntExpression, LeExpression, LtExpression, NavigationPropertyPathExpression, NeExpression, NotExpression, NullExpression, OrExpression, PathExpression, PropertyPathExpression, StringExpression, DoubleExpression, HasExpression, InExpression, AddExpression, SubExpression, MulExpression, DivExpression, DivByExpression, ModExpression, NegExpression } from '@sap-ux/vocabularies-types';
/**
 * all attribute or node names that can provide a value representing an Expression (according to typescript definition)
 *  - each entry has the corresponding primitive JS type as string value
 */
export declare const expressionNames: Record<string, string>;
/**
 * Type guard to check if a value is an annotation expression.
 *
 * @param value - Node.
 * @returns True if node is an expression.
 */
export declare function isExpression(value: Collection[number]): value is StringExpression | PropertyPathExpression | PathExpression | NavigationPropertyPathExpression | AnnotationPathExpression | EnumMemberExpression | BoolExpression | DecimalExpression | DoubleExpression | DateExpression | IntExpression | FloatExpression | ApplyExpression | NullExpression | IfExpression | AndExpression | OrExpression | EqExpression | NotExpression | NeExpression | GtExpression | GeExpression | LtExpression | LeExpression | HasExpression | InExpression | AddExpression | SubExpression | MulExpression | DivExpression | DivByExpression | ModExpression | NegExpression;
//# sourceMappingURL=expressions.d.ts.map