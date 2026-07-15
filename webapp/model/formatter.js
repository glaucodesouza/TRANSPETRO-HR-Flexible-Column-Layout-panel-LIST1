sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";
 
    return {
 
        statusText: function (status) {
            switch (status) {
                case "01": return "Novo"; break;
                case "02": return "Em aprovação"; break;
                case "03": return "Aprovado"; break;
                case "04": return "Reprovado"; break;
                default: return "Desconhecido"; break;
            }
        },
 
        statusIcon: function (status) {
            return "sap-icon://circle-task-2";
        },
 
        statusState: function (status) {
            switch (status) {
                case "01": return "Success"; break;
                case "02": return "Warning"; break;
                case "03": return "Information"; break;
                case "04": return "Error"; break;
                default: return "None";
            }
        },

        formatTimeFromMs: function (horaDoSAP) {
            
            // Caso receba do botão Criar Registro
            if (!horaDoSAP.ms) {
                return "00:00"; // Retorna o valor original se não for um objeto com a propriedade "ms"
            }
            
            //Caso receba indefinido
            if (horaDoSAP === null || horaDoSAP === undefined || Number.isNaN(horaDoSAP.ms)) {
                return "";
            }

            // Caso receba do OData.Ocorrencias.READ()
            let oDate = new Date(horaDoSAP.ms);
            
            return oDate.toISOString().slice(11, 16); // HH:mm

        },

        formatDateBR: function (sDate) {
            if (!sDate) return "";

            // Converte para objeto Date
            let oDate = new Date(sDate);
            // força manter dia local
            oDate = new Date(oDate.getTime() + oDate.getTimezoneOffset() * 60000);

            // Formato brasileiro dd/MM/yyyy
            let oFormatter = DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });

            let sFormattedDate = oFormatter.format(oDate);
            return sFormattedDate.trim();
        }
 
    };
});
