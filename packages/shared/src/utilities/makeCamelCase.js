"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCamelCase = void 0;
const camelCase_js_1 = __importDefault(require("lodash/camelCase.js"));
const makeCamelCase = (...strings) => (0, camelCase_js_1.default)(strings.join(' '));
exports.makeCamelCase = makeCamelCase;
exports.default = exports.makeCamelCase;
//# sourceMappingURL=makeCamelCase.js.map