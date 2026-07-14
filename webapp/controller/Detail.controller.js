sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/f/library"
], function (Controller, fioriLibrary) {
    "use strict";

    const LayoutType = fioriLibrary.LayoutType;

    return Controller.extend("zhr.flexiblecolumnlayoutlist.controller.Detail", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();

            this.oRouter
                .getRoute("detail")
                .attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function (oEvent) {
            const oArguments = oEvent.getParameter("arguments");

            this._sOcorrencia = oArguments.ocorrencia;

            const sLayout = oArguments.layout || LayoutType.TwoColumnsMidExpanded;

            this.getOwnerComponent().getModel("layout").setProperty("/layout", sLayout);

            this.getView().bindElement({
                path: "/Ocorrencias/" + this._sOcorrencia,
                model: "mdlOcorrencias"
            });
        },

        handleFullScreen: function () {
            this.oRouter.navTo("detail", {
                ocorrencia: this._sOcorrencia,
                layout: LayoutType.MidColumnFullScreen
            });
        },

        handleExitFullScreen: function () {
            this.oRouter.navTo("detail", {
                ocorrencia: this._sOcorrencia,
                layout: LayoutType.TwoColumnsMidExpanded
            });
        },

        handleClose: function () {
            this.getOwnerComponent()
                .getModel("layout")
                .setProperty("/layout", LayoutType.OneColumn);

            this.oRouter.navTo("master");
        }
    });
});