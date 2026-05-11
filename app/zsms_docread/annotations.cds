using docReadService as service from '../../srv/docReadService';
annotate service.zdocument with @(
    UI.SelectionFields : [
        fileName,
        title,
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : fileName,
        },
        {
            $Type : 'UI.DataField',
            Value : title,
        },
        {
            $Type : 'UI.DataField',
            Value : createdBy,
        },
        {
            $Type : 'UI.DataField',
            Value : modifiedBy,
        },
        {
            $Type : 'UI.DataField',
            Value : createdAt,
        },
        {
            $Type : 'UI.DataField',
            Value : modifiedAt,
        },
    ],
    UI.SelectionPresentationVariant #tableView : {
        $Type : 'UI.SelectionPresentationVariantType',
        PresentationVariant : {
            $Type : 'UI.PresentationVariantType',
            Visualizations : [
                '@UI.LineItem',
            ],
        },
        SelectionVariant : {
            $Type : 'UI.SelectionVariantType',
            SelectOptions : [
            ],
        },
        Text : 'Table View',
    },
    UI.LineItem #tableView : [
    ],
    UI.SelectionPresentationVariant #tableView1 : {
        $Type : 'UI.SelectionPresentationVariantType',
        PresentationVariant : {
            $Type : 'UI.PresentationVariantType',
            Visualizations : [
                '@UI.LineItem#tableView',
            ],
        },
        SelectionVariant : {
            $Type : 'UI.SelectionVariantType',
            SelectOptions : [
            ],
        },
        Text : 'Table View 1',
    },
    UI.LineItem #tableView1 : [
    ],
    UI.SelectionPresentationVariant #tableView2 : {
        $Type : 'UI.SelectionPresentationVariantType',
        PresentationVariant : {
            $Type : 'UI.PresentationVariantType',
            Visualizations : [
                '@UI.LineItem#tableView1',
            ],
        },
        SelectionVariant : {
            $Type : 'UI.SelectionVariantType',
            SelectOptions : [
            ],
        },
        Text : 'Table View 2',
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Document Upload',
            ID : 'DocumentUpload',
            Target : '@UI.FieldGroup#DocumentUpload',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Ask a Question',
            ID : 'AskaQuestion',
            Target : '@UI.FieldGroup#AskaQuestion',
        },
    ],
    UI.FieldGroup #DocumentUpload : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : title,
            },
            {
                $Type : 'UI.DataField',
                Value : fileName,
            },
            {
                $Type : 'UI.DataField',
                Value : content,
                Label : 'content',
            },
        ],
    },
    UI.FieldGroup #AskaQuestion : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : aiAnwer,
                Label : 'Answer',
            },
            
            {
                $Type : 'UI.DataFieldForAction',
                Action : 'docReadService.ask',
                Label : 'Ask any question',
            },
        ],
    },
    UI.HeaderFacets : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Header',
            ID : 'Header',
            Target : '@UI.FieldGroup#Header',
        },
    ],
    UI.FieldGroup #Header : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : fileName,
            },
            {
                $Type : 'UI.DataField',
                Value : title,
            },
        ],
    },
);




annotate service.zdocument with {
    fileName @Common.Label : 'FileName'
};

annotate service.zdocument with {
    title @Common.Label : 'Title'
};

annotate service.zdocument with {
    aiAnwer @UI.MultiLineText : true
};

