"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeColumnName = void 0;
const makeColumnName = (selectKey) => {
    return selectKey
        .split('.')
        .map(str => `"${str}"`)
        .join('.');
};
exports.makeColumnName = makeColumnName;
//# sourceMappingURL=makeColumnName.js.map