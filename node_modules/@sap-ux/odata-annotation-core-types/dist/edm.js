"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdmType = exports.Edm = void 0;
var Edm;
(function (Edm) {
    Edm["Action"] = "Action";
    Edm["ActionImport"] = "ActionImport";
    Edm["Add"] = "Add";
    /**
     * as attribute name only
     */
    Edm["Alias"] = "Alias";
    Edm["And"] = "And";
    Edm["Annotation"] = "Annotation";
    Edm["Annotations"] = "Annotations";
    Edm["AnnotationPath"] = "AnnotationPath";
    /**
     * Only for OData V2
     */
    Edm["Association"] = "Association";
    /**
     * Only for OData V2
     */
    Edm["AssociationSet"] = "AssociationSet";
    Edm["Apply"] = "Apply";
    Edm["Binary"] = "Binary";
    Edm["Bool"] = "Bool";
    Edm["Cast"] = "Cast";
    Edm["Collection"] = "Collection";
    Edm["ComplexType"] = "ComplexType";
    Edm["ContainsTarget"] = "ContainsTarget";
    Edm["Date"] = "Date";
    Edm["DateTimeOffset"] = "DateTimeOffset";
    Edm["Decimal"] = "Decimal";
    /**
     * as attribute name only
     */
    Edm["DefaultValue"] = "DefaultValue";
    Edm["Div"] = "Div";
    Edm["Duration"] = "Duration";
    Edm["EntityContainer"] = "EntityContainer";
    Edm["EntitySet"] = "EntitySet";
    Edm["EntityType"] = "EntityType";
    Edm["EnumMember"] = "EnumMember";
    Edm["EnumType"] = "EnumType";
    Edm["Eq"] = "Eq";
    Edm["Float"] = "Float";
    Edm["Function"] = "Function";
    Edm["FunctionImport"] = "FunctionImport";
    Edm["Ge"] = "Ge";
    Edm["Gt"] = "Gt";
    Edm["Guid"] = "Guid";
    Edm["If"] = "If";
    Edm["In"] = "In";
    Edm["Include"] = "Include";
    Edm["Int"] = "Int";
    Edm["IsOf"] = "IsOf";
    Edm["LabeledElement"] = "LabeledElement";
    Edm["Le"] = "Le";
    Edm["Lt"] = "Lt";
    /**
     * as attribute name only
     */
    Edm["MaxLength"] = "MaxLength";
    Edm["Member"] = "Member";
    Edm["ModelElementPath"] = "ModelElementPath";
    Edm["Mul"] = "Mul";
    /**
     * as attribute name only
     */
    Edm["Name"] = "Name";
    /**
     * as attribute name only
     */
    Edm["Namespace"] = "Namespace";
    Edm["NavigationProperty"] = "NavigationProperty";
    Edm["NavigationPropertyPath"] = "NavigationPropertyPath";
    Edm["Ne"] = "Ne";
    Edm["Neg"] = "Neg";
    Edm["Not"] = "Not";
    Edm["Null"] = "Null";
    /**
     * as attribute name only
     */
    Edm["Nullable"] = "Nullable";
    Edm["OnDelete"] = "OnDelete";
    Edm["Parameter"] = "Parameter";
    Edm["Partner"] = "Partner";
    Edm["Path"] = "Path";
    /**
     * as attribute name only
     */
    Edm["Precision"] = "Precision";
    Edm["Property"] = "Property";
    Edm["PropertyPath"] = "PropertyPath";
    Edm["PropertyValue"] = "PropertyValue";
    Edm["Or"] = "Or";
    /**
     * as attribute name only
     */
    Edm["Qualifier"] = "Qualifier";
    Edm["Record"] = "Record";
    Edm["Reference"] = "Reference";
    Edm["ReferentialConstraint"] = "ReferentialConstraint";
    /**
     * as attribute name only
     */
    Edm["ReferencedProperty"] = "ReferencedProperty";
    Edm["ReturnType"] = "ReturnType";
    /**
     * as attribute name only
     */
    Edm["Scale"] = "Scale";
    Edm["Schema"] = "Schema";
    Edm["Singleton"] = "Singleton";
    /**
     * as attribute name only
     */
    Edm["SRID"] = "SRID";
    Edm["String"] = "String";
    Edm["Sub"] = "Sub";
    /**
     * as attribute name only
     */
    Edm["Target"] = "Target";
    Edm["Term"] = "Term";
    Edm["TimeOfDay"] = "TimeOfDay";
    /**
     * as attribute name only
     */
    Edm["Type"] = "Type";
    Edm["TypeDefinition"] = "TypeDefinition";
    /**
     * as attribute name only
     */
    Edm["Unicode"] = "Unicode";
    Edm["UrlRef"] = "UrlRef";
})(Edm || (exports.Edm = Edm = {}));
/**
 * primitive types
 */
var EdmType;
(function (EdmType) {
    // http://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/cs01/odata-csdl-xml-v4.01-cs01.html#sec_PrimitiveTypes
    // Geography*, Geometry* omitted
    EdmType["Binary"] = "Edm.Binary";
    EdmType["Boolean"] = "Edm.Boolean";
    EdmType["Byte"] = "Edm.Byte";
    EdmType["Date"] = "Edm.Date";
    EdmType["DateTimeOffset"] = "Edm.DateTimeOffset";
    EdmType["Decimal"] = "Edm.Decimal";
    EdmType["Double"] = "Edm.Double";
    EdmType["Duration"] = "Edm.Duration";
    EdmType["Guid"] = "Edm.Guid";
    EdmType["Int16"] = "Edm.Int16";
    EdmType["Int32"] = "Edm.Int32";
    EdmType["Int64"] = "Edm.Int64";
    EdmType["SByte"] = "Edm.SByte";
    EdmType["Single"] = "Edm.Single";
    EdmType["Stream"] = "Edm.Stream";
    EdmType["String"] = "Edm.String";
    EdmType["TimeOfDay"] = "Edm.TimeOfDay";
    // http://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/cs01/odata-csdl-xml-v4.01-cs01.html#sec_BuiltInAbstractTypes
    EdmType["PrimitiveType"] = "Edm.PrimitiveType";
    EdmType["ComplexType"] = "Edm.ComplexType";
    EdmType["EntityType"] = "Edm.EntityType";
    EdmType["Untyped"] = "Edm.Untyped";
    // not in OData Specification! introduced to represent all collection typed entries in cache
    EdmType["EntityTypeCollection"] = "Edm.EntityTypeCollection";
    EdmType["NonEntityTypeCollection"] = "Edm.NonEntityTypeCollection";
    // http://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/cs01/odata-csdl-xml-v4.01-cs01.html#sec_BuiltInTypesfordefiningVocabularyTer
    EdmType["AnnotationPath"] = "Edm.AnnotationPath";
    EdmType["AnyPropertyPath"] = "Edm.AnyPropertyPath";
    EdmType["ModelElementPath"] = "Edm.ModelElementPath";
    EdmType["NavigationPropertyPath"] = "Edm.NavigationPropertyPath";
    EdmType["PropertyPath"] = "Edm.PropertyPath";
    // not in OData Specification! introduced to find 'virtualProperties' defined by terms like "Analytics.AggregatedProperties"
    EdmType["VirtualProperty"] = "Edm.VirtualProperty";
    // not in OData Specification! introduced to indicate that 1:n associations are allowed when looking up pathCache
    EdmType["PrimitiveCollection"] = "Edm.PrimitiveCollection";
    /**
     * Not in OData Specification! introduced to indicate that enum members are allowed (CAP CDS only)
     */
    EdmType["DataModelEnum"] = "Edm.DataModelEnum";
})(EdmType || (exports.EdmType = EdmType = {}));
//# sourceMappingURL=edm.js.map