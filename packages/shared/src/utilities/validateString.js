"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateString = void 0;
const validateString = (string) => /^(_|[a-zA-Z0-9])+(_?[a-zA-Z0-9]+)*$/.test(string);
exports.validateString = validateString;
exports.default = exports.validateString;
//# sourceMappingURL=validateString.js.map