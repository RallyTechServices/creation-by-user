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
    
    // make a limit for the lookback filter results because of recursion problems in making the wsapi filter
    lookbackLimit: 5000,

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

            stateful: false,
            stateId: 'creator-grid-filters-1',
            inlineFilterPanelConfig: {
                quickFilterPanelConfig: {
                    defaultFields: ['LookbackCreator'] 
                }
            },
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
        
        this.gridboard = container.add({
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
        var me = this;
        this.logger.log('buildGridboardStores');
        this.getGridBox().setLoading(true);
        
        Deft.Chain.pipeline([
            this._getFilteredObjectIDs,
            
            function(snapshots) {
                return Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
                    models: this.getChosenModelNames(),
                    autoLoad: true,
                    enableHierarchy: false,
                    enableRootLevelPostGet: true,
                    filters: this.getWsapiFilters(snapshots)
                });
            }
        ],this).then({
            success: this.buildGrid,
            failure: this.showErrorNotification,
            scope: this
        }).always(function() {me.getGridBox().setLoading(false);});
    },
    
    _getFilteredObjectIDs: function() {
        this.logger.log('_getFilteredObjectIDs',this.getLookbackPreFilter());

        var lookback_filter = this.getLookbackPreFilter();
        if ( Ext.isEmpty(lookback_filter) ) {
            return null;
        }
        
        var config = {
            find: lookback_filter
        };
        
        return this.loadLookbackRecords(config);
    },
    
    showErrorNotification: function(msg) {
        Ext.Msg.alert("", msg);
    },
    
    getFieldNames: function() {
        return this.down('tsfieldpickerbutton').getFields() || undefined;
    },
    
    getWsapiFilters: function(snapshots){
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
        
        if ( snapshots ) {
            var oid_filter = null;
            
            if ( snapshots.length === 0 ) {
                // this means a user was chosen, but the user didn't create anything
                 oid_filter = Rally.data.wsapi.Filter.and([{property:'ObjectID',value:-1}]);
                
            } else {
                var oids = Ext.Array.map(snapshots, function(snapshot){
                    return { property:'ObjectID', value:snapshot.get('ObjectID')};
                });
                oid_filter = Rally.data.wsapi.Filter.or(oids);
                
            }
            if (filters){
                filters = filters.and(oid_filter);
            } else {
                filters = oid_filter;
            }
        }
        
        this.logger.log("Filters:", filters);

        return filters || [];
    },
    
    updateStoreFields: function(fields) {
        this.logger.log("updating fields to:", fields);
        console.log('grid:', this.getGrid());
        this.getGrid().reconfigureWithColumns(fields);
        //this.buildGrid();
    },
    
    addInlineFilterPanel: function(panel){
        this.logger.log('addInlineFilterPanel');
        this.getAdvancedFilterBox().add(panel);
    },
    
    getAdvancedFilterBox: function(){
        return this.down('#advanced_filter_box');
    },
    
    getSelectorBox: function() {
        return this.down('#selector_box');
    },
    
    getGrid: function() {
        return this.gridboard.getGridOrBoard();
    },
    
    getGridBox: function() {
        return this.down('#display_box');
    },
    
    getCamelCaseModelNames: function(names){
        var name_map = {
            "hierarchicalrequirement": "HierarchicalRequirement",
            "defect": "Defect",
            "task": "Task"
        };
        
        return Ext.Array.map(names, function(name){
            return name_map[name.toLowerCase()] || name;
        });
    },
    
    getLookbackPreFilter: function() {
        if ( Ext.isEmpty(this.down('rallyinlinefilterbutton')) ) {
            return null;
        }
        var creator = this.down('rallyinlinefilterbutton').getCreator() || undefined;
        
        if ( Ext.isEmpty(creator) ) {
            return null;
        }
        
        if (! /^\/user/.test(creator) ) {
            return;
        }
        
        var creator_oid = Rally.util.Ref.getOidFromRef(creator);

        if ( Ext.isEmpty(creator_oid) ) { return null; }
        
        var types = this.getCamelCaseModelNames(this.getChosenModelNames());

        var filter = {
            "_User": parseInt(creator_oid,10),
            "_SnapshotNumber": 0,
            "_ProjectHierarchy": {
                "$in": [this.getContext().getProject().ObjectID]
            },
            "_TypeHierarchy": {
                "$in": types
            }

        };
                
        return filter;
    },
    
    getChosenModelNames: function() {
        if ( Ext.isEmpty(this.down('rallyinlinefilterbutton')) ) {
            return this.getModelNames();
        }
        return this.down('rallyinlinefilterbutton').getTypes() || undefined;
    },
    
    getModelNames: function() {
        return ['Task','HierarchicalRequirement','Defect'];
    },
    
    loadLookbackRecords: function(config,returnOperation){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
                
        // 5000 is a good limit for number of object IDs that can be ORed together 
        // (maximum callstack exceeded while creating the filter)
        var default_config = {
            fetch: ['ObjectID'],
            "sort": { "_ValidFrom": -1 },
            "removeUnauthorizedSnapshots":true,
            pageSize: this.lookbackLimit,
            limit: this.lookbackLimit
        };
        Ext.create('Rally.data.lookback.SnapshotStore', Ext.Object.merge(default_config,config)).load({
            callback : function(records, operation, successful) {
                if (successful){
                    if ( returnOperation ) {
                        deferred.resolve(operation);
                    } else {
                        console.log('operation', operation);
                        var limit = operation.limit || me.lookbackLimit;
                        
                        if ( operation.resultSet ) {
                            if ( operation.resultSet.count < operation.resultSet.totalRecords ) {
                                var msg = "Warning: Older results might not display.";
                                me.logger.log("Warning: Older results might not display.  The selected user created more than " + limit + "records.");
                                Rally.ui.notify.Notifier.showWarning({
                                    message: msg,
                                    duration: 5000
                                });
                            }
                        }
                        
                        deferred.resolve(records);
                    }
                } else {
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
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
