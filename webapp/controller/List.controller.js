sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/f/library",

    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "zhr/panellistgroup/model/formatter",

], function (Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary, JSONModel, MessageToast, formatter) {
    "use strict";

    //const LayoutType = fioriLibrary.LayoutType;

    var oModelPeriodos;
    var oModelOcorrencias;
    var oModelPerfis;
    var oModelCodigosFrequenciaDoSAP;
    var oAppConfig = {
        "filters": {
            "visible": false
        }
    }

    return Controller.extend("zhr.flexiblecolumnlayoutlist.controller.List", {
        formatter: formatter,

        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this._bDescendingSort = false;
            this.lerDadosDoSAP();
        },

        // Ler dados do SAP INI ----------------------------------------------
        lerDadosDoSAP: function () {

            let oModel = this.getOwnerComponent().getModel();

            //Ini Ocorrencias----------------------------------------------------------------------------
            oModel.read("/OcorrenciasSet", {
                success: (oData) => {
                    oModelOcorrencias = new JSONModel(oData.results);

                    //Ini Periodos----------------------------------------------------------------------------
                    oModel.read("/PeriodosSet", {
                        success: (oData) => {

                            let aPeriodos = new JSONModel(oData.results);

                            // Insere item vazio no topo
                            aPeriodos.oData.unshift({
                                Periodo: "",
                                Ocorrencias: "",
                                isPlaceholder: true
                            });

                            oModelPeriodos = aPeriodos;
                            this.montarComboboxPeriodos();

                            //Ini Perfis----------------------------------------------------------------------------
                            oModel.read("/PerfisSet", {
                                success: (oData) => {

                                    oModelPerfis = new JSONModel(oData.results);

                                    //DEFINIR se perfil Apontador está em modo de edição ou não (editMode: true/false).
                                    this.validarSeCamposFiltrosSaoVisiveis();

                                    //Ini Códigos Frequência----------------------------------------------------------------------------
                                    oModel.read("/CodigosFrequenciaSet", {
                                        success: (oData) => {

                                            oModelCodigosFrequenciaDoSAP = new JSONModel(oData.results);
                                            this.getView().setModel(new JSONModel(oModelCodigosFrequenciaDoSAP.oData), "mdlCodigosFrequencia");

                                            this.preencherCamposAuxiliares();

                                        },
                                        error: (oError) => {
                                            MessageToast.show("Erro ao ler os Códigos de Frequência");
                                            //console.log("Erro ao ler os Perfis do SAP: ", oError);
                                        }
                                    });
                                    //Fim Códigos Frequência----------------------------------------------------------------------------

                                },
                                error: (oError) => {
                                    MessageToast.show("Erro ao ler os Perfis");
                                }
                            });
                            //Fim Perfis----------------------------------------------------------------------------

                        },
                        error: (oError) => {
                            MessageToast.show("Erro ao ler os Periodos");
                        }
                    });
                    //Fim Periodos----------------------------------------------------------------------------
                },
                error: (oError) => {
                    MessageToast.show("Erro ao ler as Ocorrencias");
                }
            });
            //Fim Ocorrencias----------------------------------------------------------------------------
        
        },
        // Ler dados do SAP FIM ------------------------------------------------

        preencherCamposAuxiliares: function () {

        },

        montarComboboxPeriodos: function () {
            //Montar COMBOBOX de Períodos
            var oComboBox = this.getView().byId("cmbPeriodos");
            var aPeriodosDoSAP = oModelPeriodos.oData;

            try {
                aPeriodosDoSAP.forEach(function(oPeriodo) {
                    oComboBox.addItem(new sap.ui.core.Item({
                        text: oPeriodo.Ocorrencias ? `${oPeriodo.Periodo} (${oPeriodo.Ocorrencias} ocorrências)` : '',
                        key: oPeriodo.Periodo
                    }));
                });
            } catch (error) {
                
            }
        },

        validarSeCamposFiltrosSaoVisiveis: function() {

        },

        onComboBoxPeriodosChange: function (oEvent) {

            let sPeriodoSelecionado = oEvent.getSource().getSelectedKey();

            if (!sPeriodoSelecionado) {
                this.getView().setModel( new JSONModel([]), "mdlOcorrenciasFiltradas" );
                return;
            }

            let aOcorrenciasFiltradas = oModelOcorrencias.oData
                .filter(function(oOcorrencia) {
                    return oOcorrencia.Periodo === sPeriodoSelecionado;
                })
                .map(function(oOcorrencia) {
                    return {
                        ...oOcorrencia, // mantém dados originais
                        Data: new Date(oOcorrencia.Data.getTime() + (3 * 60 * 60 * 1000)),//new Date(oOcorrencia.Data.getDateValue() + oOcorrencia.Data.getTimezoneOffset() * 60000), //formatter.formatDateBR(oOcorrencia.Data), // formata data para exibição
                        editMode: oOcorrencia.Status === "01" ? true : false // boolean para editable
                    };
                });

            this.getView().setModel( new JSONModel(aOcorrenciasFiltradas), "mdlOcorrenciasFiltradas" );

            // pegar modelo atual
            let oView = this.getView();
            let oModel = oView.getModel("mdlOcorrenciasFiltradas");
            let aData = oModel.getData();
            oModel.setData(aData);
            oModel.refresh(true);            
            this.onPesquisar(); // dispara pesquisa para aplicar filtros de SearchField no período selecionado
        },

        onPesquisar: function(oEvent) {

        },

        onListItemPress: function (oEvent) {

            const oItem = oEvent.getParameter("listItem");
            const oContext = oItem.getBindingContext("mdlOcorrenciasFiltradas");

            if (!oContext) {
                return;
            }

            const sPath = oContext.getPath();
            const sIndex = sPath.split("/").pop();

            const oNextUIState = this.getOwnerComponent()
                .getHelper()
                .getNextUIState(1);

            this.oRouter.navTo("detail", {
                ocorrencia: sIndex,
                layout: oNextUIState.layout
            });
        },

        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query");
            const aFilters = [];

            if (sQuery && sQuery.length > 0) {
                aFilters.push(new Filter("Empregado", FilterOperator.Contains, sQuery));
            }

            this.getView()
                .byId("productsTable")
                .getBinding("items")
                .filter(aFilters, "Application");
        },

        onAdd: function () {
            MessageBox.show("This functionality is not ready yet.", {
                icon: MessageBox.Icon.INFORMATION,
                title: "Aw, Snap!",
                actions: [MessageBox.Action.OK]
            });
        },

        onSort: function () {
            this._bDescendingSort = !this._bDescendingSort;

            const oTable = this.getView().byId("productsTable");
            const oBinding = oTable.getBinding("items");
            const oSorter = new Sorter("Empregado", this._bDescendingSort);

            oBinding.sort(oSorter);
        }
    });
});