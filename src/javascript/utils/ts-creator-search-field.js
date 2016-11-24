Ext.define('CA.agile.technicalservices.inlinefilter.CreatorSearchField', {
    alias: 'widget.tscreatorsearchfield',
    extend: 'Rally.ui.combobox.UserSearchComboBox',
    requires: [
        'Rally.data.wsapi.Filter'
    ],

    config: {
        project: Rally.getApp() && Rally.getApp().getContext().getProjectRef(),
    },

    allowBlank: true,
   
    getFilter: function() {
        return {
            property: "ObjectID",
            operator: "!=",
            value: parseInt( new Date().getTime() / 1000, 10)
        }
    }
});