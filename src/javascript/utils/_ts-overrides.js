

Ext.override(Rally.ui.inlinefilter.InlineFilterButton,{
    getCreator: function() {
        return this.inlineFilterPanel.getCreator();
    }
});

Ext.override(Rally.ui.inlinefilter.InlineFilterPanel,{
    getCreator: function() {
        return this.quickFilterPanel.getCreator();
    }
});

Ext.override(Rally.ui.inlinefilter.FilterFieldFactory, {
    LookbackCreator: {
        xtype: 'tscreatorsearchfield',
        allowNoEntry: false,
        noEntryValue: '/user/-1'
    },
});

Ext.override(Rally.ui.inlinefilter.QuickFilterPanel,{
    getCreator: function() {
        var modelTypePicker = _.find(this.fields, {name: 'LookbackCreator'});
        return modelTypePicker ? modelTypePicker.getValue() : [];
    },
    
    _onAddQuickFilterClick: function() {
        var addQuickFilterConfig = Ext.clone(this.addQuickFilterConfig);
        var blackList =  _.map(this.fields, 'name');
        
        if (addQuickFilterConfig && addQuickFilterConfig.whiteListFields) {
            addQuickFilterConfig.whiteListFields = _.reject(this.addQuickFilterConfig.whiteListFields, function(field){
                return _.contains(blackList, field);
            });
        }
        // break out additional fields so they can be configured
        var additionalFields = [
            {
                name: 'ArtifactSearch',
                displayName: 'Search'
            },
            {
                name: 'ModelType',
                displayName: 'Type'
            },
            {
                name: 'LookbackCreator',
                displayName: 'Creator'
            }
        ];
        if (addQuickFilterConfig && addQuickFilterConfig.additionalFields) {
            additionalFields = _.reject(this.additionalFields, function(field){
                return _.contains(blackList, field.name);
            });
        }
        
        
        this.addQuickFilterPopover = Ext.create('Rally.ui.popover.FieldPopover', {
            target: this.addQuickFilterButton.getEl(),
            placement: ['bottom', 'top', 'left', 'right'],
            fieldComboBoxConfig: _.merge({
                model: this.model,
                context: this.context,
                emptyText: 'Search filters...',
                additionalFields: additionalFields,
                blackListFields: blackList,
                listeners: {
                    select: function(field, value) {
                        var fieldSelected = value[0].raw;
                        this.recordAction({
                            description: 'quick filter added',
                            miscData: {
                                field: fieldSelected.name || fieldSelected
                            }
                        });
                        this.addQuickFilterPopover.close();
                        this._onAddQuickFilterSelect(fieldSelected);
                    },
                    destroy: function(){
                        delete this.addQuickFilterPopover;
                    },
                    scope: this
                }
            }, addQuickFilterConfig, function(a, b) {
                if (_.isArray(a)) {
                    return a.concat(b);
                }
            })
        });
    }
});