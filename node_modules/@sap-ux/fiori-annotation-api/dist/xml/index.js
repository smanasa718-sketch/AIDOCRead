"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XML_VOCABULARY_SERVICE = exports.getLocalEDMXService = exports.XMLAnnotationServiceAdapter = void 0;
const odata_vocabularies_1 = require("@sap-ux/odata-vocabularies");
var adapter_1 = require("./adapter");
Object.defineProperty(exports, "XMLAnnotationServiceAdapter", { enumerable: true, get: function () { return adapter_1.XMLAnnotationServiceAdapter; } });
var service_1 = require("./service");
Object.defineProperty(exports, "getLocalEDMXService", { enumerable: true, get: function () { return service_1.getLocalEDMXService; } });
exports.XML_VOCABULARY_SERVICE = new odata_vocabularies_1.VocabularyService();
//# sourceMappingURL=index.js.map