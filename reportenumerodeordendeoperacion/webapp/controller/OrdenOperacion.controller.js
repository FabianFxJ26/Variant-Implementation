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

            this._readOrdenOperacion(oOrdenOperacion).then(aData => {
                oViewModel.setProperty("/rows", aData);
                oViewModel.setProperty("/busy", false);
            }).catch(err => {
                oViewModel.setProperty("/busy", false);
                console.error("Error al leer OData", err);
            });
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

            const oDialog = new sap.m.SelectDialog({
                title: "Selecciones un " + sCampoModelo,
                items: {
                    path: "view>/rows",
                    template: new sap.m.StandardListItem({
                        title: "{view>Acreedor}"
                    })
                },
                confirm: (oEvt) => {
                    const oSelected = oEvt.getParameter("selectedItem");
                    if (oSelected) {
                        oInput.setValue(oSelected.getTitle()); // poner valor en el input
                        //this._applyFilter(sCampoModelo, oSelected.getTitle()); // aplicar filtro
                    }
                }
            });
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
        _updateItems: function (mParams) {
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
        },
        _createNewItem: function (mParams) {
            var sKey = "key_" + Date.now();

            var oItem = new VariantItem({
                key: sKey,
                title: mParams.name,
                executeOnSelect: mParams.execute,
                author: "sample",
                changeable: true,
                remove: true
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
        },
        onManage: function (event) {
            var params = event.getParameters();
            this._updateItems(params);
        },
        onSelect: function (event) {
            var params = event.getParameters();
            var sMessage = "Selected Key: " + params.key;
            this._showMessagesMessage(sMessage);
            this._oVM.setModified(false);
        },
        onSave: function (event) {
            var params = event.getParameters();
            if (params.overwrite) {
                var oItem = this._oVM.getItemByKey(params.key);
                this._showMessagesMessage("View '" + oItem.getTitle() + "' updated.");
            } else {
                this._createNewItem(params);
            }

            this._oVM.setModified(false);
        }
    });
});