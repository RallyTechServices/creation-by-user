
Ext.override(Rally.ui.grid.InvalidGridColumnCfgFilterer,{
    // don't want to remove columns just because they aren't on the model def
    filter: function(model, columnCfgs){
        return _.filter(columnCfgs, function(column) {
            return true;
        }, this);
    }
});

// Sometimes getting an error when trying to use the artifact model
Ext.override(Rally.data.wsapi.artifact.Store,{
    _getModelTypes: function() {
        if ( Ext.isFunction(this.model.getArtifactComponentModels)) {
            return _.pluck(this.model.getArtifactComponentModels(), 'typePath').join(',');
        }
        return null;
    }
});