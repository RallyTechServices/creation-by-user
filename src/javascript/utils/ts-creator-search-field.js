Ext.define('CA.agile.technicalservices.inlinefilter.CreatorSearchField', {
    alias: 'widget.tscreatorsearchfield',
    extend: 'Rally.ui.inlinefilter.ArtifactSearchField',
    requires: [
        'Rally.data.wsapi.Filter'
    ],

    allowBlank: true,
    getFilter: function() {
        var value = this.lastValue;
        if (!Ext.isEmpty(value)) {
            return Rally.data.wsapi.Filter.or([
                {
                    property: 'UserName',
                    operator: 'contains',
                    value: value
                },
                {
                    property: 'DisplayName',
                    operator: 'contains',
                    value: value
                },
                {
                    property: 'EmailAddress',
                    operator: 'contains',
                    value: value
                },
                {
                    property: 'FirstName',
                    operator: 'contains',
                    value: value
                },
                {
                    property: 'LastName',
                    operator: 'contains',
                    value: value
                }
            ]);
        }
    }
});