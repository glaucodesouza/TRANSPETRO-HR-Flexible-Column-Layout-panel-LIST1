/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "zhr/flexiblecolumnlayoutlist/model/models",
        "sap/f/library",
        "sap/f/FlexibleColumnLayoutSemanticHelper",
        "sap/ui/model/json/JSONModel"
    ],
    function (UIComponent, Device, models, fioriLibrary, FlexibleColumnLayoutSemanticHelper, JSONModel) {
        "use strict";

        const LayoutType = fioriLibrary.LayoutType;

        return UIComponent.extend("zhr.flexiblecolumnlayoutlist.Component", {
            metadata: {
                manifest: "json",
                interfaces: [
                    "sap.ui.core.IAsyncContentCreation"
                ]
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                //Criar model global: "layout"
                const oLayoutModel = new JSONModel({
                    layout: LayoutType.OneColumn,
                    actionButtonsInfo: {
                        midColumn: {
                            fullScreen: true,
                            exitFullScreen: true,
                            closeColumn: true
                        },
                        endColumn: {
                            fullScreen: null,
                            exitFullScreen: null,
                            closeColumn: null
                        }
                    }
                });

                this.setModel(oLayoutModel, "layout");
            },

            getHelper() {
                const oFCL = this.getRootControl().byId("zhrflexiblecolumnlayoutlist");

                return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, {
                    defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded
                });
            }
        });
    }
);