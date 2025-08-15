/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"co/com/concreto/reportenumerodeordendeoperacion/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
