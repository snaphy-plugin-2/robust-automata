/**
 * Created by robins on 28/7/17.
 */
'use strict';

angular.module($snaphy.getModuleName())
    .factory('RunTimeDatabase', ['$q', 'LoginServices', '$window', function($q, LoginServices, $window) {
        var databasesList = $snaphy.loadSettings('robustAutomata', "loadDatabases");

        //Creating a memoization method for all the 
        var load = function () {
            return $q(function (resolve, reject) {
                //First check if database is present globally..
                var STATIC_DATA = $window.STATIC_DATA;
                if(STATIC_DATA){
                    var roles;
                    var list = [];
    
                    if(STATIC_DATA.databaseList){
                        if(STATIC_DATA.databaseList.length){
                            list = STATIC_DATA.databaseList;
                        }
                    }
    
                    if(!list.length){
                        LoginServices.addUserDetail.get()
                            .then(function (user) {
                                if(!user){
                                    throw new Error("User not found");
                                }else{
                                    return LoginServices.addUserDetail.getRoles();
                                }
                            })
                            .then(function (roleList) {
                                roles = roleList;
                                //Now loop for all the
                                return LoginServices.addUserDetail.getACl();
                            })
                            .then(function (aclList) {
                                //Now loop for all the aclList and check if any database has permission or not and add accordingly..
                                if(databasesList){
                                    databasesList.forEach(function (item) {
                                        var allowed = true;
                                        if(aclList[item]){
                                            if(aclList[item].read === "deny"){
                                                allowed = false;
                                            }
                                        }
    
                                        if(allowed){
                                            list.push(item);
                                        }
                                    });
                                }
                            })
                            .then(function () {
                                resolve(list);
                            })
                            .catch(function (error) {
                                console.error(error);
                                reject(error);
                            });
                    }else{
                        resolve(list);
                    }    
                }else{
                    resolve([]);
                }
            });
        };

        return {
            load: load
        }
    }]);