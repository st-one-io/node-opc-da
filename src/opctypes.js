// @ts-check

const constants = require('./constants');

/**
 * This file contain the function definitions for OPC types that dont need a whole class for themselves
 */

 
/**
 * 
 * @param {Number} id 
 */
function OPCNAMESPACETYPEfromID(id) {
    switch(id){
    case 1:
        return constants.opc.namespaceType.HIERARCHIAL;
    case 2:
        return constants.opc.namespaceType.FLAT;
    default:
        return constants.opc.namespaceType.UNKNOWN;
    }
}

module.exports = {
    OPCNAMESPACETYPEfromID
}


