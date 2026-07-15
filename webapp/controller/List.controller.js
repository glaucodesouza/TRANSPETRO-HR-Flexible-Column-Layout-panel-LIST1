
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/f/library",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "zhr/flexiblecolumnlayoutlist/model/formatter",
    "sap/ui/core/Fragment",
    "sap/ui/unified/CalendarLegendItem",
    "sap/ui/unified/DateTypeRange",
    "sap/m/MenuItem"
], function (
    Controller,
    Filter,
    FilterOperator,
    Sorter,
    MessageBox,
    fioriLibrary,
    JSONModel,
    MessageToast,
    formatter,
    Fragment,
    CalendarLegendItem,
    DateTypeRange,
    MenuItem
) {
    "use strict";

    var aPeriodosDoSAP;
    var aOcorrencias;
    var aPerfisDoSAP;
    var aCodigosFrequenciaDoSAP;
    var oModelEmpregadosDoApontadorNoSAP;
    var aConfigDoSAP;
    var oAppConfig = {
        "filters": {
            "visible": true,
            "visibleEmpregado": false            
        },
        "buttons": {
            "visibleJustificativaEmMassa": false,
            "visibleMinhasOcorrencias": false,
            //"visibleSalvarEmMassa": false
        },
        "menus": {
            "visibleListaDeAprovadores": true,
            "visibleCodigosDeFrequencia": true,
            "visibleResumoDeAjustes": true,
            "visibleRelatorioDeFrequencia": true,
            "visiblePontoEletronico": true,
            "visibleBaseDeConhecimento": true,
            "visibleAutoEstudo": true,
            "visibleFAQ": true,
        },
        "checkboxes": {
            "selectedMinhasOcorrencias": false,
            "visibleMinhasOcorrencias": false
        }
    }
    var aCalendarioDeStatus;
    var dHoje = new Date();


    return Controller.extend("zhr.flexiblecolumnlayoutlist.controller.List", {
        
        formatter: formatter,

        onInit: function () {
            this.getView().setBusyIndicatorDelay(0);
            this.getView().setBusy(true);
            this.lerDadosDoSAP();
            this.preencherTimeLineTela();
        },
        
        lerDadosDoSAP: function () {
           
            let oModel = this.getOwnerComponent().getModel();

            //Ini Ocorrencias----------------------------------------------------------------------------
            oModel.read("/PerfisSet", {
                success: (oData) => {

                    aPerfisDoSAP = oData.results;

                    //DEFINIR se perfil Apontador está em modo de edição ou não (editMode: true/false).
                    this.definirObjetosVisiveisNaTela();

                    //Ini Periodos----------------------------------------------------------------------------
                    oModel.read("/PeriodosSet", {
                        success: (oData) => {

                            aPeriodosDoSAP = oData.results;
                            this.montarComboboxPeriodos();

                            //Ini Perfis----------------------------------------------------------------------------
                            oModel.read("/OcorrenciasSet", {
                                success: (oData) => {
                                    aOcorrencias = oData.results;

                                    //Ini Códigos Frequência----------------------------------------------------------------------------
                                    oModel.read("/CodigosFrequenciaSet", {
                                        success: (oData) => {

                                            aCodigosFrequenciaDoSAP = oData.results;
                                            this.getView().setModel(new JSONModel(aCodigosFrequenciaDoSAP), "mdlCodigosFrequencia");

                                            this.preencherCamposAuxiliaresTable();

                                            //Ini Config----------------------------------------------------------------------------
                                            oModel.read("/ConfigSet", {
                                                success: (oData) => {

                                                    aConfigDoSAP = oData.results;

                                                    //Ini Empregados do Apontador----------------------------------------------------------------------------
                                                    oModel.read("/EmpregadosSet", {
                                                        success: (oData) => {

                                                            oModelEmpregadosDoApontadorNoSAP = new JSONModel(oData.results);
                                                            this.getView().setModel(new JSONModel(oModelEmpregadosDoApontadorNoSAP.oData), "mdlEmpregadosDoApontador");

                                                            //Ini READ CalendarioDeStatusSet ----------------------------------------------------------------------------
                                                            oModel.read("/CalendarioDeStatusSet", {
                                                                success: (oData) => {
                                                                    aCalendarioDeStatus = oData.results;
                                                                    this.ajustarDatasCalendarioDeStatus();

                                                                    this.getView().setBusy(false);

                                                                },
                                                                error: (oError) => {
                                                                    MessageToast.show("Erro ao ler Calendario no SAP");
                                                                    this.getView().setBusy(false);
                                                                }
                                                            });
                                                            //Fim READ CalendarioDeStatusSet ----------------------------------------------------------------------------

                                                        },
                                                        error: (oError) => {
                                                            MessageToast.show("Erro ao ler Empregados do Apontador no SAP");
                                                            this.getView().setBusy(false);
                                                        }
                                                    });
                                                    //Fim Empregados do Apontador ----------------------------------------------------------------------------

                                                },
                                                error: (oError) => {
                                                    MessageToast.show("Erro ao ler as Configurações do SAP");
                                                    this.getView().setBusy(false);
                                                }
                                            });
                                            //Fim Config----------------------------------------------------------------------------

                                        },
                                        error: (oError) => {
                                            MessageToast.show("Erro ao ler os Códigos de Frequência do SAP");
                                            this.getView().setBusy(false);
                                        }
                                    });
                                    //Fim Códigos Frequência----------------------------------------------------------------------------

                                },
                                error: (oError) => {
                                    MessageToast.show("Erro ao ler os Perfis do SAP");
                                    this.getView().setBusy(false);
                                }
                            });
                            //Fim Perfis----------------------------------------------------------------------------

                        },
                        error: (oError) => {
                            MessageToast.show("Erro ao ler os Periodos do SAP");
                            this.getView().setBusy(false);
                        }
                    });
                    //Fim Periodos----------------------------------------------------------------------------
                },
                error: (oError) => {
                    MessageToast.show("Erro ao ler as Ocorrencias do SAP");
                    this.getView().setBusy(false);
                }
            });
            //Fim Ocorrencias----------------------------------------------------------------------------
        
        },

        listGroupFunction: function(oContext){

            let sUnidadeOrganizacional = oContext.getProperty("UnidadeOrganizacional") || "";
            let sDescricao = oContext.getProperty("UnidOrgDescricao") || "";

            return {
                key: sUnidadeOrganizacional,
                text: sDescricao
                    ? `${sUnidadeOrganizacional} - ${sDescricao}`
                    : sUnidadeOrganizacional || "Sem gerência"
            };

			// return {
			// 	key: oContext.getProperty("UnidadeOrganizacional")[0]
			// };
		},

        preencherCamposAuxiliaresTable: function () {
   
            aOcorrencias.forEach(function(oOcorrencia) {
                //Definir campo Diferença p/ HH:MM
                oOcorrencia.Diferenca = formatter.formatTimeFromMs(oOcorrencia.Diferenca);

                //Buscar configurações p/ Tipo Ocorrência
                const oCodigoFrequencia = aCodigosFrequenciaDoSAP.find((element) => 
                                                                        element.Codigo === oOcorrencia.Justificativa &&
                                                                        element.Infotipo === oOcorrencia.OcorInfotipo &&
                                                                        element.Subtipo === oOcorrencia.OcorSubTipo
                                                                        );
                if (oCodigoFrequencia) {
                    //JustificativaTexto
                    oOcorrencia.JustificativaTexto = oCodigoFrequencia.Codigo + " - " + oCodigoFrequencia.Descricao;

                    //Definir se ocorrência atual é obrigatório ter anexo
                    oOcorrencia.ObrigatorioAnexo = oCodigoFrequencia.Anexo ? true : false;
                }
            });

            this.getView().setModel(new JSONModel(aOcorrencias), "mdlOcorrencias");
        },

        montarComboboxPeriodos: function () {
            //Montar COMBOBOX de Períodos


            let aPeriodos = [];

            aPeriodos.push({
                Periodo: "",
                Ocorrencias: "",
                PeriodoTexto: ""
            });

            aPeriodosDoSAP.forEach(function (oPeriodo) {
                aPeriodos.push({
                    Periodo: oPeriodo.Periodo,
                    Ocorrencias: oPeriodo.Ocorrencias,
                    PeriodoTexto: oPeriodo.Ocorrencias
                        ? `${oPeriodo.Periodo} (${oPeriodo.Ocorrencias} ocorrências)`
                        : oPeriodo.Periodo
                });
            });

            this.getView().setModel(new JSONModel(aPeriodos), "mdlPeriodos");


            // let oComboBox = this.getView().byId("cmbPeriodos");

            // if (!oComboBox) {
            //     return;
            // }

            // // Insere item vazio no topo
            // aPeriodosDoSAP.unshift({
            //     Periodo: "",
            //     Ocorrencias: "",
            //     isPlaceholder: true
            // });

            // aPeriodosDoSAP.forEach(function(oPeriodo) {
            //     oComboBox.addItem(new sap.ui.core.Item({
            //         text: oPeriodo.Ocorrencias ? `${oPeriodo.Periodo} (${oPeriodo.Ocorrencias} ocorrências)` : '',
            //         key: oPeriodo.Periodo
            //     }));
            // });
        },

        onComboBoxPeriodosChange: function (oEvent) {

            this.getView().setBusy(true);

            let sPeriodoSelecionado = oEvent.getSource().getSelectedKey();

            if (!sPeriodoSelecionado) {
                this.getView().setModel(new JSONModel([]), "mdlOcorrenciasFiltradas");
                this.getView().setBusy(false);
                return;
            }

            let aOcorrenciasFiltradas = aOcorrencias
                .filter(function (oOcorrencia) {
                    return oOcorrencia.Periodo === sPeriodoSelecionado;
                })
                .map(function (oOcorrencia) {
                    let editModeHoraInicio = false;
                    let editModeHoraFim = false;
                    let editModeTipoOcorrencia = false;

                    const oCodigoFrequencia = aCodigosFrequenciaDoSAP.find(function (element) {
                        return element.Codigo === oOcorrencia.Justificativa;
                    });

                    if (oCodigoFrequencia) {
                        editModeHoraInicio = !!oCodigoFrequencia.Entrada;
                        editModeHoraFim = !!oCodigoFrequencia.Saida;
                        editModeTipoOcorrencia = false;
                    }

                    return {
                        ...oOcorrencia,

                        Data: oOcorrencia.Data instanceof Date
                            ? new Date(oOcorrencia.Data.getTime() + (3 * 60 * 60 * 1000))
                            : oOcorrencia.Data,

                        editMode: oOcorrencia.Status === "01",
                        editModeHoraInicio: editModeHoraInicio,
                        editModeHoraFim: editModeHoraFim,
                        editModeTipoOcorrencia: editModeTipoOcorrencia
                    };
                });

            let oModelOcorrenciasFiltradas = new JSONModel(aOcorrenciasFiltradas);

            this.getView().setModel(
                oModelOcorrenciasFiltradas,
                "mdlOcorrenciasFiltradas"
            );

            this.onPesquisar();

            this.getView().setBusy(false);

            // this.getView().setBusy(true);

            // let sPeriodoSelecionado = oEvent.getSource().getSelectedKey();

            // if (!sPeriodoSelecionado) {
            //     this.getView().setModel( new JSONModel([]), "mdlOcorrenciasFiltradas" );
            //     return;
            // }
            
            // //filtrar pelo Período selecionado
            // let aOcorrenciasFiltradas = aOcorrencias
            //     .filter(function(oOcorrencia) {
            //         return oOcorrencia.Periodo === sPeriodoSelecionado;
            //     })
            //     .map(function(oOcorrencia) {
            //         //Definir campo JUstificativaTexto
            //         let editModeHoraInicio;
            //         let editModeHoraFim;
            //         let editModeTipoOcorrencia;
            //         const oCodigoFrequencia = aCodigosFrequenciaDoSAP.find((element) => element.Codigo === oOcorrencia.Justificativa);
            //         if (oCodigoFrequencia) {
            //             editModeHoraInicio = oCodigoFrequencia.Entrada ? true : false;
            //             editModeHoraFim = oCodigoFrequencia.Saida ? true : false;
            //             editModeTipoOcorrencia = false;
            //         }
            //         return {
            //             ...oOcorrencia, // mantém dados originais
            //             Data: new Date(oOcorrencia.Data.getTime() + (3 * 60 * 60 * 1000)),//new Date(oOcorrencia.Data.getDateValue() + oOcorrencia.Data.getTimezoneOffset() * 60000), //formatter.formatDateBR(oOcorrencia.Data), // formata data para exibição
            //             editMode: oOcorrencia.Status === "01" ? true : false, // boolean para editable
            //             editModeHoraInicio: editModeHoraInicio,// boolean para editable
            //             editModeHoraFim: editModeHoraFim, // boolean para editable
            //             editModeTipoOcorrencia: editModeTipoOcorrencia // boolean para editable

            //         };
            //     });

            // this.getView().setModel( new JSONModel(aOcorrenciasFiltradas), "mdlOcorrenciasFiltradas" );

            // // pegar modelo atual
            // let oView = this.getView();
            // let oModel = oView.getModel("mdlOcorrenciasFiltradas");
            // let aData = oModel.getData();
            // oModel.setData(aData);
            // oModel.refresh(true);
            // this.onPesquisar(); // dispara pesquisa para aplicar filtros de SearchField no período selecionado

            // this.getView().setBusy(false);

        },

        onFiltrarMinhasOcorrencias: function (oEvent) {

            //filtrar por Minhas ocorrências (Quando user logado é Apontador)
            let oComboBox = this.getView().byId("cmbPeriodos");
            let sPeriodoSelecionado = oComboBox.getSelectedKey();

            if (!sPeriodoSelecionado) {
                MessageToast.show("Nenhum Período selecionado");
                this.getView().setModel( new JSONModel([]), "mdlOcorrenciasFiltradas" );
                return;
            }

            if (!this.validarSeUsuarioLogadoEhApontador()) {
                MessageToast.show("Apenas apontadores podem visualizar suas ocorrências");
                this.getView().setModel( new JSONModel([]), "mdlOcorrenciasFiltradas" );
                return;
            }

            let oModelOcorrenciasFiltradas = this.getView().getModel("mdlOcorrenciasFiltradas");
            let aOcorrenciasFiltradas = oModelOcorrenciasFiltradas.getData();

            let sMatriculaApontadorLogado = this.lerMatriculaSeUserLogadoForApontador();
            
            //Filtar
            let aOcorrenciasFiltradasMinhas = aOcorrenciasFiltradas.filter(function(oOcorrencia) {
                    return oOcorrencia.Empregado === sMatriculaApontadorLogado; // filtra apenas ocorrências do empregado logado
                    //return oOcorrencia.Empregado === oModelConfigDoSAP.oData[0].Apontador; // filtra apenas ocorrências do empregado logado
                });
            
            this.getView().setModel( new JSONModel(aOcorrenciasFiltradasMinhas), "mdlOcorrenciasFiltradas" );

            // pegar modelo atual
            // let oView = this.getView();
            // let oModel = oView.getModel("mdlOcorrenciasFiltradas");
            // let aData = oModel.getData();
            // oModel.setData(aData);
            // oModel.refresh(true);
            this.onPesquisar(); // dispara pesquisa para aplicar filtros de SearchField no período selecionado

        },

        validarSeUsuarioLogadoEhEmpregadoComum: function() {
            try {
                return aConfigDoSAP[0]?.Apontador ? false : true; // Se não for Apontador, assume que é empregado comum
            } catch (error) {
                return true; // Se não conseguir validar, assume que é empregado comum
            }
        },

        validarSeUsuarioLogadoEhApontador: function() {
            try {
                return aConfigDoSAP[0]?.Apontador ? true : false; // true=Se for Apontador
            } catch (error) {
                return false; // Se não conseguir validar, assume que é empregado comum
            }
        },

        lerMatriculaSeUserLogadoForApontador: function() {
            try {
                return aConfigDoSAP[0]?.Apontador ? aConfigDoSAP[0].Apontador : null; // Retorna a matrícula do apontador ou null se não encontrar
            } catch (error) {
                return null; // Se não conseguir validar, retorna null
            }
        },

        lerMatriculaSeUserLogadoForEmpregadoComum: function() {
            try {
                return aOcorrencias[0]?.Empregado; // Retorna a matrícula do empregado comum ou null se não encontrar
            } catch (error) {
                return null; // Se não conseguir validar, retorna null
            }
        },

        definirObjetosVisiveisNaTela: function() {
            // DEFINIR objetos visíveis (por perfil)
            // for (let index = 0; index < aPerfisDoSAP.length; index++) {
            //     const row = aPerfisDoSAP[index];
            //     if (row.Perfil === "Apontador") {
            //         oAppConfig.filters.visibleEmpregado = true;
            //         oAppConfig.buttons.visibleJustificativaEmMassa  = true;
            //         oAppConfig.buttons.visibleMinhasOcorrencias     = true;
            //         oAppConfig.menus.visibleListaDeAprovadores      = false; //A
            //         oAppConfig.menus.visibleCodigosDeFrequencia     = true;  //B
            //         oAppConfig.menus.visibleResumoDeAjustes         = false; //C
            //         oAppConfig.menus.visibleRelatorioDeFrequencia   = false; //D
            //         oAppConfig.menus.visiblePontoEletronico         = false; //E
            //         oAppConfig.menus.visibleBaseDeConhecimento      = true; //F
            //         oAppConfig.menus.visibleAutoEstudo              = true; //G
            //         oAppConfig.menus.visibleFAQ                     = true; //H
            //         break;
            //     }
            // }
            this.getView().setModel(new JSONModel(oAppConfig), "mdlAppConfig");
        },

        onTableLinePress: function(oEvent) {

            // Preencher o modelo de timeline com base na linha clicada
            this.preencherTimeLineTela(oEvent);

        },

        onListItemPress: function (oEvent) {
            let oItem = oEvent.getSource();
            let oContext = oItem.getBindingContext("mdlOcorrenciasFiltradas");

            if (!oContext) {
                MessageToast.show("Não foi possível identificar a ocorrência.");
                return;
            }

            let oOcorrencia = oContext.getObject();

            this.preencherTimeLineTela(oEvent);

            MessageToast.show(
                `Ocorrência selecionada: ${oOcorrencia.Empregado} - ${oOcorrencia.NomeEmpregado}`
            );
        },

        //TIMELINE INI ----------------------------------------------------------
        preencherTimeLineTela: function(oEvent) {

            let aTimelineHours = [];

            //--------------------------------------------------------------------------
            // Preencher TIMELINE ao clicar na linha da Table
            //--------------------------------------------------------------------------
            if (oEvent) {
        
                // Lógica para preencher o modelo da timeline com base na linha clicada.
                let oContextLinhaClicada = oEvent.getSource().getBindingContext("mdlOcorrenciasFiltradas");
                let oDataLinhaClicada = oContextLinhaClicada.getObject();

                //MessageToast.show(`Linha selecionada: ${oDataLinhaClicada.Empregado} - ${oDataLinhaClicada.TipoOcorrencia}`);
                
                aTimelineHours.push(oDataLinhaClicada.InicioJornada);
                aTimelineHours.push(oDataLinhaClicada.FimJornada);
                aTimelineHours.push(oDataLinhaClicada.InicioIntervalo);
                aTimelineHours.push(oDataLinhaClicada.FimIntervalo);

                //TIMELINE INI
                if (aTimelineHours.length) {
                    const html = this._buildTimeline(aTimelineHours);
                    let sTimeLineData = `${oDataLinhaClicada.Data.getDate()}/${oDataLinhaClicada.Data.getMonth() + 1}/${oDataLinhaClicada.Data.getFullYear()}`;
                    this.getView().setModel(new JSONModel({ "timelineHtml": html, "timelineData": sTimeLineData }), "mdlTimeline");
                }
                //TIMELINE FIM

            //--------------------------------------------------------------------------
            // Preencher TIMELINE (vazio mesmo) iniciar o app
            //--------------------------------------------------------------------------
            } else {
                //TIMELINE INI vazio
                if (!aTimelineHours.length) {
                    const html = this._buildTimeline([]);
                    this.getView().setModel(new JSONModel({ "timelineHtml": html, "timelineData": '' }), "mdlTimeline");
                }
                //TIMELINE FIM vazio
            }

            let oTimelineHtml = this.byId("timelineHtml");

            if (oTimelineHtml) {
                oTimelineHtml.setVisible(true);
            }
        },

        _buildTimeline: function (times) {
            const toMinutes = (t) => {
                const [h, m] = t.split(":").map(Number);
                return h * 60 + m;
            };
        
            const start = 0;        // 00:00
            const end = 24 * 60;    // 24h
        
            let ticksHtml = "";
        
            times.forEach(t => {
                let horaAtual = this.transformarMsParaHora(t.ms);
                const pos = (toMinutes(horaAtual) - start) / (end - start) * 100;
        
                ticksHtml += `
                <div class="tick" style="left:${pos}%">
                    <div class="tick-line"></div>
                    <div class="tick-label">${horaAtual}</div>
                </div>
                `;
            });
        
            return `
                <div class="timeline">
                <div class="timeline-base"></div>
                ${ticksHtml}
                </div>
            `;
        },
        
        transformarMsParaHora: function (ms) {

            ms = Number(ms);

            if (isNaN(ms)) {
                return "00:00";
            }

            const horas = Math.floor(ms / 3600000);
            const minutos = Math.floor((ms % 3600000) / 60000);

            return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
        },
        //TIMELINE FIM ----------------------------------------------------------

        onSalvarLinha: function(oEvent) {
            let oContext = oEvent.getSource().getBindingContext("mdlOcorrenciasFiltradas");
            let oModel = this.getView().getModel("mdlOcorrenciasFiltradas");

            let sPath = oContext.getPath();
            let oDataLinhaTable = oModel.getProperty(sPath);  

            //Validar se a Ocorrência atual é boa para Salvar
            if (!this.validarOcorrenciaAtualAoSalvar(oDataLinhaTable)) {
                return;// A Ocorrência atual não é boa para Salvar
            }

            // if (!oDataLinhaTable.editMode) {
            //     MessageToast.show("Ative o modo de edição antes de salvar.");
            //     return;
            // }

            // if (!oDataLinhaTable.Observacao) {
            //     MessageToast.show("Observação é obrigatória para salvar.");
            //     return;
            // }

            //--------------------------------------------------------------------------------
            // Chamar UPDATE() do SAP
            //--------------------------------------------------------------------------------

            let oModelSAP = this.getOwnerComponent().getModel()

            //Formatar horas para OData
            let horaInicioOdata = this.formatTimeToOData(oDataLinhaTable.HoraInicio);
            let horaFimOdata = this.formatTimeToOData(oDataLinhaTable.HoraFim);

            //Criar chave p/ update
            let sPathODataSAP = oModelSAP.createKey("/OcorrenciasSet", {
                Empregado: oDataLinhaTable.Empregado,
                Data: oDataLinhaTable.Data,//"2026-06-11T00:00:00",
                Contador: oDataLinhaTable.Contador
                
            });

            //payload
            let oPayload = {
                HoraInicio: horaInicioOdata,//"PT08H00M00S"
                HoraFim: horaFimOdata, //"PT10H00M00S"
                // Diferenca: oDataLinhaTable.Diferenca, //Number(oDataLinhaTable.Diferenca).toFixed(2), //O SAP espera string no formato "0.00"
                // Diferenca: `${oDataLinhaTable.Diferenca}`, //O SAP espera string no formato "0.00"
                TipoOcorrencia: oDataLinhaTable.TipoOcorrencia,
                OcorInfotipo: oDataLinhaTable.OcorInfotipo,
                OcorSubTipo: oDataLinhaTable.OcorSubTipo,
                Justificativa: oDataLinhaTable.Justificativa,
                Observacao: oDataLinhaTable.Observacao,
                Status: '02' //Renovar status para "Em aprovação"
            };

            // oModelSAP.setUseBatch(false); // Desabilita batch para garantir que a requisição seja enviada imediatamente
            oModelSAP.update(sPathODataSAP, oPayload, {
                success: (oData, response) => {
                    //--------------------------------------------------------------------------------
                    // Após salvar, alterna modo edição para false
                    //--------------------------------------------------------------------------------
                    oDataLinhaTable.editMode = false;
                    oDataLinhaTable.Status = "02"; // Exemplo: ao salvar, o status muda para "Em aprovação"

                    oModel.setProperty(sPath, oDataLinhaTable);
                    MessageToast.show("Ocorrência renovada com sucesso!");
                },
                    error: (oError) => {
                        MessageToast.show("Erro ao Salvar ocorrência no SAP");
                }
            });
        },

        validarOcorrenciaAtualAoSalvar: function(oOcorrencia) {

            //A Data atual deve ser menor ou igual à data de corte
            if (!(dHoje <= oOcorrencia.DataCorte)) {
                MessageToast.show(`A Data atual deve ser menor ou igual à data de corte. ${oOcorrencia.DataCorte.toLocaleDateString()}`);
                return false;
            }

            //A linha atual deve estar em modo edição
            if (!oOcorrencia.editMode) {
                MessageToast.show("Ative o modo de edição antes de salvar.");
                return false; //Ocorrência atual tem erro
            }

            if (oOcorrencia.Status !== "01") {
                MessageToast.show("O Status atual não permite Salvar");
                return false; //Ocorrência atual tem erro
            }

            //Tipo de ocorrência é obrigatório para salvar
            if (oOcorrencia.TipoOcorrencia === "") {
                MessageToast.show(`Tipo de ocorrência é obrigatório para salvar. Empregado: ${oOcorrencia.Empregado}, Data: ${oOcorrencia.Data.toLocaleDateString()}`);
                return false; //Ocorrência atual tem erro
            }

            //Justificativa é obrigatório para salvar
            if (oOcorrencia.Justificativa === "") {
                MessageToast.show(`Justificativa é obrigatória para salvar. Empregado: ${oOcorrencia.Empregado}, Data: ${oOcorrencia.Data.toLocaleDateString()}`);
                return false; //Ocorrência atual tem erro
            }

            //Observação é obrigatória ao Salvar
            if (!oOcorrencia.Observacao) {
                MessageToast.show(`Observação é obrigatória para salvar. Empregado: ${oOcorrencia.Empregado}, Data: ${oOcorrencia.Data.toLocaleDateString()}`);
                return false; //Ocorrência atual tem erro
            }

            return true; //Ocorrência atual está ok para Salvar

        },

        onCancelarLinha: function(oEvent) {

            let oContext = oEvent.getSource().getBindingContext("mdlOcorrenciasFiltradas");
            let oModel = this.getView().getModel("mdlOcorrenciasFiltradas");
            let sPath = oContext.getPath();
            let oDataLinhaTable = oModel.getProperty(sPath);

            //01=Novo
            if (oDataLinhaTable.Status === "01") {
                MessageToast.show("Não é possível cancelar ocorrência.");
                return;
            }

            //03=Aprovada
            if (oDataLinhaTable.Status === "03") {
                MessageToast.show("Não é possível cancelar ocorrência.");
                return;
            }

            // -------------------------------------------------------------------------
            // Popup de confirmação antes de chamar o SAP
            // -------------------------------------------------------------------------
            MessageBox.confirm("Confirma o cancelamento desta ocorrência?", {
                title: "Confirmar cancelamento",
                actions: [
                    MessageBox.Action.YES,
                    MessageBox.Action.NO
                ],
                emphasizedAction: MessageBox.Action.YES,

                // ---------------------------------------------------------------------
                // Só continua o cancelamento se o usuário clicar em "Sim"
                // ---------------------------------------------------------------------
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.YES) {
                        return;
                    }

                    // -----------------------------------------------------------------
                    // Chamar FUNCTION IMPORT CancelarOcorrencia() do SAP
                    // -----------------------------------------------------------------
                    let oModelSAP = this.getOwnerComponent().getModel();

                    oModelSAP.callFunction("/CancelarOcorrencia", {
                        method: "POST",
                        urlParameters: {
                            Contador: oDataLinhaTable.Contador,
                            Data: oDataLinhaTable.Data,
                            Empregado: oDataLinhaTable.Empregado,
                            Obsoleto: ''
                        },
                        success: (oData, response) => {
                            // ---------------------------------------------------------
                            // Após cancelar, alterna modo edição para true
                            // ---------------------------------------------------------
                            oDataLinhaTable.editMode = true;
                            oDataLinhaTable.Status = "01"; // O status volta para "Novo"

                            oModel.setProperty(sPath, oDataLinhaTable);

                            MessageToast.show("Ocorrência cancelada com sucesso!");
                        },
                        error: (oError) => {
                            MessageToast.show("Erro ao cancelar ocorrência no SAP");
                        }
                    });
                }
            });

            // let oContext = oEvent.getSource().getBindingContext("mdlOcorrenciasFiltradas");
            // let oModel = this.getView().getModel("mdlOcorrenciasFiltradas");

            // let sPath = oContext.getPath();
            // let oDataLinhaTable = oModel.getProperty(sPath);  

            // if (oDataLinhaTable.Status === "01") {
            //     sap.m.MessageToast.show("Não é possível cancelar ocorrência.");
            //     return;
            // }

            // //--------------------------------------------------------------------------------
            // // Chamar FUNCTION IMPORT CancelarOcorrencia() do SAP
            // //--------------------------------------------------------------------------------
            // let oModelSAP = this.getOwnerComponent().getModel()

            // //Formatar horas para OData
            // let horaInicioOdata = this.formatTimeToOData(oDataLinhaTable.HoraInicio);
            // let horaFimOdata = this.formatTimeToOData(oDataLinhaTable.HoraFim);

            // //oModelSAP.setUseBatch(false); // Desabilita batch para garantir que a requisição seja enviada imediatamente
            // // oModelSAP.callFunction(sPathODataSAP, {
            // oModelSAP.callFunction("/CancelarOcorrencia", {
            //     method: "POST",
            //     urlParameters: {
            //         Contador: oDataLinhaTable.Contador,
            //         Data: oDataLinhaTable.Data,
            //         Empregado: oDataLinhaTable.Empregado,
            //         Obsoleto: ''
            //     },
            //     success: (oData, response) => {
            //         //--------------------------------------------------------------------------------
            //         // Após cancelar, alterna modo edição para false
            //         //--------------------------------------------------------------------------------
            //         oDataLinhaTable.editMode = true;
            //         oDataLinhaTable.Status   = "01"; // O status volta para "Novo"
            //         oModel.setProperty(sPath, oDataLinhaTable);
            //         MessageToast.show("Ocorrência cancelada com sucesso!");
            //     },
            //     error: (oError) => {
            //         MessageToast.show("Erro ao cancelar ocorrência no SAP");
            //     }
            // });
        },

        onPesquisar: function(oEvent) {

            try {
                let oList = this.byId("listOcorrencias");

                if (!oList) {
                    return;
                }

                let oBinding = oList.getBinding("items");

                if (!oBinding) {
                    return;
                }

                let aFilters = [];

                let oInputEmpregado = this.byId("inputEmpregado");
                let oInputTipoOcorrencia = this.byId("inputTipoOcorrencia");
                let oInputStatus = this.byId("inputStatus");
                let oInputGerencia = this.byId("inputGerencia");

                if (oInputEmpregado) {
                    let sValueFilterEmpregado = oInputEmpregado.getValue();

                    if (sValueFilterEmpregado && !oAppConfig.buttons.visibleMinhasOcorrencias) {
                        aFilters.push(new Filter(
                            "Empregado",
                            FilterOperator.Contains,
                            sValueFilterEmpregado
                        ));
                    }
                }

                if (oInputTipoOcorrencia) {
                    let sValueFilterTipoOcorrencia = oInputTipoOcorrencia.getValue();

                    if (sValueFilterTipoOcorrencia) {
                        aFilters.push(new Filter(
                            "TipoOcorrencia",
                            FilterOperator.Contains,
                            sValueFilterTipoOcorrencia
                        ));
                    }
                }

                if (oInputStatus) {
                    let sValueFilterStatus = oInputStatus.getValue();

                    if (sValueFilterStatus) {
                        aFilters.push(new Filter(
                            "Status",
                            FilterOperator.Contains,
                            sValueFilterStatus
                        ));
                    }
                }

                if (oInputGerencia) {
                    let sValueFilterUnidadeOrganizacional = oInputGerencia.getValue();

                    if (sValueFilterUnidadeOrganizacional) {
                        aFilters.push(new Filter(
                            "UnidadeOrganizacional",
                            FilterOperator.Contains,
                            sValueFilterUnidadeOrganizacional
                        ));
                    }
                }

                oBinding.filter(aFilters);

            } catch (error) {
                MessageToast.show("Erro ao aplicar filtros na lista.");
            }
        },

        onLimparFiltros: function () {
            let oInputEmpregado = this.byId("inputEmpregado");
            let oInputTipoOcorrencia = this.byId("inputTipoOcorrencia");
            let oInputStatus = this.byId("inputStatus");
            let oInputGerencia = this.byId("inputGerencia");

            if (oInputEmpregado) {
                oInputEmpregado.setValue("");
            }

            if (oInputTipoOcorrencia) {
                oInputTipoOcorrencia.setValue("");
            }

            if (oInputStatus) {
                oInputStatus.setValue("");
            }

            if (oInputGerencia) {
                oInputGerencia.setValue("");
            }

            let oList = this.byId("listOcorrencias");

            if (oList) {
                let oBinding = oList.getBinding("items");

                if (oBinding) {
                    oBinding.filter([]);
                }
            }
        },

        onSalvarEmMassa: function () {

            let oSmartTable = this.byId("smartTable");
            let oTable = oSmartTable.getTable();
            let omodelLocal = this.getView().getModel("mdlOcorrenciasFiltradas");
            let oModelSAP = this.getOwnerComponent().getModel();

            let aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageToast.show("Selecione pelo menos uma ocorrência.");
                return;
            }

            let iSucesso = 0;
            let iErro = 0;

            // -------------------------------------------------------------------------
            // Popup de confirmação antes de salvar em massa
            // -------------------------------------------------------------------------
            MessageBox.confirm("Confirma o salvamento em massa?", {
                title: "Confirmar salvamento em massa",
                actions: [
                    MessageBox.Action.YES,
                    MessageBox.Action.NO
                ],
                emphasizedAction: MessageBox.Action.YES,

                // ---------------------------------------------------------------------
                // Só continua se o usuário clicar em "Sim"
                // ---------------------------------------------------------------------
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.YES) {
                        return;
                    }

                    // ----------------------------------------------------------------
                    // PARA TODOS OS ITENS status === 01
                    // ----------------------------------------------------------------
                    for (let i = 0; i < aSelectedItems.length; i++) {
                        
                        const oItem = aSelectedItems[i];            

                        let oContext = oItem.getBindingContext("mdlOcorrenciasFiltradas");
                        
                        let oDataLinha = oItem
                            .getBindingContext("mdlOcorrenciasFiltradas")
                            .getObject();
                        
                        //Apenas chamar UPDATE para status igual a 01 (Novo)
                        if (oDataLinha.Status === "01") {

                            //Validar se a Ocorrência atual é boa para Salvar
                            if (!this.validarOcorrenciaAtualAoSalvar(oDataLinha)) {
                                continue;// A Ocorrência atual não é boa para Salvar
                            }

                            // //Tipo de ocorrência é obrigatório para salvar
                            // if (oDataLinha.TipoOcorrencia === "") {
                            //     MessageToast.show(`Tipo de ocorrência é obrigatório para salvar. Empregado: ${oDataLinha.Empregado}, Data: ${oDataLinha.Data.toLocaleDateString()}`);
                            //     continue;
                            // }

                            // //Justificativa é obrigatório para salvar
                            // if (oDataLinha.Justificativa === "") {
                            //     MessageToast.show(`Justificativa é obrigatória para salvar. Empregado: ${oDataLinha.Empregado}, Data: ${oDataLinha.Data.toLocaleDateString()}`);
                            //     continue;
                            // }

                            // //Observação é obrigatória ao Salvar
                            // if (!oDataLinha.Observacao) {
                            //     MessageToast.show("Observação é obrigatória para salvar.");
                            //     continue;
                            // }

                            let sPath = oModelSAP.createKey("/OcorrenciasSet", {
                                Empregado: oDataLinha.Empregado,
                                Data: oDataLinha.Data,
                                Contador: oDataLinha.Contador
                            });

                            let oPayload = {
                                HoraInicio: this.formatTimeToOData(oDataLinha.HoraInicio),
                                HoraFim: this.formatTimeToOData(oDataLinha.HoraFim),
                                //Diferenca: oDataLinha.Diferenca,
                                TipoOcorrencia: oDataLinha.TipoOcorrencia,
                                OcorInfotipo: oDataLinha.OcorInfotipo,
                                OcorSubTipo: oDataLinha.OcorSubTipo,
                                Justificativa: oDataLinha.Justificativa,
                                Observacao: oDataLinha.Observacao,
                                Status: "02"
                            };

                            // --------------------------------------------------------------------------
                            // UPDATE no SAP
                            // -------------------------------------------------------------------------
                            // oModelSAP.setUseBatch(false);
                            oModelSAP.update(sPath, oPayload, {
                                success: () => {
                                    iSucesso++;

                                    oDataLinha.Status = "02";
                                    oDataLinha.editMode = false;
                                    omodelLocal.setProperty(
                                        oContext.getPath(),
                                        oDataLinha
                                    );

                                    if (iSucesso + iErro === aSelectedItems.length) {
                                        MessageToast.show(
                                            `${iSucesso} registro(s) salvo(s) com sucesso.`
                                        );
                                    }
                                },
                                error: () => {
                                    iErro++;

                                    if (iSucesso + iErro === aSelectedItems.length) {
                                        MessageToast.show(
                                            `${iSucesso} sucesso(s) e ${iErro} erro(s).`
                                        );
                                    }
                                }
                            });

                        }
                    }
                }
            });
        },

        // CRIAR OCORRÊNCIA INI ----------------------------------------------------------
        onAbrirFragmentCriarOcorrencia: function () {
            var oView = this.getView();

            // pegar modelo atual
            let oModel = oView.getModel("mdlOcorrenciasFiltradas");

            if (!oModel) {
                MessageToast.show("Selecione um período primeiro!");
                return;
            }

            // ler período selecionado para associar ao novo registro
            let sPeriodoSelecionado = oView.byId("cmbPeriodos").getSelectedKey();

            if (!sPeriodoSelecionado) {
                MessageToast.show("Selecione um período primeiro!");
                return;
            }
            
            //Saber se Usuário logado é comum
            let sPernrUsuarioLogado;
            if (this.validarSeUsuarioLogadoEhEmpregadoComum()) {
                sPernrUsuarioLogado = this.lerMatriculaSeUserLogadoForEmpregadoComum();
            }

            if (!this._oFragmentCriarOcorrencia) {
                Fragment.load({
                    id: oView.getId(),
                    name: "zhr.apontarocorrencias.view.CriarOcorrencia",
                    controller: this
                }).then(function (oDialog) {
                    this._oFragmentCriarOcorrencia = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();

                    // TESTE: Preencher campos do fragment para teste
                    oView.byId("inpFragmentEmpregado").setValue(sPernrUsuarioLogado || "00006361");
                    oView.byId("dpFragmentData").setValue('11/06/2026'); 
                    oView.byId("inpFragmentHoraInicio").setValue('04:00');
                    oView.byId("inpFragmentHoraFim").setValue('17:00');
                    // TESTE: Preencher campos do fragment para teste
                }.bind(this));
            } else {
                this._oFragmentCriarOcorrencia.open();
                // TESTE: Preencher campos do fragment para teste
                oView.byId("inpFragmentEmpregado").setValue(sPernrUsuarioLogado || "00006361");
                oView.byId("dpFragmentData").setValue('11/06/2026'); 
                oView.byId("inpFragmentHoraInicio").setValue('04:00');
                oView.byId("inpFragmentHoraFim").setValue('17:00');
                // TESTE: Preencher campos do fragment para teste
            }
        },

        onCancelarFragmentCriarOcorrencia: function () {
            this._oFragmentCriarOcorrencia.close();
        },
        
        onConfirmarFragmentCriarOcorrencia: function () {

            let oView = this.getView();

            let sPernr = oView.byId("inpFragmentEmpregado").getValue();
            let sData = oView.byId("dpFragmentData").getDateValue(); 
            //let sData = oView.byId("dpFragmentData").getValue();
            //sData = new Date(sData.getTime() + sData.getTimezoneOffset() * 60000 + 180000); // Ajuste para compensar o fuso horário e garantir que a data seja correta ao converter para UTC
            let sHoraInicio = oView.byId("inpFragmentHoraInicio").getValue() === "" ? null : oView.byId("inpFragmentHoraInicio").getValue();
            let sHoraFim = oView.byId("inpFragmentHoraFim").getValue() === "" ? null : oView.byId("inpFragmentHoraFim").getValue();

            let sPeriodo = this.byId("cmbPeriodos").getSelectedKey();
            // oNovo.Periodo = sPeriodo;

            // validação simples
            if (!sPernr) {
                MessageToast.show("Preencha Empregado");
                return;
            }

            // validação simples
            if (!sData) {
                MessageToast.show("Preencha Data");
                return;
            }

            // pegar modelo atual
            let oModel = oView.getModel("mdlOcorrenciasFiltradas");

            if (!oModel) {
                MessageToast.show("Selecione um período primeiro!");
                return;
            }

            // ler período selecionado para associar ao novo registro
            let sPeriodoSelecionado = oView.byId("cmbPeriodos").getSelectedKey();

            if (!sPeriodoSelecionado) {
                MessageToast.show("Selecione um período primeiro!");
                return;
            }

            this._oFragmentCriarOcorrencia.close();

            //--------------------------------------------------------------------------
            // CHAMAR SERVIÇO ODATA PARA CRIAR NOVA OCORRÊNCIA NO SAP
            //--------------------------------------------------------------------------
            //Formatar horas para OData
            let horaInicioOdata = this.formatTimeToOData(sHoraInicio);
            let horaFimOdata = this.formatTimeToOData(sHoraFim);
            //TODO: Testar
            let oPayload = {
                Empregado   : sPernr,
                Data        : sData,
                Contador    : 0,
                HoraInicio  : horaInicioOdata,
                HoraFim     : horaFimOdata,
                Diferenca   : '0.00',
                TipoOcorrencia : '',
                OcorInfotipo: '',
                OcorSubTipo: '',
                Observacao : '',
                Status : '01' //novo
            };

            let oModelSAP = this.getOwnerComponent().getModel(); //this.getView().getModel();
            //oModelSAP.setUseBatch(false); // Desabilita batch para garantir que a requisição seja enviada imediatamente
            oModelSAP.create("/OcorrenciasSet", oPayload, {
                success: (oData, response) => {

                    //--------------------------------------------------------------------------
                    // INSERIR NOVO REGISTRO NA TABLE da TELA FILTRADA (mdlOcorrenciasFiltradas)
                    //--------------------------------------------------------------------------
                    let aData = oModel.getData();
                    // Buscar posição para inserir novo registro
                    let positionNew = this.calcularNovaPosicaoNovoRegistro(sPernr, sData, aData);

                    // montar novo registro p/ TABLE (mesma estrutura do teu JSON)
                    let oNovoRegistroTable = {
                        Periodo: sPeriodo, // opcional se quiser preencher depois
                        Empregado: sPernr,
                        NomeEmpregado: oData.NomeEmpregado,
                        Contador: oData.Contador,
                        Data: sData, // formata para "YYYY-MM-DD"
                        HoraInicio: sHoraInicio,
                        HoraFim: sHoraFim,
                        Diferenca: oData.Diferenca,//parseFloat("0.00"),
                        TipoOcorrencia: "",
                        Justificativa: "",
                        ObservacaoSolicitacao: "",
                        Status: "01", // Novo
                        editMode: true
                    };

                    // se encontrou empregado, insere na próxima posição
                    if (positionNew >= 0 && positionNew <= aData.length) {
                        aData.splice(positionNew, 0, oNovoRegistroTable);
                    } else {
                        // se não encontrou, adiciona no fim
                        aData.push(oNovoRegistroTable);
                    }

                    // atualiza modelo
                    oModel.setData(aData);
                    oModel.refresh(true);

                    MessageToast.show("Ocorrência criada com sucesso no SAP!");
                },
                    error: (oError) => {
                        MessageToast.show("Erro ao criar ocorrência no SAP");
                }
            });
        },

        calcularNovaPosicaoNovoRegistro: function (sPernr, sData, aData) {
            // Buscar o último registro do mesmo empregado e mesma data, para inserir o novo registro logo após ele. 
            // Caso não encontre nenhum, inserir no início do período.

            let iPosicaoInsercao = aData.length;

            for (let i = 0; i < aData.length; i++) {

                let oAtual = aData[i];

                let sEmpregadoAtual = oAtual.Empregado;
                let iDataAtual = oAtual.Data.getTime();
                let iNovaData = sData.getTime();

                // =========================================
                // 1. Mesmo empregado e mesma data
                // -> encontrar último da sequência
                // =========================================
                if (
                    sEmpregadoAtual === sPernr &&
                    iDataAtual === iNovaData
                ) {

                    let j = i;

                    while (
                        j < aData.length &&
                        aData[j].Empregado === sPernr &&
                        aData[j].Data.getTime() === iNovaData
                    ) {
                        j++;
                    }

                    return j; // inserir após o último da sequência
                }

                // =========================================
                // 2. Encontrou empregado maior
                // =========================================
                if (sEmpregadoAtual > sPernr) {
                    return i;
                }

                // =========================================
                // 3. Mesmo empregado mas data maior
                // =========================================
                if (
                    sEmpregadoAtual === sPernr &&
                    iDataAtual > iNovaData
                ) {
                    return i;
                }
            }

            // =========================================
            // 4. Inserir no final
            // =========================================
            return iPosicaoInsercao;

        },
        
        formatTimeToOData: function (sTime) {
            try {
                //se hora estiver no formato "HH:mm" string
                if (typeof sTime === 'string') {
                    let parts = sTime.split(":");
                    let hours = parts[0];
                    let minutes = parts[1];
                    return "PT" + hours + "H" + minutes + "M00S";
                } else if (typeof sTime === "object") {
                    //Se hora estiver em sTime.ms
                    let sTimeUserFormat = this.formatter.formatTimeFromMs(sTime);
                    let parts = sTimeUserFormat.split(":");
                    let hours = parts[0];
                    let minutes = parts[1];
                    return "PT" + hours + "H" + minutes + "M00S";
                } else {
                    //Valor inválido
                    return "PT00H00M00S";
                }
            } catch (error) {
                //Valor inválido
                return "PT00H00M00S";
            }
        },
        // CRIAR OCORRÊNCIA FIM ----------------------------------------------------------

        // TELA DE ANEXO INI ----------------------------------------------------------
        onAbrirFragmentTelaAnexo: async function(oEvent) {
            // TESTE 4 INI ---------------------------------------------------------------

            let oContext = oEvent.getSource().getBindingContext("mdlOcorrenciasFiltradas");

            if (!oContext) {
                MessageToast.show("Não foi possível identificar a linha selecionada.");
                return;
            }

            let oDataLinha = oContext.getObject();

            if (!oDataLinha.ObrigatorioAnexo) {
                MessageToast.show("Esta Ocorrência não tem anexo");
                return;
            }

            this._oLinhaAnexoContext = oContext;
            this._oArquivoAnexo = null;

            let oView = this.getView();

            /*
            * Cria modelo inicial para evitar campo vazio enquanto a leitura ocorre.
            */
            let oModelAnexoSelecionado = new JSONModel({
                NomeArquivo: "Consultando anexo...",
                Mimetype: "",
                TemAnexo: false,

                /*
                * Compatibilidade com binding atual do fragment,
                * caso txtNomeAnexoPopup esteja ligado em AnexoNome.
                */
                AnexoNome: "Consultando anexo..."
            });

            oView.setModel(oModelAnexoSelecionado, "mdlAnexoSelecionado");

            /* //1:
            * Primeiro carrega o fragment, se ainda não existir.
            * Mas ainda não abre.
            */
            if (!this._oFragmentTelaAnexo) {
                this._oFragmentTelaAnexo = await Fragment.load({
                    id: oView.getId(),
                    name: "zhr.apontarocorrencias.view.TelaAnexo",
                    controller: this
                });

                oView.addDependent(this._oFragmentTelaAnexo);
            }

            /*
            * Limpa seleção anterior do FileUploader.
            */
            let oFileUploader = oView.byId("fileUploaderAnexo");

            if (oFileUploader) {
                oFileUploader.clear();
            }

            try {
                /* //2:
                * Aqui ocorre o GET_ENTITY da OcorrenciasAnexoSet.
                * O fragment só será aberto depois dessa leitura.
                */
                let oAnexoSAP = await this._lerAnexoDaOcorrenciaNoSAP(oDataLinha);

                let sNomeArquivo = "";
                let sMimetype = "";

                if (oAnexoSAP) {
                    /*
                    * Ajuste conforme o nome real dos campos do seu SEGW/CDS.
                    */
                    sNomeArquivo =
                        oAnexoSAP.NomeArquivo ||
                        oAnexoSAP.AnexoNome ||
                        oAnexoSAP.Filename ||
                        "";

                    sMimetype =
                        oAnexoSAP.Mimetype ||
                        oAnexoSAP.MimeType ||
                        "";
                }

                let bTemAnexo = !!sNomeArquivo;

                /*//3:
                * Atualiza o modelo do fragment.
                */
                oModelAnexoSelecionado.setData({
                    NomeArquivo: bTemAnexo ? sNomeArquivo : "Nenhum anexo informado",
                    Mimetype: sMimetype,
                    TemAnexo: bTemAnexo,

                    /*
                    * Compatibilidade com txtNomeAnexoPopup se ele usa AnexoNome.
                    */
                    AnexoNome: bTemAnexo ? sNomeArquivo : "Nenhum anexo informado"
                });

                oModelAnexoSelecionado.refresh(true);

                /*//4:
                * Opcional: atualiza também a linha local da tabela.
                * Assim, em próximas aberturas, o nome já estará no JSON local.
                */
                let oModelLocal = oView.getModel("mdlOcorrenciasFiltradas");
                let sPathLocal = oContext.getPath();

                oModelLocal.setProperty(sPathLocal + "/NomeArquivo", bTemAnexo ? sNomeArquivo : "");
                oModelLocal.setProperty(sPathLocal + "/AnexoNome", bTemAnexo ? sNomeArquivo : "");
                oModelLocal.setProperty(sPathLocal + "/Mimetype", sMimetype);
                oModelLocal.setProperty(sPathLocal + "/TemAnexo", bTemAnexo);
                oModelLocal.refresh(true);

            } catch (oError) {
                MessageToast.show("Erro ao consultar anexo no SAP.");

                oModelAnexoSelecionado.setData({
                    NomeArquivo: "Erro ao consultar anexo",
                    Mimetype: "",
                    TemAnexo: false,
                    AnexoNome: "Erro ao consultar anexo"
                });

                oModelAnexoSelecionado.refresh(true);
            }

            /*//5:
            * Abre somente após o GET_ENTITY terminar.
            */
            this._oFragmentTelaAnexo.open();

            // TESTE 4 FIM ---------------------------------------------------------------

            // // TESTE 2 INI ---------------------------------------------------------------
            // let oContext = oEvent.getSource().getBindingContext("mdlOcorrenciasFiltradas");

            // if (!oContext) {
            //     MessageToast.show("Não foi possível identificar a linha selecionada.");
            //     return;
            // }

            // let oDataLinha = oContext.getObject();

            // this._oLinhaAnexoContext = oContext;
            // this._oArquivoAnexo = null;

            // let oView = this.getView();

            // if (!this._oFragmentTelaAnexo) {
            //     this._oFragmentTelaAnexo = await Fragment.load({
            //         id: oView.getId(),
            //         name: "zhr.apontarocorrencias.view.TelaAnexo",
            //         controller: this
            //     });

            //     oView.addDependent(this._oFragmentTelaAnexo);
            // }


            // let oModelAnexoSelecionado = new JSONModel({
            //     NomeArquivo: oDataLinha.NomeArquivo || oDataLinha.AnexoNome || "Nenhum anexo informado",
            //     Mimetype: oDataLinha.Mimetype || "",
            //     TemAnexo: !!(oDataLinha.NomeArquivo || oDataLinha.AnexoNome),

            //     // Compatibilidade com binding atual do fragment
            //     AnexoNome: oDataLinha.NomeArquivo || oDataLinha.AnexoNome || "Nenhum anexo informado"
            // });

            // // let oModelAnexoSelecionado = new JSONModel({
            // //     AnexoNome: oDataLinha.AnexoNome || "Nenhum anexo informado",
            // //     AnexoConteudo: oDataLinha.AnexoConteudo || "",
            // //     TemAnexo: !!oDataLinha.AnexoConteudo
            // // });

            // oView.setModel(oModelAnexoSelecionado, "mdlAnexoSelecionado");

            // let oFileUploader = oView.byId("fileUploaderAnexo");
            // if (oFileUploader) {
            //     oFileUploader.clear();
            // }
            // this._oFragmentTelaAnexo.open();
            // // TESTE 2 FIM ---------------------------------------------------------------

        },

        onCancelarFragmentTelaAnexo: function() {

            this._oArquivoAnexo = null;

            if (this._oFragmentTelaAnexo) {
                this._oFragmentTelaAnexo.close();
            }

            // this._oFragmentTelaAnexo.close();
            // this._oLinhaAnexoContext = null;
            // this._oArquivoAnexo = null;
        },

        onArquivoSelecionado: function (oEvent) {


            let aFiles = oEvent.getParameter("files");

            if (!aFiles || !aFiles.length) {
                this._oArquivoAnexo = null;
                return;
            }

            let oFile = aFiles[0];

            /*
            * Mime type real informado pelo navegador.
            * Observação:
            * - TXT normalmente vem como text/plain.
            * - EML normalmente vem como message/rfc822.
            * - MSG pode vir como application/vnd.ms-outlook ou até vazio,
            *   dependendo do navegador/SO.
            */
            let sMimeType = this._obterMimeTypeArquivo(oFile);
            let sExtensao = this._obterExtensaoArquivo(oFile.name);

            let aTiposPermitidos = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "text/plain",
                "message/rfc822",
                "application/vnd.ms-outlook",
                "application/octet-stream"
            ];

            let aExtensoesPermitidas = [
                "pdf",
                "jpg",
                "jpeg",
                "png",
                "txt",
                "eml",
                "msg"
            ];

            /*
            * Validação por MIME + extensão.
            * Para .msg, alguns browsers retornam MIME vazio ou application/octet-stream,
            * então a extensão também precisa ser considerada.
            */
            let bMimePermitido = aTiposPermitidos.includes(sMimeType);
            let bExtensaoPermitida = aExtensoesPermitidas.includes(sExtensao);

            if (!bMimePermitido || !bExtensaoPermitida) {
                MessageToast.show("Arquivo inválido. Selecione PDF, JPG, JPEG, PNG, TXT, EML ou MSG.");
                this._oArquivoAnexo = null;
                return;
            }

            let iTamanhoMaximoMB = 45;
            let iTamanhoMaximoBytes = iTamanhoMaximoMB * 1024 * 1024;

            if (oFile.size > iTamanhoMaximoBytes) {
                MessageToast.show(`Arquivo maior que ${iTamanhoMaximoMB} MB.`);
                this._oArquivoAnexo = null;
                return;
            }

            this._oArquivoAnexo = oFile;


            // TESTE 2 INI ---------------------------------------------------------------
            // let aFiles = oEvent.getParameter("files");

            // if (!aFiles || !aFiles.length) {
            //     this._oArquivoAnexo = null;
            //     return;
            // }

            // let oFile = aFiles[0];

            // let aTiposPermitidos = [
            //     "application/pdf",
            //     "image/jpeg",
            //     "image/png"
            // ];

            // if (!aTiposPermitidos.includes(oFile.type)) {
            //     MessageToast.show("Arquivo inválido. Selecione PDF, JPG, JPEG ou PNG.");
            //     this._oArquivoAnexo = null;
            //     return;
            // }

            // let iTamanhoMaximoMB = 45;
            // let iTamanhoMaximoBytes = iTamanhoMaximoMB * 1024 * 1024;

            // if (oFile.size > iTamanhoMaximoBytes) {
            //     MessageToast.show(`Arquivo maior que ${iTamanhoMaximoMB} MB.`);
            //     this._oArquivoAnexo = null;
            //     return;
            // }
            // this._oArquivoAnexo = oFile;

            // TESTE 2 FIM ---------------------------------------------------------------

            // TESTE 1 INI ---------------------------------------------------------------
            // let aFiles = oEvent.getParameter("files");

            // if (!aFiles || !aFiles.length) {
            //     this._oArquivoAnexo = null;
            //     return;
            // }

            // let oFile = aFiles[0];

            // let aTiposPermitidos = [
            //     "application/pdf",
            //     "image/jpeg",
            //     "image/png"
            // ];

            // if (!aTiposPermitidos.includes(oFile.type)) {
            //     MessageToast.show("Arquivo inválido. Selecione PDF, JPG, JPEG ou PNG.");
            //     this._oArquivoAnexo = null;
            //     return;
            // }

            // let iTamanhoMaximoMB = 5;
            // let iTamanhoMaximoBytes = iTamanhoMaximoMB * 1024 * 1024;

            // if (oFile.size > iTamanhoMaximoBytes) {
            //     MessageToast.show(`Arquivo maior que ${iTamanhoMaximoMB} MB.`);
            //     this._oArquivoAnexo = null;
            //     return;
            // }

            // this._oArquivoAnexo = oFile;
            // TESTE 1 FIM ---------------------------------------------------------------
        },

        _obterExtensaoArquivo: function (sNomeArquivo) {
            if (!sNomeArquivo) {
                return "";
            }

            let aPartes = sNomeArquivo.toLowerCase().split(".");

            if (aPartes.length < 2) {
                return "";
            }

            return aPartes.pop();
        },

        _obterMimeTypeArquivo: function (oFile) {
            /*
            * Usa primeiro o MIME type informado pelo browser.
            * Caso venha vazio, aplica fallback pelo nome/extensão.
            */
            if (oFile && oFile.type) {
                return oFile.type;
            }

            return this._obterMimeTypePorNomeArquivo(oFile && oFile.name ? oFile.name : "");
        },

        onSalvarAnexoNoSAP: function () {


            // TESTE 4 INI ---------------------------------------------------------------
            if (!this._oLinhaAnexoContext) {
                MessageToast.show("Linha da ocorrência não identificada.");
                return;
            }

            if (!this._oArquivoAnexo) {
                MessageToast.show("Selecione um arquivo.");
                return;
            }

            this._prepararUploadCreateStream();
            // TESTE 4 FIM ---------------------------------------------------------------

            // TESTE 3 INI ---------------------------------------------------------------
            // // -------------------------------------------------------------------------
            // // Valida se a linha da tabela foi guardada quando o fragment foi aberto
            // // -------------------------------------------------------------------------
            // if (!this._oLinhaAnexoContext) {
            //     MessageToast.show("Linha da ocorrência não identificada.");
            //     return;
            // }

            // // -------------------------------------------------------------------------
            // // Valida se o usuário selecionou arquivo no FileUploader
            // // -------------------------------------------------------------------------
            // if (!this._oArquivoAnexo) {
            //     MessageToast.show("Selecione um arquivo.");
            //     return;
            // }

            // // -------------------------------------------------------------------------
            // // Para CREATE_STREAM, não converter para Base64.
            // // Enviar o próprio File como body binário da requisição.
            // // -------------------------------------------------------------------------
            // this._enviarAnexoCreateStream(this._oArquivoAnexo);
            // TESTE 3 FIM ---------------------------------------------------------------

            // // TESTE 2 INI ---------------------------------------------------------------
            // if (!this._oLinhaAnexoContext) {
            //     MessageToast.show("Linha da ocorrência não identificada.");
            //     return;
            // }

            // if (!this._oArquivoAnexo) {
            //     MessageToast.show("Selecione um arquivo.");
            //     return;
            // }

            // let oFile = this._oArquivoAnexo;
            // let oReader = new FileReader();

            // oReader.onload = (oLoadEvent) => {
            //     let sDataUrl = oLoadEvent.target.result;
            //     // Exemplo: data:application/pdf;base64,JVBERi0x...
            //     let sBase64 = sDataUrl.split(",")[1];

            //     this._gravarAnexoNaOcorrenciaNoSAP(oFile.name, sBase64);
            // };

            // oReader.onerror = () => {
            //     MessageToast.show("Erro ao ler o arquivo.");
            // };

            // oReader.readAsDataURL(oFile);
            // // TESTE 2 FIM ---------------------------------------------------------------

        },

        _prepararUploadCreateStream: function () {

            //--------------------------------------------------------------------------
            //Chamar CREATE_STREAM()
            //--------------------------------------------------------------------------

            let oView = this.getView();
            let oFileUploader = oView.byId("fileUploaderAnexo");

            if (!oFileUploader) {
                MessageToast.show("Componente de upload não encontrado.");
                return;
            }

            let oModelLocal = oView.getModel("mdlOcorrenciasFiltradas");
            let sPathLocal = this._oLinhaAnexoContext.getPath();
            let oDataLinha = oModelLocal.getProperty(sPathLocal);
            let oModelSAP = this.getOwnerComponent().getModel();
            let oFile = this._oArquivoAnexo;

            let sMimeTypeUpload = this._obterMimeTypeArquivo(oFile);

            let sDataSlug = this._formatarDataParaSlugAnexo(oDataLinha.Data);

            let sSlug = [
                oDataLinha.Empregado,
                sDataSlug,
                oDataLinha.Contador,
                oFile.name
            ].join(";");

            let sUploadUrl = oModelSAP.sServiceUrl + "/OcorrenciasAnexoSet";

            oFileUploader.setUploadUrl(sUploadUrl);
            oFileUploader.removeAllHeaderParameters();

            oModelSAP.refreshSecurityToken(
                function () {
                    let sToken = oModelSAP.getSecurityToken();

                    oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "x-csrf-token",
                        value: sToken
                    }));

                    oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "slug",
                        value: sSlug
                    }));

                    oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "Content-Type",
                        value: sMimeTypeUpload
                    }));

                    oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "Accept",
                        value: "application/json"
                    }));

                    oFileUploader.upload();
                }.bind(this),
                function () {
                    MessageToast.show("Erro ao obter token de segurança.");
                }
            );

            // let oView = this.getView();
            // let oFileUploader = oView.byId("fileUploaderAnexo");

            // if (!oFileUploader) {
            //     MessageToast.show("Componente de upload não encontrado.");
            //     return;
            // }

            // let oModelLocal = oView.getModel("mdlOcorrenciasFiltradas");
            // let sPathLocal = this._oLinhaAnexoContext.getPath();
            // let oDataLinha = oModelLocal.getProperty(sPathLocal);
            // let oModelSAP = this.getOwnerComponent().getModel();

            // let oFile = this._oArquivoAnexo;

            // let sDataSlug = this._formatarDataParaSlugAnexo(oDataLinha.Data);

            // let sSlug = [
            //     oDataLinha.Empregado,
            //     sDataSlug,
            //     oDataLinha.Contador,
            //     oFile.name
            // ].join(";");

            // let sUploadUrl = oModelSAP.sServiceUrl + "/OcorrenciasAnexoSet";

            // oFileUploader.setUploadUrl(sUploadUrl);

            // oFileUploader.removeAllHeaderParameters();

            // oModelSAP.refreshSecurityToken(
            //     function () {
            //         let sToken = oModelSAP.getSecurityToken();

            //         oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
            //             name: "x-csrf-token",
            //             value: sToken
            //         }));

            //         oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
            //             name: "slug",
            //             value: sSlug
            //         }));

            //         oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
            //             name: "Content-Type",
            //             value: oFile.type || "application/octet-stream"
            //         }));

            //         oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
            //             name: "Accept",
            //             value: "application/json"
            //         }));

            //         oFileUploader.upload();
            //     }.bind(this),
            //     function () {
            //         MessageToast.show("Erro ao obter token de segurança.");
            //     }
            // );
        },

        onUploadAnexoComplete: function (oEvent) {
            let iStatus = oEvent.getParameter("status");
            let sResponse = oEvent.getParameter("responseRaw") || oEvent.getParameter("response");

            if (iStatus >= 200 && iStatus < 300) {
                this._atualizarModeloLocalAposUpload();
                MessageToast.show("Anexo salvo com sucesso.");
                return;
            }

            MessageToast.show("Erro ao salvar anexo no SAP. Status HTTP: " + iStatus);

            // Útil para debug temporário
            // console.log("Resposta upload:", sResponse);
        },

        _atualizarModeloLocalAposUpload: function () {
            let oModelLocal = this.getView().getModel("mdlOcorrenciasFiltradas");

            if (!oModelLocal || !this._oLinhaAnexoContext || !this._oArquivoAnexo) {
                return;
            }

            let sPathLocal = this._oLinhaAnexoContext.getPath();
            let oFile = this._oArquivoAnexo;

            oModelLocal.setProperty(sPathLocal + "/NomeArquivo", oFile.name);
            oModelLocal.setProperty(sPathLocal + "/Mimetype", oFile.type);
            oModelLocal.setProperty(sPathLocal + "/TemAnexo", true);

            // Compatibilidade se sua tela ainda usa AnexoNome
            oModelLocal.setProperty(sPathLocal + "/AnexoNome", oFile.name);

            oModelLocal.refresh(true);

            let oModelAnexoSelecionado = this.getView().getModel("mdlAnexoSelecionado");

            if (oModelAnexoSelecionado) {
                oModelAnexoSelecionado.setProperty("/NomeArquivo", oFile.name);
                oModelAnexoSelecionado.setProperty("/Mimetype", oFile.type);
                oModelAnexoSelecionado.setProperty("/TemAnexo", true);
                oModelAnexoSelecionado.setProperty("/AnexoNome", oFile.name);
                oModelAnexoSelecionado.refresh(true);
            }
        },

        _formatarDataParaSlugAnexo: function (vData) {
            let oData = vData;

            // -------------------------------------------------------------------------
            // Se vier string, tenta converter para Date.
            // No seu fluxo principal, Data já costuma estar como Date.
            // -------------------------------------------------------------------------
            if (!(oData instanceof Date)) {
                oData = new Date(vData);
            }

            if (isNaN(oData.getTime())) {
                return "";
            }

            let sAno = String(oData.getFullYear());
            let sMes = String(oData.getMonth() + 1).padStart(2, "0");
            let sDia = String(oData.getDate()).padStart(2, "0");

            return sAno + sMes + sDia;
        },

        _obterMimeTypePorNomeArquivo: function (sNomeArquivo) {

            let sNome = String(sNomeArquivo || "").toLowerCase();

            if (sNome.endsWith(".pdf")) {
                return "application/pdf";
            }

            if (sNome.endsWith(".jpg") || sNome.endsWith(".jpeg")) {
                return "image/jpeg";
            }

            if (sNome.endsWith(".png")) {
                return "image/png";
            }

            if (sNome.endsWith(".txt")) {
                return "text/plain";
            }

            /*
            * Arquivo de e-mail padrão internet.
            */
            if (sNome.endsWith(".eml")) {
                return "message/rfc822";
            }

            /*
            * Arquivo de e-mail do Outlook.
            * Alguns browsers podem não reconhecer e mandar vazio.
            */
            if (sNome.endsWith(".msg")) {
                return "application/vnd.ms-outlook";
            }

            return "application/octet-stream";

            // let sNome = sNomeArquivo.toLowerCase();

            // if (sNome.endsWith(".pdf")) {
            //     return "application/pdf";
            // }

            // if (sNome.endsWith(".jpg") || sNome.endsWith(".jpeg")) {
            //     return "image/jpeg";
            // }

            // if (sNome.endsWith(".png")) {
            //     return "image/png";
            // }

            // return "application/octet-stream";
        },

        _base64ParaBlob: function (sBase64, sMimeType) {
            let sConteudoBinario = atob(sBase64);
            let iTamanho = sConteudoBinario.length;
            let aBytes = new Uint8Array(iTamanho);

            for (let i = 0; i < iTamanho; i++) {
                aBytes[i] = sConteudoBinario.charCodeAt(i);
            }

            return new Blob([aBytes], {
                type: sMimeType
            });
        },

        onVisualizarAnexo: function (oEvent) {

            // -------------------------------------------------------------------------
            // O botão está dentro do Fragment, então normalmente NÃO terá
            // BindingContext da linha da tabela.
            // Por isso usamos this._oLinhaAnexoContext, salvo quando abriu o popup.
            // -------------------------------------------------------------------------
            if (!this._oLinhaAnexoContext) {
                MessageToast.show("Não foi possível identificar a ocorrência.");
                return;
            }

            let oModelLocal = this.getView().getModel("mdlOcorrenciasFiltradas");
            let sPathLocal = this._oLinhaAnexoContext.getPath();
            let oDataLinha = oModelLocal.getProperty(sPathLocal);

            if (!oDataLinha) {
                MessageToast.show("Dados da ocorrência não encontrados.");
                return;
            }

            let oModelAnexoSelecionado = this.getView().getModel("mdlAnexoSelecionado");
            let sNomeArquivo = "anexo";
            let sMimeType = "";

            if (oModelAnexoSelecionado) {
                sNomeArquivo =
                    oModelAnexoSelecionado.getProperty("/AnexoNome") ||
                    oModelAnexoSelecionado.getProperty("/NomeArquivo") ||
                    "anexo";

                sMimeType =
                    oModelAnexoSelecionado.getProperty("/Mimetype") ||
                    oModelAnexoSelecionado.getProperty("/MimeType") ||
                    "";
            }

            // -------------------------------------------------------------------------
            // Abre uma aba vazia imediatamente no clique.
            // Isso reduz risco de bloqueio por popup blocker, pois a abertura
            // ocorre ainda dentro do evento do usuário.
            // -------------------------------------------------------------------------
            let oJanelaAnexo = window.open("", "_blank");

            if (!oJanelaAnexo) {
                MessageToast.show("O navegador bloqueou a abertura do anexo.");
                return;
            }

            oJanelaAnexo.document.write("Carregando anexo...");

            this._buscarStreamAnexoNoSAP(oDataLinha, sNomeArquivo, sMimeType)
                .then((oRetorno) => {
                    // -----------------------------------------------------------------
                    // Cria URL local temporária para visualizar o Blob retornado
                    // pelo GET_STREAM.
                    // -----------------------------------------------------------------
                    let sBlobUrl = URL.createObjectURL(oRetorno.Blob);

                    // -----------------------------------------------------------------
                    // PDF/JPG/PNG normalmente abrem direto no navegador.
                    // -----------------------------------------------------------------
                    oJanelaAnexo.location.href = sBlobUrl;

                    // -----------------------------------------------------------------
                    // Libera memória depois de algum tempo.
                    // Não revogar imediatamente, senão alguns navegadores podem
                    // perder o conteúdo antes de renderizar.
                    // -----------------------------------------------------------------
                    setTimeout(function () {
                        URL.revokeObjectURL(sBlobUrl);
                    }, 60000);
                })
                .catch((oError) => {
                    oJanelaAnexo.close();

                    let iStatus = oError && oError.status ? oError.status : "";
                    MessageToast.show("Erro ao visualizar anexo no SAP. " + iStatus);
                });

        },

        _lerAnexoDaOcorrenciaNoSAP: async function (oDataLinha) {
            // Ler anexo da ocorrência no SAP
            return new Promise((resolve, reject) => {
                let oModelSAP = this.getOwnerComponent().getModel();

                /*
                * GET_ENTITY em OData V2
                * Para chamar GET_ENTITY, o read deve ser feito em uma entidade com chave,
                * por exemplo:
                * /OcorrenciasAnexoSet(Empregado='00006361',Data=datetime'2026-06-11T00:00:00',Contador=1)
                *
                * O createKey monta corretamente o path com base no metadata do serviço.
                */
                let sPathAnexo = oModelSAP.createKey("/OcorrenciasAnexoSet", {
                    Empregado: oDataLinha.Empregado,
                    Data: oDataLinha.Data,
                    Contador: oDataLinha.Contador
                });

                oModelSAP.read(sPathAnexo, {
                    success: (oData) => {
                        /*
                        * Ajuste os nomes abaixo conforme os campos reais retornados
                        * pela entidade OcorrenciasAnexoSet.
                        *
                        * Exemplos prováveis:
                        * - NomeArquivo
                        * - AnexoNome
                        * - Mimetype
                        */
                        resolve(oData);
                    },

                    error: (oError) => {
                        /*
                        * Se o backend retornar 404 quando não existe anexo,
                        * isso não deve impedir a abertura do popup.
                        */
                        let iStatusCode = Number(oError.statusCode);

                        if (iStatusCode === 404) {
                            resolve(null);
                            return;
                        }

                        reject(oError);
                    }
                });
            });
        },

        _buscarStreamAnexoNoSAP: function (oDataLinha, sNomeArquivo, sMimeTypeInformado) {
            //--------------------------------------------------------------------------
            // Chamar GET_STREAM no SAP
            //--------------------------------------------------------------------------
            return new Promise((resolve, reject) => {
                let oModelSAP = this.getOwnerComponent().getModel();

                // ---------------------------------------------------------------------
                // Monta chave da entidade OcorrenciasAnexoSet.
                // O createKey usa o metadata do OData para montar a URL corretamente.
                // Resultado esperado:
                // /OcorrenciasAnexoSet(Empregado='...',Data=datetime'...',Contador=...)
                // ---------------------------------------------------------------------
                let sPathEntidade = oModelSAP.createKey("/OcorrenciasAnexoSet", {
                    Empregado: oDataLinha.Empregado,
                    Data: oDataLinha.Data,
                    Contador: oDataLinha.Contador
                });

                // ---------------------------------------------------------------------
                // GET_STREAM no SAP Gateway é chamado acrescentando /$value
                // ao path da entidade media.
                // ---------------------------------------------------------------------
                let sUrlStream =
                    oModelSAP.sServiceUrl.replace(/\/$/, "") +
                    sPathEntidade +
                    "/$value";

                jQuery.ajax({
                    url: sUrlStream,
                    method: "GET",

                    // -----------------------------------------------------------------
                    // responseType blob é obrigatório para receber binário.
                    // Não usar oModel.read() aqui, porque read() espera payload OData,
                    // não stream binário.
                    // -----------------------------------------------------------------
                    xhrFields: {
                        responseType: "blob"
                    },

                    headers: {
                        "Accept": sMimeTypeInformado || "application/octet-stream"
                    },

                    success: function (oBlob, sStatusText, jqXHR) {
                        let sMimeTypeRetornado =
                            jqXHR.getResponseHeader("Content-Type") ||
                            sMimeTypeInformado ||
                            this._obterMimeTypePorNomeArquivo(sNomeArquivo);

                        // -------------------------------------------------------------
                        // Alguns browsers/servidores podem devolver Blob sem type.
                        // Recriamos com o MIME correto para melhorar a visualização.
                        // -------------------------------------------------------------
                        let oBlobFinal = new Blob([oBlob], {
                            type: sMimeTypeRetornado
                        });

                        resolve({
                            Blob: oBlobFinal,
                            NomeArquivo: sNomeArquivo,
                            Mimetype: sMimeTypeRetornado
                        });
                    }.bind(this),

                    error: function (jqXHR) {
                        reject(jqXHR);
                    }
                });
            });
        },
        // TELA DE ANEXO FIM ----------------------------------------------------------

        // MATCHCODES INI ---------------------------------------------------------- 
        _ordenarArrayCrescente: function (aItens, sCampoPrimario, sCampoSecundario) {
            return aItens.sort(function (oItemA, oItemB) {
                // Converte para string para evitar erro com null, undefined ou número
                let sValorA = String(oItemA[sCampoPrimario] || "");
                let sValorB = String(oItemB[sCampoPrimario] || "");

                // Ordenação crescente com suporte a números dentro de texto.
                // Exemplo: 2 antes de 10.
                let iComparacao = sValorA.localeCompare(sValorB, "pt-BR", {
                    numeric: true,
                    sensitivity: "base"
                });

                // Se o campo principal for igual, usa o campo secundário como desempate.
                if (iComparacao === 0 && sCampoSecundario) {
                    let sValorSecA = String(oItemA[sCampoSecundario] || "");
                    let sValorSecB = String(oItemB[sCampoSecundario] || "");

                    return sValorSecA.localeCompare(sValorSecB, "pt-BR", {
                        numeric: true,
                        sensitivity: "base"
                    });
                }

                return iComparacao;
            });
        },

        onValueHelpRequestEmpregado: function (oEvent) {
            //------------------------------------------------------------------
            // MATCHCODE P/ FILTRO DE EMPREGADOS do Apontador logado no App atualmente
            //----------------------------------------------------------------

            let sIdCampoClicado = oEvent.getSource().getId();

            let oModelEmpregadosDoApontadorNoSAP = this.getView().getModel("mdlEmpregadosDoApontador");
            if (!oModelEmpregadosDoApontadorNoSAP) {
                return;
            }

            // Montar Dados
            let oDadosEmpregadosDoApontadorNoSAP = oModelEmpregadosDoApontadorNoSAP.getData() || [];

            // Ordenar
            this._ordenarArrayCrescente(
                oDadosEmpregadosDoApontadorNoSAP,
                "Empregado",
                "Nome"
            );

            let oModelValueHelp = new JSONModel(oDadosEmpregadosDoApontadorNoSAP);

            let oDialog = new sap.m.TableSelectDialog({
                title: "Selecionar Empregado",
                noDataText: "Nenhum empregado encontrado",
                contentWidth: "600px",

                columns: [
                    new sap.m.Column({
                        width: "120px",
                        header: new sap.m.Label({
                            text: "Empregado"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Nome"
                        })
                    })
                ],

                items: {
                    path: "vhEmpregados>/",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({
                                text: "{vhEmpregados>Empregado}"
                            }),
                            new sap.m.Text({
                                text: "{vhEmpregados>Nome}"
                            })
                        ]
                    })
                },

                confirm: function (oEvent) {
                    let oSelectedItem = oEvent.getParameter("selectedItem");

                    if (!oSelectedItem) {
                        return;
                    }

                    let oCtx = oSelectedItem.getBindingContext("vhEmpregados");

                    let sCodigoSelecionado = oCtx.getProperty("Empregado");

                    this.byId(sIdCampoClicado).setValue(sCodigoSelecionado);

                    this.onPesquisar();

                }.bind(this)

            });

            oDialog.setModel(oModelValueHelp, "vhEmpregados");

            this.getView().addDependent(oDialog);
            oDialog.open();

        },

        onValueHelpRequestTipoOcorrencia: function (oEvent) {
            //------------------------------------------------------------------
            // MATCHCODE P/ FILTRO DE TIPO DE OCORRÊNCIA
            //----------------------------------------------------------------

            let sIdCampoClicado = oEvent.getSource().getId();

            let oModelOcorrenciasFiltradas = this.getView().getModel("mdlOcorrenciasFiltradas");
            let oModelCodigosFrequencia = this.getView().getModel("mdlCodigosFrequencia");

            if (!oModelCodigosFrequencia) {
                MessageToast.show("Modelo de códigos de frequência ainda não carregado.");
                return;
            }

            // Montar Dados
            let aDadosCodigosFrequencia = oModelCodigosFrequencia.getData() || [];

            let aItemsCodigosFrequencia = [];

            aDadosCodigosFrequencia.forEach(function (oItem) {                

                let bJaExiste = aItemsCodigosFrequencia.some(function (oExistente) {
                    return oExistente.Codigo === oItem.Codigo;
                });

                if (!bJaExiste) {
                    aItemsCodigosFrequencia.push({
                        Codigo: oItem.Codigo,
                        CodigoDescricao: oItem.CodigoDescricao
                    });
                }
            });

            // Ordenar
            this._ordenarArrayCrescente(
                aItemsCodigosFrequencia,
                "Codigo"
            );

            let oModelValueHelp = new JSONModel(aItemsCodigosFrequencia);

            // Chamar Match Code
            let oDialog = new sap.m.TableSelectDialog({
                title: "Selecionar Justificativa",
                noDataText: "Nenhum código encontrado",
                contentWidth: "400px",
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Tipo Ocorrência"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Descrição"
                        })
                    })
                ],
                items: {
                    path: "vhCodigoFrequencia>/",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({
                                text: "{vhCodigoFrequencia>Codigo}"
                            }),
                            new sap.m.Text({
                                text: "{vhCodigoFrequencia>CodigoDescricao}"
                            })
                        ]
                    })
                },
                confirm: function (oEvent) {
                    let oSelectedItem = oEvent.getParameter("selectedItem");

                    if (!oSelectedItem) {
                        return;
                    }

                    let oCtx = oSelectedItem.getBindingContext("vhCodigoFrequencia");
                    let sCodigoSelecionado = oCtx.getProperty("Codigo");

                    this.byId(sIdCampoClicado).setValue(sCodigoSelecionado);

                    oModelOcorrenciasFiltradas.refresh(true);

                    this.onPesquisar();

                }.bind(this)
            });

            //Setar o Model no Dialog atual
            oDialog.setModel(oModelValueHelp, "vhCodigoFrequencia");
            this.getView().addDependent(oDialog);
            oDialog.open();
            
        },

        onValueHelpRequestCodigoFrequencia: function (oEvent) {
            let oInput = oEvent.getSource();
            let oContextOcorrencia = oInput.getBindingContext("mdlOcorrenciasFiltradas");

            if (!oContextOcorrencia) {
                sap.m.MessageToast.show("Não foi possível identificar a linha selecionada.");
                return;
            }

            let sPathOcorrenciasFiltradas = oContextOcorrencia.getPath();
            let oDataOcorrencia = oContextOcorrencia.getObject();

            let sTipoOcorrenciaLinha = oDataOcorrencia.TipoOcorrencia;

            if (!sTipoOcorrenciaLinha) {
                sap.m.MessageToast.show("Tipo de ocorrência não informado para esta linha.");
                return;
            }

            let oModelOcorrenciasFiltradas = this.getView().getModel("mdlOcorrenciasFiltradas");
            let oModelCodigosFrequencia = this.getView().getModel("mdlCodigosFrequencia");

            if (!oModelCodigosFrequencia) {
                sap.m.MessageToast.show("Modelo de códigos de frequência ainda não carregado.");
                return;
            }

            // Montar Dados
            let aDadosCodigosFrequencia = oModelCodigosFrequencia.getData() || [];

            let aCodigosFiltrados = aDadosCodigosFrequencia.filter(function (oItem) {
                let sCodigoOcorrencia = oItem.CodigoOcorrencia || oItem.Codigo;
                return sCodigoOcorrencia === sTipoOcorrenciaLinha;
            });

            if (!aCodigosFiltrados.length) {
                sap.m.MessageToast.show(
                    "Nenhuma justificativa encontrada para o tipo de ocorrência " + sTipoOcorrenciaLinha + "."
                );
                return;
            }

            let aItemsCodigosFrequencia = [];

            aCodigosFiltrados.forEach(function (oItem) {
                /*
                * Chave técnica para evitar remover registros válidos.
                * Não usar apenas Codigo, pois pode existir o mesmo código
                * com Infotipo/Subtipo diferentes.
                */
                let sChave = [
                    oItem.Codigo,
                    oItem.Infotipo,
                    oItem.Subtipo
                ].join("|");

                let bJaExiste = aItemsCodigosFrequencia.some(function (oExistente) {
                    return oExistente.Chave === sChave;
                });

                if (!bJaExiste) {
                    aItemsCodigosFrequencia.push({
                        Chave: sChave,
                        Codigo: oItem.Codigo,
                        //CodigoOcorrencia: oItem.CodigoOcorrencia,
                        CodigoDescricao: oItem.CodigoDescricao,
                        OcorInfotipo: oItem.Infotipo,
                        OcorSubTipo: oItem.Subtipo,
                        Descricao: oItem.Descricao,
                        Entrada: oItem.Entrada,
                        Saida: oItem.Saida
                    });
                }
            });

            // Ordenar
            this._ordenarArrayCrescente(
                aItemsCodigosFrequencia,
                "Chave"
            );

            let oModelValueHelp = new JSONModel(aItemsCodigosFrequencia);

            // Chamar Match Code
            let oDialog = new sap.m.TableSelectDialog({
                title: "Selecionar Justificativa",
                noDataText: "Nenhum código encontrado",
                contentWidth: "800px",
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Tipo Ocorrência"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Descrição"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Infotipo"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Subtipo"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Descrição Subtipo"
                        })
                    })

                ],
                items: {
                    path: "vh>/",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({
                                text: "{vh>Codigo}"
                            }),
                            new sap.m.Text({
                                text: "{vh>CodigoDescricao}"
                            }),
                            new sap.m.Text({
                                text: "{vh>OcorInfotipo}"
                            }),
                            new sap.m.Text({
                                text: "{vh>OcorSubTipo}"
                            }),
                            new sap.m.Text({
                                text: "{vh>Descricao}"
                            })
                        ]
                    })
                },
                confirm: function (oEvent) {
                    let oSelectedItem = oEvent.getParameter("selectedItem");

                    if (!oSelectedItem) {
                        return;
                    }

                    let oCtx = oSelectedItem.getBindingContext("vh");

                    let sCodigoSelecionado = oCtx.getProperty("Codigo");
                    //let sCodigoOcorrenciaSelecionado = oCtx.getProperty("CodigoOcorrencia");
                    let sDescricaoSelecionada = oCtx.getProperty("Descricao");
                    let sCodigoDescricaoSelecionada = oCtx.getProperty("CodigoDescricao");
                    let sInfotipo = oCtx.getProperty("OcorInfotipo");
                    let sSubtipo = oCtx.getProperty("OcorSubTipo");
                    let bEntrada = oCtx.getProperty("Entrada");
                    let bSaida = oCtx.getProperty("Saida");

                    let sTextoJustificativa = `${sInfotipo}-${sSubtipo}-${sDescricaoSelecionada}`;

                    oModelOcorrenciasFiltradas.setProperty(
                        sPathOcorrenciasFiltradas + "/OcorInfotipo",
                        sInfotipo
                    );

                    oModelOcorrenciasFiltradas.setProperty(
                        sPathOcorrenciasFiltradas + "/OcorSubTipo",
                        sSubtipo
                    );

                    oModelOcorrenciasFiltradas.setProperty(
                        sPathOcorrenciasFiltradas + "/Justificativa",
                        sCodigoSelecionado
                    );

                    oModelOcorrenciasFiltradas.setProperty(
                        sPathOcorrenciasFiltradas + "/JustificativaTexto",
                        sTextoJustificativa
                    );

                    oModelOcorrenciasFiltradas.setProperty(
                        sPathOcorrenciasFiltradas + "/editModeHoraInicio",
                        !!bEntrada
                    );

                    oModelOcorrenciasFiltradas.setProperty(
                        sPathOcorrenciasFiltradas + "/editModeHoraFim",
                        !!bSaida
                    );

                    oModelOcorrenciasFiltradas.refresh(true);

                    this.onPesquisar();
                }.bind(this)
            });

            oDialog.setModel(oModelValueHelp, "vh");
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onValueHelpRequestStatus: function (oEvent) {

            let oModelOcorrenciasFiltradas = this.getView().getModel("mdlOcorrencias");
            if (!oModelOcorrenciasFiltradas) {
                return;
            }

            let aDadosOcorrenciasFiltradas = oModelOcorrenciasFiltradas.getData() || [];

            // Definir Dados
            let aItemsOcorrenciasFiltradas = [];
            aDadosOcorrenciasFiltradas.forEach(function (oItem) {
                if (!aItemsOcorrenciasFiltradas.find(function (oExistente) {
                    return oExistente.Status === oItem.Status;
                })) {

                    let sDescStatus = "";
                    switch (oItem.Status) {
                        case '01':
                            sDescStatus = "Novo";
                            break;
                        case '02':
                            sDescStatus = "Em Aprovação";
                            break;
                        case '03':
                            sDescStatus = "Aprovado";
                            break;
                        case '04':
                            sDescStatus = "Reprovado";
                            break;
                        default:
                            sDescStatus = oItem.Status; //"Desconhecido";
                            break;
                    }

                    aItemsOcorrenciasFiltradas.push({
                        Status: oItem.Status,
                        DescStatus: sDescStatus
                    });
                }
            });

            // Ordenar
            this._ordenarArrayCrescente(
                aItemsOcorrenciasFiltradas,
                "Status",
                "DescStatus"
            );

            let oModelValueHelp = new JSONModel(aItemsOcorrenciasFiltradas);

            let oDialog = new sap.m.TableSelectDialog({
                title: "Selecionar Status",
                noDataText: "Nenhum status encontrado",
                contentWidth: "300px",
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Status"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Descrição"
                        })
                    })
                ],

                items: {
                    path: "vhStatus>/",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({
                                text: "{vhStatus>Status}"
                            }),
                            new sap.m.Text({
                                text: "{vhStatus>DescStatus}"
                            })
                        ]
                    })
                },

                confirm: function (oEvent) {
                    let oSelectedItem = oEvent.getParameter("selectedItem");

                    if (!oSelectedItem) {
                        return;
                    }

                    let oCtx = oSelectedItem.getBindingContext("vhStatus");

                    let sCodigoSelecionado = oCtx.getProperty("Status");

                    this.byId("inputStatus").setValue(sCodigoSelecionado);

                    this.onPesquisar();

                }.bind(this)

            });

            oDialog.setModel(oModelValueHelp, "vhStatus");

            this.getView().addDependent(oDialog);
            oDialog.open();

        },

        onValueHelpRequestGerencia: function (oEvent) {
            //------------------------------------------------------------------
            // MATCHCODE P/ FILTRO DE GERÊNCIAS
            //----------------------------------------------------------------

            let sIdCampoMatchcodeClicado = oEvent.getSource().getId();

            let oModelGerencias = this.getView().getModel("mdlOcorrencias");
            if (!oModelGerencias) {
                return;
            }

            // Montar Dados
            let aDadosGerencias = oModelGerencias.getData() || [];

            // Ordenar
            this._ordenarArrayCrescente(
                aDadosGerencias,
                "UnidadeOrganizacional",
                "UnidOrgDescricao"
            );

            //Remover duplicados
            let aDadosGerenciasSemDuplicidade = aDadosGerencias.filter(function (oItem, iIndex, aArray) {
                // Primeiro item sempre deve ser mantido
                if (iIndex === 0) {
                    return true;
                }
                // Mantém apenas quando a unidade organizacional for diferente da anterior
                return oItem.UnidadeOrganizacional !== aArray[iIndex - 1].UnidadeOrganizacional;
            });

            let oModelValueHelp = new JSONModel(aDadosGerenciasSemDuplicidade);

            let oDialog = new sap.m.TableSelectDialog({
                title: "Selecionar Gerência",
                noDataText: "Nenhuma gerência encontrada",
                contentWidth: "600px",

                columns: [
                    new sap.m.Column({
                        width: "120px",
                        header: new sap.m.Label({
                            text: "Gerência"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({
                            text: "Descrição"
                        })
                    })
                ],

                items: {
                    path: "vhGerencias>/",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({
                                text: "{vhGerencias>UnidadeOrganizacional}"
                            }),
                            new sap.m.Text({
                                text: "{vhGerencias>UnidOrgDescricao}"
                            })
                        ]
                    })
                },

                confirm: function (oEvent) {
                    let oSelectedItem = oEvent.getParameter("selectedItem");

                    if (!oSelectedItem) {
                        return;
                    }

                    let oCtx = oSelectedItem.getBindingContext("vhGerencias");

                    let sCodigoSelecionado = oCtx.getProperty("UnidadeOrganizacional");

                    this.byId(sIdCampoMatchcodeClicado).setValue(sCodigoSelecionado);

                    this.onPesquisar();

                }.bind(this)

            });

            oDialog.setModel(oModelValueHelp, "vhGerencias");

            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        // MATCHCODES FIM ----------------------------------------------------------

        // CALENDÁRIO DE STATUS INI ----------------------------------------------------------
        onAbrirFragmentCalendarioStatus: async function () {

            //Abrir Fragmento (popup Calendário de Status) INI
            let oView = this.getView();

            let bFragmentoJaFoiCarregadoAntes = false;

            if (!this._oFragmentCalendarioStatus) {
                
                this._oFragmentCalendarioStatus = await sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "zhr.apontarocorrencias.view.CalendarioStatus",
                    controller: this
                });
            } else {
                bFragmentoJaFoiCarregadoAntes = true;
                this._oFragmentCalendarioStatus.open();
            }

            this.getView().addDependent(this._oFragmentCalendarioStatus);

            this._oFragmentCalendarioStatus.open();
            //Abrir Fragmento (popup Calendário de Status) FIM

            this.preencherModeloCalendarioStatus(bFragmentoJaFoiCarregadoAntes);

        },

        onFecharFragmentCalendarioStatus: function () {
            this._oFragmentCalendarioStatus.close();
        },

        preencherModeloCalendarioStatus: function(bFragmentoJaFoiCarregadoAntes) {
            // Lógica para preencher o modelo do calendário de status para exibir no fragmento.

            if (bFragmentoJaFoiCarregadoAntes) {
                return; // Se o fragmento já foi carregado antes, não precisa preencher o modelo novamente.
            }

            let oView = this.getView();
            let oCal = oView.byId("calendar");
            let oLeg = oView.byId("legend");
            
            // Limpa dados antigos antes de recriar
            oCal.destroySpecialDates();
            oLeg.destroyItems();

            //Set no legends = []
            //Default is: ['Today', 'Selected', 'WorkingDay', 'NonWorkingDay'] 
            oLeg.setStandardItems([]);

            //Ini CalendarioDeStatusSet----------------------------------------------------------------------------

            // Limpar datas especiais existentes
            oCal.removeAllSpecialDates();

            let dDataInicio = this.lerDataInicioDoCalendario();
            let dDataFim = this.lerDataFimDoCalendario();
            let sStatusAtual = '';
            let oStatusTotal = {
                'Rejeitado': 0,
                'Aguardando aprovação': 0,
                'Aprovado': 0,
                'Não enviado': 0
            };
            if (!!dDataInicio && !!dDataFim) {
                let dDataAtual = new Date(dDataInicio);
                while (dDataAtual <= dDataFim) {

                    sStatusAtual = this._obterStatusParaData(dDataAtual, oStatusTotal);
                    
                    let sType = "None";
                    switch (sStatusAtual) {
                        case 'Rejeitado':
                            sType = "Type02"; // Vermelho - Rejeitado
                            break;
                        case 'Aguardando aprovação':
                            sType = "Type05"; // Roxo claro - Aguardando
                            break;
                        case 'Aprovado':
                            sType = "Type08"; // Verde - Aprovado
                            break;
                        case 'Não enviado':
                            sType = "Type09"; // Cinza - Não Enviado
                            break;
                        default:
                            sType = "None"; // Sem cor
                    }

                    if (sType !== "None") {
                        if (dDataAtual) {
                            oCal.addSpecialDate(new DateTypeRange({
                                startDate: new Date(dDataAtual.getTime()),
                                type: sType
                            }));
                        }
                    }
                    
                    // Avança 1 dia
                    dDataAtual.setDate(dDataAtual.getDate() + 1);
                }

                //Definir Legendas
                oLeg.addItem(new CalendarLegendItem({
                    type: "Type02", //Vermelho
                    text : `Rejeitado (${oStatusTotal['Rejeitado']})`
                }));
                oLeg.addItem(new CalendarLegendItem({
                    type: "Type09", //Cinza
                    text : `Não enviado (${oStatusTotal['Não enviado']})`
                }));
                oLeg.addItem(new CalendarLegendItem({
                    type: "Type05", //Roxo claro
                    text : `Aguardando aprovação (${oStatusTotal['Aguardando aprovação']})`
                }));
                oLeg.addItem(new CalendarLegendItem({
                    type: "Type08", //Verde
                    text : `Aprovado (${oStatusTotal['Aprovado']})`
                }));

            }

        },

        ajustarDatasCalendarioDeStatus: function () {
            aCalendarioDeStatus.forEach((oItem) => {
                let oDataCalendario = this.converterDataCalendarioSAPParaDate(oItem.Data);
                oItem.Data = oDataCalendario;
            });
        },

        lerDataInicioDoCalendario: function () {
            try {
                return aCalendarioDeStatus[0].Data;
            } catch (error) {
                return undefined;
            }
        },

        lerDataFimDoCalendario: function () {
            try {
                return aCalendarioDeStatus[aCalendarioDeStatus.length - 1].Data;
            } catch (error) {
                return undefined;
            }
        },

        _obterStatusParaData: function (dDataAtual, oStatusTotal) {
            
            let sStatusAtual = '';

            //Definir se Status=Rejeitado p/ Data Atual
            let oItemEncontradoRejeitado = aCalendarioDeStatus.find((oItem) => {
                return oItem.Data.getTime() === dDataAtual.getTime() && oItem.Status === 'Rejeitado';
            });
            if (oItemEncontradoRejeitado) {
                oStatusTotal['Rejeitado'] = oStatusTotal['Rejeitado'] + oItemEncontradoRejeitado.Quantidade;
            }

            //Definir se Status=Não enviado p/ Data Atual
            let oItemEncontradoNaoEnviado = aCalendarioDeStatus.find((oItem) => {
                return oItem.Data.getTime() === dDataAtual.getTime() && oItem.Status === 'Não enviado';
            });
            if (oItemEncontradoNaoEnviado) {
                oStatusTotal['Não enviado'] = oStatusTotal['Não enviado'] + oItemEncontradoNaoEnviado.Quantidade;
            }

            //Definir se Status=Aguardando aprovação p/ Data Atual
            let oItemEncontradoAguardando = aCalendarioDeStatus.find((oItem) => {
                return oItem.Data.getTime() === dDataAtual.getTime() && oItem.Status === 'Aguardando aprovação';
            });
            if (oItemEncontradoAguardando) {
                oStatusTotal['Aguardando aprovação'] = oStatusTotal['Aguardando aprovação'] + oItemEncontradoAguardando.Quantidade;
            }

            //Definir se Status=Aprovado p/ Data Atual
            let oItemEncontradoAprovado = aCalendarioDeStatus.find((oItem) => {
                return oItem.Data.getTime() === dDataAtual.getTime() && oItem.Status === 'Aprovado';
            });
            if (oItemEncontradoAprovado) {
                oStatusTotal['Aprovado'] = oStatusTotal['Aprovado'] + oItemEncontradoAprovado.Quantidade;
            }

            //Definir status do dia atual
            if (oItemEncontradoRejeitado) {
                sStatusAtual = 'Rejeitado';
                return sStatusAtual;
            } else if (!oItemEncontradoRejeitado && oItemEncontradoNaoEnviado) {
                sStatusAtual = 'Não enviado';
                return sStatusAtual;
            } else if (!oItemEncontradoRejeitado && !oItemEncontradoNaoEnviado && oItemEncontradoAguardando) {
                sStatusAtual = 'Aguardando aprovação';
                return sStatusAtual;
            } else if (!oItemEncontradoRejeitado && !oItemEncontradoNaoEnviado && !oItemEncontradoAguardando && oItemEncontradoAprovado) {
                sStatusAtual = 'Aprovado';
                return sStatusAtual;
            }
        
        },

        converterDataCalendarioSAPParaDate: function (sDataSAP) {
            /*
            * Converte datas no formato SAP yyyyMMddHHmmss para objeto Date.
            *
            * Exemplo:
            * Entrada:  "20250801000000"
            * Saída:    Date(2025, 7, 1, 0, 0, 0)
            *
            * Observação:
            * - No JavaScript, o mês começa em zero.
            * - Janeiro = 0
            * - Agosto = 7
            */

            if (!sDataSAP) {
                return null;
            }

            let sDataTexto = String(sDataSAP);

            /*
            * Garante que o valor tenha pelo menos yyyyMMdd.
            * Para o seu caso, o esperado é yyyyMMddHHmmss com 14 caracteres.
            */
            if (sDataTexto.length < 8) {
                return null;
            }

            let iAno = Number(sDataTexto.substring(0, 4));
            let iMes = Number(sDataTexto.substring(4, 6)) - 1;
            let iDia = Number(sDataTexto.substring(6, 8));

            let iHora = Number(sDataTexto.substring(8, 10) || "0");
            let iMinuto = Number(sDataTexto.substring(10, 12) || "0");
            let iSegundo = Number(sDataTexto.substring(12, 14) || "0");

            let oData = new Date(iAno, iMes, iDia, iHora, iMinuto, iSegundo);

            /*
            * Validação defensiva:
            * evita enviar Date inválida para o Calendar.
            */
            if (isNaN(oData.getTime())) {
                return null;
            }

            /*
            * Validação da faixa aceita pelo Calendar/UI5.
            */
            if (iAno < 1 || iAno > 9999) {
                return null;
            }

            return oData;
        },

        // CALENDÁRIO DE STATUS FIM ----------------------------------------------------------

        // JUSTIFICATIVA EM MASSA INI ----------------------------------------------------------
        onPreencherJustificativaEmMassa: function() {
            let oSmartTable = this.byId("smartTable");
            let oTable = oSmartTable.getTable();
            let omodelLocal = this.getView().getModel("mdlOcorrenciasFiltradas");

            let aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageToast.show("Selecione mais de uma ocorrência.");
                return;
            }

            let sJustificativa = '';
            let sJustificativaTexto = '';
            for (let i = 0; i < aSelectedItems.length; i++) {
                               
                const oItem = aSelectedItems[i];            

                let oContext = oItem.getBindingContext("mdlOcorrenciasFiltradas");
                
                let oDataLinha = oItem
                    .getBindingContext("mdlOcorrenciasFiltradas")
                    .getObject();

                if (i === 0) {
                    sJustificativa      = oDataLinha.Justificativa;
                    sJustificativaTexto = oDataLinha.JustificativaTexto;
                } else {

                    if (oDataLinha.Status !== '01') {
                        MessageToast.show(`Status deve ser Novo para ${oDataLinha.Empregado} - ${oDataLinha.Data}.`);
                        continue;
                    }

                    oDataLinha.Justificativa        = sJustificativa;
                    oDataLinha.JustificativaTexto   = sJustificativaTexto;
                    omodelLocal.setProperty(
                        oContext.getPath(),
                        oDataLinha
                    );
                }
            }

            // oModelLocal.refresh(true);
        },
        // JUSTIFICATIVA EM MASSA FIM ----------------------------------------------------------

        // MENU INI ----------------------------------------------------------
        onMenuPress: function(oEvent) {
            let oButton = oEvent.getSource();
            if (!this._oMenu) {
                this._oMenu = new sap.m.Menu({
                    items: [
                        new MenuItem({
                            text: "Lista de Aprovadores",
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }
                        }),
                        new MenuItem({
                            text: "Códigos de Frequência", 
                            visible: oAppConfig.menus.visibleCodigosDeFrequencia,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }                            
                        }),
                        new MenuItem({
                            text: "Resumos de Ajustes",
                            visible: oAppConfig.menus.visibleResumoDeAjustes,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }                            
                        }),
                        new MenuItem({
                            text: "Relatório de Frequência",
                            visible: oAppConfig.menus.visibleRelatorioDeFrequencia,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }
                        }),
                        new MenuItem({
                            text: "Ponto Eletrônico",
                            visible: oAppConfig.menus.visiblePontoEletronico,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }
                        }),
                        new MenuItem({
                            text: "Base de Conhecimento",
                            visible: oAppConfig.menus.visibleBaseDeConhecimento,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }
                        }),
                        new MenuItem({
                            text: "Autoestudo",
                            visible: oAppConfig.menus.visibleAutoEstudo,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }
                        }),
                        new MenuItem({
                            text: "FAQ",
                            visible: oAppConfig.menus.visibleFAQ,
                            press: function() {
                                MessageToast.show("Opção selecionada");
                            }
                        })
                    ]
                });
            }
            this._oMenu.openBy(oButton);
        }
        // MENU FIM ----------------------------------------------------------

    });
});
