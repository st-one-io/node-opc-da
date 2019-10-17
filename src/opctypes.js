// @ts-check

const constants = require('./constants');
const dcom = require('node-dcom');

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

class OPCITEMDEF
{
    constructor() {
        this.accessPath = "";

        this.itemID = "";

        this.active = true;

        this.clientHandle;

        this.requestedDataType = null;

        this.reserved;
    }

    getAccessPath() {
        return this.accessPath;
    }

    setAccessPath(accessPath) {
        this.accessPath = accessPath;
    }

    getClientHandle() {
        return this.clientHandle;
    }

    setClientHandle(clientHandle) {
        this.clientHandle = clientHandle;
    }

    isActive() {
        return this.active;
    }

    setActive(active) {
        this.active = active;
    }

    getItemID() {
        return this.itemID;
    }

    setItemID(itemID) {
        this.itemID = itemID;
    }

    getRequestedDataType() {
        return this.requestedDataType;
    }

    setRequestedDataType(requestedDataType) {
        this.requestedDataType = requestedDataType;
    }

    getReserved() {
        return this.reserved;
    }

    setReserved(reserved) {
        this.reserved = reserved;
    }

    /**
     * Convert to structure to a J-Interop structure
     * 
     * @return the j-interop structe
     * @throws JIException
     */
    toStruct() {
        let struct = new dcom.Struct ();
        struct.addMember(new dcom.ComValue(new dcom.ComString(this.getAccessPath(), dcom.Flags.FLAG_REPRESENTATION_STRING_LPWSTR ),
            dcom.Types.COMSTRING));
        struct.addMember(new dcom.ComValue(new dcom.ComString(this.getItemID(), dcom.Flags.FLAG_REPRESENTATION_STRING_LPWSTR ), 
            dcom.Types.COMSTRING));
        struct.addMember(new dcom.ComValue(Number(this.isActive() ? 1 : 0 ), dcom.Types.INTEGER));
        struct.addMember(new dcom.ComValue(Number(this.getClientHandle()), dcom.Types.INTEGER) );

        struct.addMember(new dcom.ComValue(Number( 0 ), dcom.Types.INTEGER)); // blob size
        struct.addMember(new dcom.ComValue(new dcom.Pointer(null, true),dcom.Types.POINTER)); // blob

        struct.addMember(new dcom.ComValue(Number(this.getRequestedDataType()), dcom.Types.SHORT));
        struct.addMember(new dcom.ComValue(Number(this.getReserved()), dcom.Types.SHORT));
        return struct;
    }
}
module.exports = {
    OPCITEMDEF,
    OPCNAMESPACETYPEfromID
}