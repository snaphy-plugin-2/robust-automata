(function() {
    'use strict';
})();

/*global angular, $snaphy, jQuery, $,  BaseTableDatatables, browser, console*/


angular.module($snaphy.getModuleName())

//On save modal close..reset the form..
.directive('onModalClose', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, iElement, iAttrs) {
                $(iElement).on('hidden.bs.modal', function() {
                    //Reset the data..
                    if (scope.resetSavedForm) {
                        $timeout(function() {
                            scope.resetSavedForm(scope.schema.form);
                        }, 10);
                    }
                });
            } //End of Link function...
    }; // End of return
}])




/**
 *Directive for defining filters $date
 * */
//$date
.directive('robustFilterDate', ['$timeout', function($timeout) {

        return {
            restrict: 'E',
            scope: {
                "modelSettings": "=modelSettings",
                "labelClass": "=labelClass",
                "dateClass": "=dateClass",
                "columnName": "@columnName",
                "label": "@label"
            },
            replace: true,
            template: '<div class="form-group">' +
                '<label ng-class="labelClass" class="col-md-2 control-label" for="example-daterange1">{{label}}</label>' +
                '<div ng-class="dateClass">' +
                '<div class="input-daterange input-group" data-date-format="mm/dd/yyyy">' +
                '<input class="form-control" type="text"  name="daterange1" placeholder="From">' +
                '<span class="input-group-addon"><i class="fa fa-chevron-right"></i></span>' +
                '<input class="form-control" type="text"  name="daterange2" placeholder="To">' +
                '</div>' +
                '</div>' +
                '</div>',
            link: function(scope, iElement, iAttrs) {
                    //Now add a Reset method to the filter..
                    scope.$parent.addResetMethod(function() {
                        $($(iElement).find('input')).val('');
                    });

                    var prevFrom = "",
                        prevTo = "";

                    //Now applying date change event of the table..
                    $($(iElement).find('.input-daterange')).datepicker().on("changeDate", function() {
                        $timeout(function() {
                            var valuesList = $(iElement).find("input");
                            var from = $(valuesList[0]).val();
                            var to = $(valuesList[1]).val();
                            //Add this value to scope..
                            //scope.$parent.filterObj = scope.$parent.filterObj || {};
                            //scope.$parent.where = scope.$parent.where || {};
                            //scope.$parent.filterObj.where[scope.columnName] = scope.$parent.filterObj.where[scope.columnName]  || {};
                            //TODO REMOVE THE DIRECT CLEAR OF AND METHOD AND FIND SOME ALTERNATE SOLUTION..
                            scope.$parent.where.and = [];
                            //{"where": {and: [{"epoch_time": {"gte":1450717674}},{"epoch_time": {"lte":1459407675}}]} }
                            //Now push value to the  table..
                            //first clear previous data..
                            clear(scope.columnName);

                            if (from) {
                                var fromDate = {};
                                fromDate[scope.columnName] = {
                                    "gte": new Date(from)
                                };
                                scope.$parent.where.and.push(fromDate);
                                //prevFrom = from;
                            }

                            if (to) {
                                var toDate = {};
                                toDate[scope.columnName] = {
                                    "lte": new Date(to)
                                };
                                scope.$parent.where.and.push(toDate);
                                //prevTo = to;
                            }
                            //Now redraw the table...
                            scope.$parent.refreshData();
                        });
                    });



                    //Clear previous value of column data..
                    var clear = function(column) {
                        var delIndex = []
                        scope.$parent.where.and.forEach(function(and, index) {
                            prepareDeleteIndex(and, column, delIndex, index);
                        });

                        delIndex.forEach(function(index) {
                            scope.$parent.where.and.splice(index, 1);
                        })
                    }


                    var prepareDeleteIndex = function(and, column, delIndex, index) {
                        for (var key in and) {
                            if (and.hasOwnProperty(key)) {
                                if (key === column) {
                                    delIndex.push(index);
                                }
                            }
                        }
                    }
                } //link function..
        }; //return
    }]) //filterDate directive





/**
 *Directive for defining filters $select
 * */
.directive('robustFilterSelect', ['$http', '$timeout', function($http, $timeout) {
        //TODO table header data initialization bugs.. this filter must not proceed before table header initialization..
        return {
            restrict: 'E',
            scope: {
                "modelSettings": "=modelSettings",
                "columnName": "@columnName",
                "label": "@label",
                "data": "=data",
                "getOptions": "@get",
                "staticOptions": "@options",
                "dataType": "=dataType",
                "filterOptions": "=filterOptions"
            },
            replace: true,
            template: '<div class="form-group">' +
                '<label class="col-md-4 control-label" for="example-select2">{{label}}</label>' +
                '<div class="col-md-8">' +
                '<select class="js-select2 form-control" ng-model="data.value" style="width: 100%;" data-placeholder="Choose one..">' +
                '<option value="" >All</option>' +
                '<option ng-repeat="option in data.options" value="{{option.name}}">{{option.name}}</option>' +
                '</select>' +
                '</div>' +
                '</div>',
            link: function(scope, iElement) {
                    scope.data = {};
                    //initializing options..
                    scope.data.options = [];

                    //Now applying date change event of the table..
                    $($(iElement).find('.js-select2')).change(function() {
                        if (scope.data.value) {
                            $timeout(function() {
                                //scope.$parent.where = scope.$parent.where || {};
                                scope.$parent.where[scope.columnName] = scope.data.value;
                                //Now redraw the table...
                                scope.$parent.refreshData();

                            });
                        }
                    });


                    if (scope.staticOptions !== undefined) {
                        if (scope.staticOptions.length) {
                            $timeout(function() {
                                scope.data.options = JSON.parse(scope.staticOptions);
                            });
                        }
                    }

                    //Now load options..
                    if (scope.getOptions) {
                        $http({
                            method: 'GET',
                            url: scope.getOptions
                        }).then(function successCallback(response) {
                            //Select options downloaded successfully..
                            scope.data.options = response;


                            //TODO LOAD THE TABLE..
                        }, function errorCallback(response) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            console.error(response);
                        });
                    }

                    if (scope.filterOptions.getOptionsFromColumn) {
                        //Fetch data from column..
                        //RIGHT NOW ITS SUPPORTING ONLY STATIC FIELDS
                        //TODO ADD SUPPORT FOR DISTINCT QUERY TO BE ACCEPTED FROM COLUMN.

                    }

                    //Now add a Reset method to the filter..
                    scope.$parent.addResetMethod(function() {
                        scope.data.value = "";
                        //Now reinitialize the
                        setTimeout(function() {
                            $($(iElement).find('select')).select2('val', 'All');
                        }, 0);
                    });

                } //link function..
        }; //return
    }]) //filterDate directive



    /**
     *Directive for defining filters $select
     * */
    .directive('robustFilterRemoteUrl', ['$http', '$timeout', '$rootScope',
        function($http, $timeout, $rootScope) {
        //TODO table header data initialization bugs.. this filter must not proceed before table header initialization..
        return {
            restrict: 'E',
            scope: {
                "modelSettings": "=modelSettings",
                "columnName": "@columnName",
                "label": "@label",
                "filterOptions": "=filterOptions",
                "method": "@method",
                "default": "=?default",
                "disabled": "=?disabled",
                "url": "=url",
                "options": "=?options",
                "field": "=field",
                "broadcast": "@?broadcast",
                "onDataChanged": "@?onDataChanged",
                "data": "=?data"
            },
            replace: true,
            template: '<div class="form-group">' +
            '<label class="col-md-4 control-label" for="example-select2">{{label}}</label>' +
            '<div class="col-md-8">' +
            '<select class="form-control" ng-change="onChange()" ng-disabled="disabled" ng-model="data[field.value]" style="width: 100%;" data-placeholder="Choose one..">' +
            '<option value="" >All</option>' +
            '<option ng-repeat="item in optionsList" value="{{item[field.value]}}">{{item[field.display]}}</option>' +
            '</select>' +
            '</div>' +
            '</div>',
            link: function(scope, iElement) {
                scope.data = scope.default[scope.field.value] || {};
                if(!scope.data[scope.field.value]){
                    scope.data[scope.field.value] = "";
                }

                //initializing options..
                scope.optionsList = [];

                var setFilter = function (data) {
                    if(data){
                        if (data[scope.field.value]) {
                            scope.$parent.where[scope.columnName] = data[scope.field.value];
                        }else{
                            delete scope.$parent.where[scope.columnName];
                        }
                    }
                };

                var loadTableWithFilter = function () {
                    if (scope.data) {
                        $timeout(function() {
                            //scope.$parent.where = scope.$parent.where || {};
                            if(scope.data[scope.field.value]){
                                scope.$parent.where[scope.columnName] = scope.data[scope.field.value];
                            }else{
                                delete scope.$parent.where[scope.columnName];
                            }

                            //Now redraw the table...
                            scope.$parent.refreshData();

                        });
                    }else{
                        $timeout(function() {
                            //scope.$parent.where = scope.$parent.where || {};
                            scope.$parent.where[scope.columnName] = null;
                            //Now redraw the table...
                            scope.$parent.refreshData();
                        });
                    }
                };

                scope.onChange = function () {
                    var targetItem;
                    if(scope.data){
                        if(scope.optionsList){

                            scope.optionsList.forEach(function (item) {
                                if(scope.data[scope.field.value] === item.id){
                                    targetItem = item;
                                }
                            });
                        }
                    }
                    if(scope.onDataChanged){
                        //First onDataChanged filter
                        $rootScope.$broadcast(scope.onDataChanged, {
                            schema: scope.modelSettings,
                            options: scope.optionsList,
                            filter: scope.filterOptions,
                            data: targetItem,
                            loadTableWithFilter: loadTableWithFilter,
                            setFilter: setFilter
                        });
                    }

                    loadTableWithFilter();
                };






                //Now load options..
                if (scope.url) {
                    if(scope.method === "post"){
                        scope.options = scope.options || {};
                    }

                    $http({
                        method: scope.method === "post" ? "POST" : "GET" ,
                        url: scope.url,
                        data: scope.method === "post" ? scope.options: null
                    }).then(function(response) {
                        //Select options downloaded successfully..
                        if(response){
                            scope.optionsList = response.data;
                            if(scope.broadcast){
                                //Now broadCast the data fetched event.
                                $rootScope.$broadcast(scope.broadcast, {
                                    schema: scope.modelSettings,
                                    options: scope.optionsList,
                                    filter: scope.filterOptions,
                                    data: scope.data,
                                    loadTableWithFilter: loadTableWithFilter,
                                    setFilter: setFilter
                                });
                            }
                        }

                        //TODO LOAD THE TABLE..
                    }, function(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        console.error(response);
                    });
                }


                //Now add a Reset method to the filter..
                scope.$parent.addResetMethod(function() {
                    if(!scope.disabled){
                        scope.data[scope.field.display] = "All";
                        scope.data[scope.field.value] = "";
                    }
                });

            } //link function..
        }; //return
    }]) //filterDate directive




/**
 *Directive for defining filters $multiSelect
 * */
.directive('robustFilterMultiSelect', ['$http', '$timeout', function($http, $timeout) {
        //TODO table header data initialization bugs.. this filter must not proceed before table header initialization..
        return {
            restrict: 'E',
            scope: {
                "modelSettings": "=modelSettings",
                "columnName": "@columnName",
                "label": "@label",
                "data": "=data",
                "getOptions": "@get",
                "staticOptions": "@options",
                "dataType": "=dataType",
                "filterOptions": "=filterOptions"
            },
            replace: true,
            template: '<div class="form-group">' +
                '<label class="col-md-4 control-label" for="example-select2">{{label}}</label>' +
                '<div class="col-md-8">' +
                '<select data-allow-clear="true" class="js-select2 form-control" ng-model="data.value" style="width: 100%;" data-placeholder="Choose many.." multiple>' +
                '<option ng-repeat="option in data.options | unique:\'id\'" value="{{option.name}}">{{option.name}}</option>' +
                '</select>' +
                '</div>' +
                '</div>',
            link: function(scope, iElement, iAttrs) {

                    scope.data = {};

                    //Now applying date change event of the table..
                    $($(iElement).find('.js-select2')).change(function() {
                        //only draw if value is legitimate..
                        if (scope.data.value) {
                            if (scope.data.value.length) {
                                $timeout(function() {
                                    scope.$parent.where = scope.$parent.where || {};
                                    scope.$parent.where[scope.columnName] = scope.$parent.where[scope.columnName] || {};
                                    scope.$parent.where[scope.columnName].inq = scope.data.value;
                                    //Now redraw the table...
                                    scope.$parent.refreshData();
                                });
                            } else {
                                scope.data.value = null;
                                if (scope.$parent.where[scope.columnName]) {
                                    if (scope.$parent.where[scope.columnName].inq) {
                                        $timeout(function() {
                                            delete scope.$parent.where[scope.columnName];
                                            //Now redraw the table...
                                            scope.$parent.refreshData();
                                        });
                                    }
                                }
                            }
                        }
                    });


                    if (scope.staticOptions) {
                        if (scope.staticOptions.length) {
                            //Load static options..
                            scope.data.options = JSON.parse(scope.staticOptions);
                        }
                        //scope.data.options = scope.staticOptions;
                    }


                    //Now load options..
                    if (scope.getOptions) {
                        $http({
                            method: 'GET',
                            url: scope.getOptions
                        }).then(function successCallback(response) {
                            //Select options downloaded successfully..
                            //Loading options..
                            response.forEach(function(element, index) {
                                scope.data.options.push(element);
                            });

                        }, function errorCallback(response) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            console.error(response);
                        });
                    }
                    /*
                    //If data is to be fetched from some table column.
                    if (scope.filterOptions.getOptionsFromColumn) {
                        var relatedColumnName;
                        //If the column is a key name from a related model.
                        var isRelationModel;


                        //ForEach loop for each table object..
                        scope.tableData.forEach(function(rowObject, index) {
                            var rowKey = scope.$parent.getKey(rowObject, scope.columnName);

                            if (rowObject[rowKey] === undefined) {
                                isRelationModel = true;
                            } else {
                                isRelationModel = false;
                            }

                            //options format will be {id:1, name: foo}
                            var rowValue = rowObject[rowKey];

                            //The the column is a related column..
                            if (isRelationModel) {
                                relatedColumnName = scope.$parent.getColumnKey(scope.columnName);
                                rowValue = rowObject[relatedColumnName];
                            }

                            var searchProp;
                            //If the column is of object type
                            var dataType = scope.filterOptions.dataType;
                            if(dataType){
                                if(dataType.type === "object"){
                                    searchProp = dataType.searchProp;
                                    rowValue = rowValue[searchProp];
                                }
                            }


                            if(rowValue === undefined){
                                return true;
                            }

                            //Now prepare the object..
                            var option = {
                                id: rowObject.id,
                                name: rowValue
                            };
                            if(rowValue){
                                scope.data.options = scope.data.options || [];
                                //Now push the options to populate finally...
                                scope.data.options.push(option);
                            }
                        });
                    } //if*/

                    //Now add a Reset method to the filter..
                    scope.$parent.addResetMethod(function() {
                        scope.data.value = null;
                        //Now reinitialize the
                        setTimeout(function() {
                            $($(iElement).find('select')).select2();
                        }, 0);
                    });


                } //link function..
        }; //return
    }]) //filterDate directive




/**
 *Directive for defining filters $radio
 * */
.directive('robustFilterRadio', ['$timeout', function($timeout) {
        //TODO table header data initialization bugs.. this filter must not proceed before table header initialization..
        return {
            restrict: 'E',
            scope: {
                "columnName": "@columnName",
                "label": "@label",
                "data": "=data",
                "options": "@options",
                "modelSettings": "=modelSettings"
            },
            replace: true,
            template: '<div class="form-group">' +
                '<label class="col-md-4 control-label" for="radio-group12">{{label}}</label>' +
                '<div class="col-xs-8">' +
                '<label ng-repeat="option in data.options" class="css-input css-radio css-radio-lg css-radio-primary push-10-r">' +
                '<input class="radio-filter" ng-change="valueChanged()" type="radio" name="radio-group" ng-model="data.value" ng-value="option.name" ng-checked="option.checked" ><span></span>{{option.name}}' +
                '</label>' +
                '</div>' +
                '</div>',
            link: function(scope, iElement, iAttrs) {
                    scope.data = {};
                    scope.data.options = JSON.parse(scope.options);
                    scope.valueChanged = function() {
                        //only draw if value is legitimate..
                        if (scope.data.value) {
                            $timeout(function() {
                                scope.$parent.where = scope.$parent.where || {};
                                scope.$parent.where[scope.columnName] = scope.data.value;
                                //Now redraw the table...
                                scope.$parent.refreshData();
                            });
                        }
                    };
                    //Now add a Reset method to the filter..
                    scope.$parent.addResetMethod(function() {
                        scope.data.value = null;
                    });
                } //link function..
        }; //return
    }]) //filterDate directive

// TODO Array filter scheduled for later
//
//
//
.directive('robustWidgetAdded', ['Database', '$timeout', "$rootScope", "$q", "LoginServices", function(Database, $timeout, $rootScope, $q, LoginServices) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            'label': '@label',
            'model': '@model',
            'icon': '@icon',
            //Format
            /**
             * Useful in case of hasAndBelongToMany relationship
             * "options":{
                            relationType:"hasAndBelongToMany",
                            id: function(){ return settings.config.brand.id } || "asdasd34234",
                            relation: "customers"
                        }
             */
            'options': "=?options",
            'propObj': '=propObj',
            'modelValues': '=modelValues',
            'fetchLocally': '=fetchLocally',
            'schema': '=schema'
        },
        template: '<div>' +
            '<a class="block block-bordered block-link-hover3" style="cursor:pointer;" >' +
            '<table class="block-table text-center">' +
            '<tbody>' +
            '<tr>' +
            '<td class="bg-gray-lighter border-r" style="width: 50%;">' +
            '<div class="push-30 push-30-t">' +
            '<i ng-class="icon" class="fa-2x text-black-op si"></i>' +
            '</div>' +
            '</td>' +
            '<td style="width: 50%;">' +
            '<div class="h2 font-w700"><span class="h2 text-muted">+</span> {{value}}</div>' +
            '<div class="h6 text-muted text-uppercase push-5-t">{{label}}</div>' +
            '</td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '</a>' +
            '</div>',
        link: function(scope, iElement, iAttrs) {
            /**
             * Format of the propObj should be
             * {
             * 		type: '$today'|| '$week' || '$allTime',
             * 		where:{
             * 			'email': 'robinskumar73'
             * 		},
             * 		dateProp: 'date'
             * }
             */
            var loadWidgets = (function() {
                var prepareWhereObj = function(propObj) {
                    propObj.where = propObj.where || {};
                    var where = JSON.parse(JSON.stringify(propObj.where));
                    var today, tomorrow, weekStartDate;
                    //{"where": {and: [{"epoch_time": {"gte":1450717674}},{"epoch_time": {"lte":1459407675}}]} }
                    today = moment().startOf('day');
                    var tmrwString =  moment(moment().startOf('day')).add(1, 'days').toISOString();
                    if (propObj.type.trim() === "$today") {
                        tomorrow = moment(today).add(1, 'days');
                        if (propObj.dateProp) {
                            where.and = [];
                            //between: [today, tomorrow]
                            //console.log("today count ", [today.toISOString(), tomorrow.toISOString()]);
                            var fromObj = {};
                            fromObj[propObj.dateProp] = {"gte": moment().startOf('day').toISOString()};
                            where.and.push(fromObj);
                            var toObj = {};
                            toObj[propObj.dateProp] = {"lte": tomorrow.toISOString()};
                            where.and.push(toObj);
                        } //if
                        else {
                            console.error("Error:  `dateProp` property name is needed in  the widget filter.");
                        }
                    } else if (propObj.type.trim() === "$week") {
                        weekStartDate = today.subtract(7, 'days');
                        if (propObj.dateProp) {
                            where.and = [];
                            var fromObj = {};
                            fromObj[propObj.dateProp] = {"gte": weekStartDate.toISOString()};
                            where.and.push(fromObj);
                            var toObj = {};
                            toObj[propObj.dateProp] = {"lte": tmrwString  };
                            where.and.push(toObj);
                        } //if
                        else {
                            console.error("Error:  `dateProp` property name is needed in  the widget filter.");
                        }
                    } //else if
                    else {
                        //  Do nothing
                    }
                    return where;
                };



                /**
                 * Inject dynamic data in where query..
                 */
                var injectDynamicDataInWhere = function (where) {
                    return $q(function (resolve, reject) {
                        if(where){
                            var pattern1 = /^\$user\..+$/;
                            var promiseList = [];
                            for(var key in where){
                                if(where.hasOwnProperty(key)){
                                    //test for dynamic data..
                                    if(pattern1.test(where[key])){
                                        (function (key, where) {
                                            promiseList.push(
                                                    $q(function (resolve, reject) {
                                                        LoginServices.addUserDetail.get()
                                                            .then(function (user) {
                                                                if(user){
                                                                    var patt = where[key];
                                                                    var relatedKey = patt.replace("$user.", '');
                                                                    var value = user[relatedKey];
                                                                    if(value){
                                                                        where[key] = value;
                                                                    }else{
                                                                        //If key's value not present then remove the property.
                                                                        delete where[key];
                                                                    }
                                                                    resolve(where);
                                                                }else{
                                                                    throw new Error("User not found");
                                                                }
                                                            })
                                                            .catch(function (error) {
                                                                reject(error);
                                                            })
                                                    })
                                            ); //panel push
                                        })(key, where);
                                    }
                                }
                            } //for loop

                            $q.all(promiseList)
                                .then(function () {
                                    resolve(where);
                                })
                                .catch(function (error) {
                                    reject(error);
                                    console.error(error);
                                })
                        }
                    });
                };



                var fetchDataFromServer = function(preWhere) {
                    var where = prepareWhereObj(scope.propObj);
                    injectDynamicDataInWhere(where)
                        .then(function (where) {

                            for(var key in preWhere){
                                if(preWhere.hasOwnProperty(key)){
                                    where[key] = preWhere[key];
                                }
                            }
                            var modelService = Database.loadDb(scope.model);
                            var manyToManyRelationExists = false;
                            if(scope.options){
                                if(scope.options.relationType === "hasAndBelongToMany"){
                                    manyToManyRelationExists = true;
                                }
                            }
                            if(manyToManyRelationExists){
                                //Now fetch the data from the server..
                                modelService[scope.options.relation].count({
                                    id: typeof scope.options.id === "function" ? scope.options.id(): scope.options.id ,
                                    where: where
                                }, function(value, responseHeaders) {
                                    $timeout(function(){
                                        //console.log(value);
                                        //Now populate the value..
                                        scope.value = value.count;
                                    });
                                }, function(respHeader) {
                                    console.error("Error fetching widget data from the server.");
                                }); //modelService
                            }else{
                                //Now fetch the data from the server..
                                modelService.count({
                                    where: where
                                }, function(value, responseHeaders) {
                                    $timeout(function(){
                                        //console.log(value);
                                        //Now populate the value..
                                        scope.value = value.count;
                                    });

                                }, function(respHeader) {
                                    console.error("Error fetching widget data from the server.");
                                }); //modelService
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                };

                //Now initialize the directive..
                var init = function() {
                    var loadWidgets = true;
                    if(scope.schema){
                        if(scope.schema.settings){
                            if(scope.schema.settings.widgets){
                                if(scope.schema.settings.widgets.resetWhenBroadCast){
                                    loadWidgets = false;
                                }
                            }
                        }
                    }

                    if(loadWidgets){
                        // watch for local data change..
                        scope.$watch('modelValues.length', function() {
                            fetchDataFromServer();
                        });
                    }else{
                         $rootScope.$on(scope.schema.settings.widgets.resetWhenBroadCast, function (event, where) {
                             // watch for local data change..
                             scope.$watch('modelValues.length', function() {
                                 fetchDataFromServer(where);
                             });
                         })
                    }
                };
                //Now finally return the init method.
                return init;
            })();


            //Now finally load the widgets..
            loadWidgets();

        } //link..
    }; //return ..
}])



.directive('snaphyRaLoadFilters', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope) {

                $timeout(function() {
                    $(function() {
                        // Init page helpers (BS Datepicker + BS Colorpicker + Select2 + Masked Input + Tags Inputs plugins)
                        //App.initHelpers(['datepicker', 'select2']);
                        scope.initializePlugin(['datepicker', 'select2']);
                    });
                }); //timeout method..
            } //End of Link function...
    }; // End of return
}])


.directive('snaphyRaLoadSelect', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            $timeout(function() {
                    $(function() {
                        // Init page helpers (BS Datepicker + BS Colorpicker + Select2 + Masked Input + Tags Inputs plugins)
                        //App.initHelpers(['datepicker']);
                        //scope.initializePlugin(['select2']);
                        $(element).select2();
                    });
                }); //timeout method..
            } //End of Link function...
    }; // End of return
}]);
