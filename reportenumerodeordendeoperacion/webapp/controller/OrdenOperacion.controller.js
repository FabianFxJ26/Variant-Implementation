sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    'sap/m/library',
    "sap/m/MessageToast",
    "sap/m/VariantItem"
], (Controller,
    JSONModel,
    SelectDialog,
    StandardListItem,
    mLibrary, MessageToast, VariantItem) => {
    "use strict";

    return Controller.extend("co.com.concreto.reportenumerodeordendeoperacion.controller.OrdenOperacion", {
        onInit() {
            const oOrdenOperacion = this.getOwnerComponent().getModel();
            const oViewModel = new JSONModel({ rows: [], busy: true });
            this.getView().setModel(oViewModel, "view");
            this._oVM = this.getView().byId("idVariantManagement");

            this._loadVariantsFromLocalStorage();

            this._readOrdenOperacion(oOrdenOperacion).then(aData => {
                oViewModel.setProperty("/rows", aData);
                oViewModel.setProperty("/busy", false);
            }).catch(err => {
                oViewModel.setProperty("/busy", false);
                console.error("Error al leer OData", err);
            });
        },
        // Guardar en localStorage
        _saveVariantToLocalStorage: function (sKey, oVariantContent) {
            localStorage.setItem("variant_" + sKey, JSON.stringify(oVariantContent));
        },
        _loadVariantFromLocalStorage: function (sKey) {
            var sData = localStorage.getItem("variant_" + sKey);
            return sData ? JSON.parse(sData) : null;
        },

        _loadVariantsFromLocalStorage: function () {
            for (var i = 0; i < localStorage.length; i++) {
                var sKey = localStorage.key(i);
                if (sKey.startsWith("variant_")) {
                    var oVariantContent = JSON.parse(localStorage.getItem(sKey));
                    var sVariantKey = sKey.replace("variant_", "");

                    var oItem = new sap.m.VariantItem({
                        key: sVariantKey,
                        title: oVariantContent.name,
                        remove: true
                    });

                    this._oVM.addItem(oItem);
                }
            }
        },

        _readOrdenOperacion: function (oOrdenOperacionModel) {
            return new Promise((resolve, reject) => {
                oOrdenOperacionModel.read("/YY1_ReportOrdOpOxa", {
                    success: oOrdenOperacionData => {
                        const aData = oOrdenOperacionData.results.map(orden => ({
                            PosicionAsientoContable: orden.LedgerGLLineItem,
                            NumeroDocumento: orden.AccountingDocument,
                            Acreedor: orden.Supplier,
                            NumeroFactura: orden.DocumentReferenceID
                        }));
                        resolve(aData);
                    },
                    error: reject
                });
            });
        },
        onInputValueHelpRequest: function (oEvent) {
            const oInput = oEvent.getSource();
            const sInpudId = oInput.getId();
            const oView = this.getView();
            const oModel = oView.getModel("view");

            let sCampoModelo = "";
            if (sInpudId.includes("Acreedor")) {
                sCampoModelo = "Acreedor";
            }

            // 🔹 Extraer lista de acreedores únicos
            const aRows = oModel.getProperty("/rows") || [];
            const aUniqueValues = [...new Set(aRows.map(row => row[sCampoModelo]))]
                .filter(v => !!v) // eliminar nulos/vacíos
                .map(v => ({ value: v }));

            // 🔹 Crear modelo temporal solo con valores únicos
            const oUniqueModel = new sap.ui.model.json.JSONModel({ values: aUniqueValues });

            // 🔹 Crear SelectDialog con modelo temporal
            const oDialog = new sap.m.SelectDialog({
                title: "Seleccione un " + sCampoModelo,
                items: {
                    path: "/values",
                    template: new sap.m.StandardListItem({
                        title: "{value}"
                    })
                },
                confirm: (oEvt) => {
                    const oSelected = oEvt.getParameter("selectedItem");
                    if (oSelected) {
                        oInput.setValue(oSelected.getTitle()); // poner valor en el input
                    }
                }
            });

            oDialog.setModel(oUniqueModel); // asignar modelo
            this.getView().addDependent(oDialog);
            oDialog.open("");
        },
        /**
         * Esta funcion apenas selecciones un campo del filtro refresca la GUI
         * @param {*} oEvent 
         */
        /*_applyFilter: function (sCampo, sValor) {
            const oTable = this.byId("idRowsTable");
            const oBinding = oTable.getBinding("items");

            if (sValor) {
                const oFilter = new sap.ui.model.Filter(sCampo, sap.ui.model.FilterOperator.EQ, sValor);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]); // limpiar filtro
            }
        },*/
        onIrButtonPress: function (oEvent) {
            const oView = this.getView();
            const oTable = oView.byId("idRowsTable")
            const oBinding = oTable.getBinding("items");

            const acreedorValue = oView.byId("idAcreedorFilterInput").getValue().trim();
            const aFilters = [];

            if (acreedorValue) {
                aFilters.push(new sap.ui.model.Filter("Acreedor", sap.ui.model.FilterOperator.Contains, acreedorValue));
            }
            oBinding.filter(aFilters);
        },
        _showMessagesMessage: function (sMessage) {
            MessageToast.show(sMessage, {
                closeOnBrowserNavigation: true
            });
        },
        _checkCurrentVariant: function () {
            var sSelectedKey = this._oVM.getSelectedKey();
            var oItem = this._oVM.getItemByKey(sSelectedKey);
            if (!oItem) {
                var sKey = this._oVM.getStandardVariantKey();
                if (sKey) {
                    this._oVM.setSelectedKey(sKey);
                }
            }
        },
        /*_updateItems: function (mParams) {
            if (mParams.deleted) {
                mParams.deleted.forEach(function (sKey) {
                    var oItem = this._oVM.getItemByKey(sKey);
                    if (oItem) {
                        this._oVM.removeItem(oItem);
                        oItem.destroy();
                    }
                }.bind(this));
            }

            if (mParams.hasOwnProperty("def")) {
                this._oVM.setDefaultKey(mParams.def);
            }

            this._checkCurrentVariant();
        },*/
        /*_createNewItem: function (mParams) {
            var sKey = "key_" + Date.now();

            var oItem = new VariantItem({
                key: sKey,
                title: mParams.name,
                executeOnSelect: mParams.execute,
                author: "sample"
            });

            if (mParams.hasOwnProperty("public") && mParams.public) {
                oItem.setSharing(SharingMode.Public);
            }
            if (mParams.def) {
                this._oVM.setDefaultKey(sKey);
            }

            this._oVM.addItem(oItem);

            this._showMessagesMessage("New view '" + oItem.getTitle() + "' created with key:'" + sKey + "'.");
        },
        onPress: function (event) {
            this._oVM.setModified(!this._oVM.getModified());
        },*/
        onManage: function (event) {
            var params = event.getParameters();

            // 🔹 Eliminar variantes seleccionadas
            if (params.deleted) {
                params.deleted.forEach(function (sKey) {
                    // 1. Eliminar del VariantManagement
                    var oItem = this._oVM.getItemByKey(sKey);
                    if (oItem) {
                        this._oVM.removeItem(oItem);
                        oItem.destroy();
                    }

                    // 2. Eliminar de localStorage
                    localStorage.removeItem("variant_" + sKey);
                }.bind(this));
            }

            // 🔹 Si se cambió la variante por defecto
            if (params.hasOwnProperty("def")) {
                this._oVM.setDefaultKey(params.def);
            }

            // Revisar variante actual
            this._checkCurrentVariant();

            this._showMessagesMessage("Gestión de variantes actualizada.");
        },
        onSelect: function (event) {
            var params = event.getParameters();
            var sKey = params.key;
            var oView = this.getView();

            // 🔹 Cargar desde localStorage
            var oVariantContent = this._loadVariantFromLocalStorage(sKey);

            if (oVariantContent) {
                // Restaurar filtros
                oView.byId("idAcreedorFilterInput").setValue(oVariantContent.acreedorValue || "");

                // Aplicar filtros automáticamente
                this.onIrButtonPress();

                this._showMessagesMessage("Variante '" + oVariantContent.name + "' aplicada.");
            }

            this._oVM.setModified(false);
        },
        onSave: function (event) {
            var params = event.getParameters();
            var oView = this.getView();

            // Capturar valores de filtros actuales
            var oVariantContent = {
                name: params.name,
                acreedorValue: oView.byId("idAcreedorFilterInput").getValue()
            };

            var sKey = params.key || "key_" + Date.now();

            if (params.overwrite) {
                var oItem = this._oVM.getItemByKey(sKey);
                if (oItem) {
                    oItem.data("variantContent", oVariantContent);
                }
            } else {
                var oItem = new sap.m.VariantItem({
                    key: sKey,
                    title: oVariantContent.name,
                    remove: true
                });
                oItem.data("variantContent", oVariantContent);
                this._oVM.addItem(oItem);
            }

            // 🔹 Guardar en localStorage
            this._saveVariantToLocalStorage(sKey, oVariantContent);

            this._showMessagesMessage("Variante '" + oVariantContent.name + "' guardada.");
            this._oVM.setModified(false);
        },
    });
});