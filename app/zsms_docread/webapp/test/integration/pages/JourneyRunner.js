sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"zsmsdocread/test/integration/pages/zdocumentList",
	"zsmsdocread/test/integration/pages/zdocumentObjectPage"
], function (JourneyRunner, zdocumentList, zdocumentObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('zsmsdocread') + '/test/flp.html#app-preview',
        pages: {
			onThezdocumentList: zdocumentList,
			onThezdocumentObjectPage: zdocumentObjectPage
        },
        async: true
    });

    return runner;
});

