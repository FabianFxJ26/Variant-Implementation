/*global QUnit*/

sap.ui.define([
	"co/com/concreto/reportenumerodeordendeoperacion/controller/OrdenOperacion.controller"
], function (Controller) {
	"use strict";

	QUnit.module("OrdenOperacion Controller");

	QUnit.test("I should test the OrdenOperacion controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
