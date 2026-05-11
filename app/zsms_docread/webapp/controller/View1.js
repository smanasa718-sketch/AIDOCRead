sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {

    "use strict";

    return Controller.extend("project.controller.View1", {

        onInit: function () {

            const oModel = new JSONModel({
                answer: ""
            });

            this.getView().setModel(oModel, "ai");
        },

        onAskAI: async function () {

            const response = await fetch(
                "/odata/v4/docReadService/ask",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question: ""
                    })
                }
            );

            const data = await response.json();

            this.getView()
                .getModel("ai")
                .setProperty("/answer", data.value);
        }
    });
});