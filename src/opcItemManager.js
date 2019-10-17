//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');
const util = require('util');
const debug = util.debuglog('node-opc-da');

const { CallBuilder, ComArray, ComString, ComValue, Flags, Pointer, Struct, Variant, Types } = require('node-dcom');

/**
 * @typedef {object} ItemStruct
 * @property {string} itemID
 * @property {number} clientHandle
 * @property {string} [accessPath]
 * @property {boolean} [active]
 * @property {number} [requestedDataType]
 * @property {number} [reserved]
 */

/**
 * @typedef {object} ItemResponse
 * @property {string} itemID
 * @property {number} serverHandle
 * @property {number} cannonicalDataType
 * @property {number} reserved
 * @property {number} accessRights
 */

/**
 * 
 * @param {ItemStruct} item
 * @returns {Struct}
 */
function getItemDefStruct(item) {

  let itemID, clientHandle, accessPath, active, requestedDataType, reserved;

  if (item.itemID === null || item.itemID === undefined) {
    throw new Error("Missing required itemID")
  }
  itemID = item.itemID;
  clientHandle = item.clientHandle || Math.random() * 0xffffffff;
  accessPath = item.accessPath || '';
  active = item.active !== undefined ? item.active : true;
  requestedDataType = item.requestedDataType || 0;
  reserved = item.reserved || 0;

  let struct = new Struct();
  struct.addMember(new ComValue(new ComString(accessPath, Flags.FLAG_REPRESENTATION_STRING_LPWSTR), Types.COMSTRING));
  struct.addMember(new ComValue(new ComString(itemID, Flags.FLAG_REPRESENTATION_STRING_LPWSTR), Types.COMSTRING));
  struct.addMember(new ComValue(active ? 1 : 0, Types.INTEGER));
  struct.addMember(new ComValue(clientHandle, Types.INTEGER));
  struct.addMember(new ComValue(0, Types.INTEGER)); //blob size
  struct.addMember(new ComValue(new Pointer(null), Types.POINTER)); // blob
  struct.addMember(new ComValue(requestedDataType, Types.SHORT));
  struct.addMember(new ComValue(reserved, Types.SHORT));

  return struct;
}

/**
 * @returns {Struct}
 */
function getItemResultStruct() {
  let struct = new Struct();

  struct.addMember(new ComValue(null, Types.INTEGER)); // Server handle
  struct.addMember(new ComValue(null, Types.SHORT)); // data type
  struct.addMember(new ComValue(null, Types.SHORT)); // reserved
  struct.addMember(new ComValue(null, Types.INTEGER)); // access rights
  struct.addMember(new ComValue(null, Types.INTEGER)); // blob size
  struct.addMember(new ComValue(new Pointer(new ComValue(new ComArray(new ComValue(null, Types.BYTE), null, 1, true, false), Types.COMARRAY)), Types.POINTER)); // blob size

  return struct;
}

/**
 * Represents an OPC Server
 */
class OPCItemManager {

  constructor() {
    this._comObj = null;
  }

  /**
   *
   * @param {*} unknown
   * @returns {Promise<void>}
   */
  async init(unknown) {
    debug("Initing ItemManager...");
    if (this._comObj) throw new Error("Already initialized");

    this._comObj = await unknown.queryInterface(constants.iid.IOPCItemMgt_IID);
    debug("ItemManager successfully initted");
  }

  /**
   * @returns {Promise<void>}
   */
  async end() {
    debug("Destroyin ItemManager...");
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
    debug("ItemManager successfully destroyed.");
  }

  /**
   * 
   * @param {Array<ItemStruct>} items
   * @returns {Promise<Array<Array<number,ItemResponse>>>}
   * @opNum 0
   */
  async add(items) {
    debug("Adding " + items.length + " to the current group: ");
    for (let i = 0; i < items.length; i++)
      debug(items[i].itemID);

    if (!this._comObj) throw new Error("Not initialized");

    if (!(items.length > 0)) return [];

    let structs = [];
    for (const item of items) {
      structs.push(new ComValue(getItemDefStruct(item), Types.STRUCT));
    }

    let itemArray = new ComArray(new ComValue(structs, Types.STRUCT), true);

    let callObject = new CallBuilder(true);
    callObject.setOpnum(0);

    callObject.addInParamAsInt(items.length, Flags.FLAG_NULL);
    callObject.addInParamAsArray(itemArray, Flags.FLAG_NULL);
    let resStructArray = new ComArray(new ComValue(getItemResultStruct(), Types.STRUCT), null, 1, true)
    let errCodesArray = new ComArray(new ComValue(null, Types.INTEGER), null, 1, true)
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(resStructArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(errCodesArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);

    let resultObj = await this._comObj.call(callObject);

    let hresult = resultObj.hresult;
    let result = resultObj.getResults();
    if (hresult != 0) {
        if (result.lenght == 0)
            throw new Error(String(hresult));
        else 
            debug(new Error(String(hresult)));
    }

    let results = result[0].getValue().getReferent().getArrayInstance();
    let errorCodes = result[1].getValue().getReferent().getArrayInstance();

    let res = [];
    let failed = [];
    for (let i = 0; i < items.length; i++) {
      let resObj = {
        itemID: items[i].itemID,
        serverHandle: results[i].getValue().getMember(0).getValue(),
        cannonicalDataType: results[i].getValue().getMember(1).getValue(),
        reserved: results[i].getValue().getMember(2).getValue(),
        accessRights: results[i].getValue().getMember(3).getValue()

      };
      res.push([errorCodes[i].getValue(), resObj]);
      if (errorCodes[i].getValue() != 0)
        failed.push([errorCodes[i].getValue(), resObj.itemID]);
    }
    debug("A total of " + (res.length - failed.length) + " items were successfully added to the group.");
    if (failed.length > 0) {
      debug("The following items were not added: ");
      for (let i = 0; i < failed.length; i++)
        debug("Item: " + failed[i][0] + " ErrorCode: " + failed[i][1]);
    }
    return res;
  }

  /**
   * 
   * @param {Array<ItemStruct>} items
   * @returns {Promise<Array<Array<number,ItemResponse>>>}
   * @opNum 1
   */
  async validate(items) {
    debug("Querying server to validade " + items.length + " items: ");
    for (let i = 0; i < items.length; i++)
      debug(items[i].itemID);
    
    if (!this._comObj) throw new Error("Not initialized");

    if (!(items.length > 0)) return [];

    let structs = [];
    for (const item of items) {
      structs.push(new ComValue(getItemDefStruct(item), Types.STRUCT));
    }

    let itemArray = new ComArray(new ComValue(structs, Types.STRUCT), true);

    let callObject = new CallBuilder(true);
    callObject.setOpnum(1);

    callObject.addInParamAsInt(items.length, Flags.FLAG_NULL);
    callObject.addInParamAsArray(itemArray, Flags.FLAG_NULL);
    callObject.addInParamAsInt(0, Flags.FLAG_NULL); // don't update blobs
    let resStructArray = new ComArray(new ComValue(getItemResultStruct(), Types.STRUCT), null, 1, true)
    let errCodesArray = new ComArray(new ComValue(null, Types.INTEGER), null, 1, true)
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(resStructArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(errCodesArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);

    let resultObj = await this._comObj.call(callObject);

    let hresult = resultObj.hresult;
    let result = resultObj.getResults();
    if (hresult != 0) {
        if (result.lenght == 0)
            throw new Error(String(hresult));
        else 
            debug(new Error(String(hresult)));
    }

    let results = result[0].getValue().getReferent().getArrayInstance();
    let errorCodes = result[1].getValue().getReferent().getArrayInstance();

    let res = [];
    let failed = []
    for (let i = 0; i < items.length; i++) {
      let resObj = {
        itemID: items[i].itemID,
        serverHandle: results[i].getValue().getMember(0),
        cannonicalDataType: results[i].getValue().getMember(1),
        reserved: results[i].getValue().getMember(2),
        accessRights: results[i].getValue().getMember(3),
        errorCode: errorCodes[i].getValue()
      };
      res.push([errorCodes[i], resObj]);
      if (errorCodes[i].getValue() != 0) {
        failed.push([errorCodes[i].getValue(), resObj.itemID])
      }
    }
    debug("A total of " + res.length + " were successfully validated.");
    if (failed.length > 0) {
      debug("The following items were not added: ");
      for (let i = 0; i < failed.length; i++)
        debug("Item: " + failed[i][0] + " ErrorCode: " + failed[i][1]);
    }
    return res;
  }

  /**
   * 
   * @param {Array<number>} items array of server handles
   * @returns {Promise<Array<object>>}
   * @opNum 2
   */
  async remove(items) {
    debug("Removing " + items.length + "items: ");
    for (let i = 0; i < items.length; i++) 
      debug(String(items[i]));
    if (!this._comObj) throw new Error("Not initialized");

    if (!(items.length > 0)) return [];

    let temporary = new Array();
    for (let i = 0; i < items.length; i++) {
      temporary.push(new ComValue(items[i], Types.INTEGER));
    }

    let itemArray = new ComArray(new ComValue(temporary, Types.INTEGER), true);

    let callObject = new CallBuilder(true);
    callObject.setOpnum(2);

    callObject.addInParamAsInt(items.length, Flags.FLAG_NULL);
    callObject.addInParamAsArray(itemArray, Flags.FLAG_NULL);
    let errCodesArray = new ComArray(new ComValue(null, Types.INTEGER), null, 1, true)
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(errCodesArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);

    let resultObj = await this._comObj.call(callObject);

    let hresult = resultObj.hresult;
    let result = resultObj.getResults();
    if (hresult != 0) {
        if (result.lenght == 0)
            throw new Error(String(hresult));
        else 
            debug(new Error(String(hresult)));
    }
    debug("Items successfully removed.");
    return result[0].getValue().getReferent().getArrayInstance();
  }

  /**
   * 
   * @param {boolean} state 
   * @param {Array<number>} items
   * @returns {Promise<Array<number>>}
   * @opNum 3
   */
  async setActiveState(state, items) {
    debug("Changing the active state of " + items.length + "items: ");
    for (let i = 0; i < items.length; i++) 
      debug(String(items[i]), state[i]);

    if (!this._comObj) throw new Error("Not initialized");

    if (!(items.length > 0)) return [];

    let temporary = new Array();
    for (let i = 0; i < items.length; i++)
      temporary.push(new ComValue(items[i], Types.INTEGER));

    let itemArray = new ComArray(new ComValue(temporary, Types.INTEGER), true);

    let callObject = new CallBuilder(true);
    callObject.setOpnum(3);

    callObject.addInParamAsInt(items.length, Flags.FLAG_NULL);
    callObject.addInParamAsArray(itemArray, Flags.FLAG_NULL);
    callObject.addInParamAsInt(state ? 1 : 0, Flags.FLAG_NULL);
    let errCodesArray = new ComArray(new ComValue(null, Types.INTEGER), null, 1, true)
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(errCodesArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);

    let resultObj = await this._comObj.call(callObject);

    let hresult = resultObj.hresult;
    let result = resultObj.getResults();
    if (hresult != 0) {
        if (result.lenght == 0)
            throw new Error(String(hresult));
        else 
            debugg(new Error(String(hresult)));
    }

    let errorCodes = result[0].getValue().getReferent().getArrayInstance();
    let results = new Array();
    let failed = new Array();
    for (let i = 0; i < items.length; i++) {
        results.push({value: items[i], errorCode: errorCodes[i]});
        if (errorCodes[i].getValue() != 0) {
          failed.push([errorCodes[i].getValue(), items[i]]);
        }
    }

    debug("A total of " + (results.length - failed.length) + " had their active status setted to " + state + ".");
    if (failed.length > 0) {
      debug("The following items were not added: ");
      for (let i = 0; i < failed.length; i++)
        debug("Item: " + failed[i][0] + " ErrorCode: " + failed[i][1]);
    }
    return results;
  }

  /**
   * 
   * @param {Array<number>} items array of server handles
   * @param {Array<number>} handles array of client handles
   * @returns {Promise<Array<number>>}
   * @opNum 4
   */
  async setClientHandles(items, handles) {
    debug("Setting the handle of " + items.length + "items: ");
    for (let i = 0; i < items.length; i++) 
      debug(String(items[i]), handles[i]);

    if (!this._comObj) throw new Error("Not initialized");

    if (items.length !== handles.length) throw new Error("Array sizes must be the same");

    if (!(items.length > 0)) return [];

    let temporaryItems = new Array();
    for (let i = 0; i < items.length; i++)
      temporaryItems.push(new ComValue(items[i], Types.INTEGER));

    let temporaryHandles = new Array();
    for (let i = 0; i < handles.length; i++)
    temporaryHandles.push(new ComValue(handles[i], Types.INTEGER));

    let itemArray = new ComArray(new ComValue(temporaryItems, Types.INTEGER), true);
    let handlesArray = new ComArray(new ComValue(temporaryHandles, Types.INTEGER), true);

    let callObject = new CallBuilder(true);
    callObject.setOpnum(4);

    callObject.addInParamAsInt(items.length, Flags.FLAG_NULL);
    callObject.addInParamAsArray(itemArray, Flags.FLAG_NULL);
    callObject.addInParamAsArray(handlesArray, Flags.FLAG_NULL);
    let errCodesArray = new ComArray(new ComValue(null, Types.INTEGER), null, 1, true)
    callObject.addOutParamAsObject(new ComValue(new Pointer(new ComValue(errCodesArray, Types.COMARRAY)), Types.POINTER), Flags.FLAG_NULL);

    let resultObj = await this._comObj.call(callObject);

    let hresult = resultObj.hresult;
    let result = resultObj.getResults();
    if (hresult != 0) {
        if (result.lenght == 0)
            throw new Error(String(hresult));
        else 
            debug(new Error(String(hresult)));
    }

    debug("Clients handles setted.");
    return result[0].getValue().getReferent().getArrayInstance();
  }
}

module.exports = OPCItemManager;