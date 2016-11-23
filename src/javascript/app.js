Ext.define("TSCreatedByList", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    
    items: [
        {xtype:'container',itemId:'selector_box'},
        {xtype:'container',itemId:'advanced_filter_box'},
        {xtype:'container',itemId:'display_box'}
    ],

    gridboard: null,

    config: {
        defaultSettings: {
            showControls: true
        }
    },

    integrationHeaders : {
        name : "TSCreatedByList"
    },
                        
    launch: function() {
        this._addSelectors(this.down('#selector_box'));
        //this._updateData();
    },
    
    _addSelectors: function(container) {
        var margin = 3;

        container.add({
            xtype: 'tsfieldpickerbutton',
            modelNames: this.getModelNames(),
            context: this.getContext(),
            margin: margin,
            stateful: true,
            stateId: 'creator-grid-columns-1',
            listeners: {
                fieldsupdated: this.updateStoreFields,
                scope: this
            }
        });

        container.add({
            xtype: 'rallyinlinefilterbutton',
            modelNames: this.getModelNames(),
            context: this.getContext(),
            margin: margin,

            stateful: true,
            stateId: 'creator-grid-filters-1',
            listeners: {
                inlinefilterready: this.addInlineFilterPanel,
                inlinefilterchange: this.updateGridFilters,
                scope: this
            }
        });
    },
    
    updateGridFilters: function(filter) {
        this.logger.log('updateGridFilters', filter, filter.getWsapiFilter( ));
        this.getSelectorBox().doLayout();
        this.buildGridboardStores();
    },
    
    buildGrid: function(store){
        this.logger.log("buildGrid");
        var container = this.getGridBox();
        
        container.removeAll();
        
        this.grid = container.add({
            xtype:'rallygridboard',
            context: this.getContext(),
            modelNames: this.getChosenModelNames(),
            toggleState: 'grid',
            gridConfig: {
                store: store,
                columnCfgs: this.getFieldNames()
            },
            height: this.getHeight()
        });
    },
    
    buildGridboardStores: function() {
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: this.getChosenModelNames(),
            autoLoad: true,
            enableHierarchy: false,
            filters: this.getWsapiFilters()
        }).then({
            success: this.buildGrid,
            failure: this.showErrorNotification,
            scope: this
        });
    },
    
    showErrorNotification: function(msg) {
        Ext.Msg.alert("", msg);
    },
    
    getFieldNames: function() {
        return this.down('tsfieldpickerbutton').getFields() || undefined;
    },
    
    getWsapiFilters: function(){
        var filters = null;

        var filterButton = this.down('rallyinlinefilterbutton');
        if (filterButton && filterButton.inlineFilterPanel && filterButton.getWsapiFilter()){
            this.logger.log('advancedfilters', filterButton.getWsapiFilter(), filterButton.getFilters());
            if (filters){
                filters = filters.and(filterButton.getWsapiFilter());
            } else {
                filters = filterButton.getWsapiFilter();
            }

        }
        return filters || [];
    },
    
    updateStoreFields: function(fields) {
        this.logger.log("updating fields to:", fields);
        this.getGrid().reconfigureWithColumns(fields);
        //this.buildGrid();
    },
    
    addInlineFilterPanel: function(panel){
        this.getAdvancedFilterBox().add(panel);
    },
    
    getAdvancedFilterBox: function(){
        return this.down('#advanced_filter_box');
    },
    
    getSelectorBox: function() {
        return this.down('#selector_box');
    },
    
    getGrid: function() {
        return this.grid;
    },
    
    getGridBox: function() {
        return this.down('#display_box');
    },
    
    getChosenModelNames: function() {
        if ( Ext.isEmpty(this.down('rallyinlinefilterbutton')) ) {
            return this.getModelNames();
        }
        return this.down('rallyinlinefilterbutton').getTypes() || undefined;
    },
    
    getModelNames: function() {
        return ['Task','HierarchicalRequirement'];
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    }
    
});
