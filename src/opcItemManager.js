//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

const { CallBuilder, ComArray, ComString, ComValue, Flags, Pointer, Struct, Variant, Types } = require('dcom');

/**
 * 
 * @param {object} item //TODO can be also a string
 * @param {string} item.itemID
 * @param {number} item.clientHandle
 * @param {string} [item.accessPath]
 * @param {boolean} [item.active]
 * @param {number} [item.requestedDataType]
 * @param {number} [item.reserved]
 * @returns {Struct}
 */
function getItemDefStruct(item) {

  let itemID, clientHandle, accessPath, active, requestedDataType, reserved;
  if (typeof item === 'string') {
    itemID = item;
    clientHandle = Math.random() * 0xffffffff;
    accessPath = '';
    active = true;
    requestedDataType = 0; //VT_EMPTY
    reserved = 0;
  } else {
    if (item.itemID === null || item.itemID === undefined) {
      throw new Error("Missing required itemID")
    }
    itemID = item.itemID;
    clientHandle = item.clientHandle || Math.random() * 0xffffffff;
    accessPath = item.accessPath || '';
    active = item.active !== undefined ? item.active : true;
    requestedDataType = item.requestedDataType || 0;
    reserved = item.reserved || 0;
  }

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
   * @returns {Promise<?>}
   */
  async init(unknown) {
    if (this._comObj) throw new Error("Already initialized");

    this._comObj = await unknown.queryInterface(constants.iid.IOPCItemMgt_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
  }

  /**
   * 
   * @param {object[]} items 
   * @param {string} items[].itemID
   * @param {number} items[].clientHandle
   * @param {string} [items[].accessPath]
   * @param {boolean} [items[].active]
   * @param {number} [items[].requestedDataType]
   * @param {number} [items[].reserved]
   * @returns {Promise<Array<object>>}
   * @opNum 0
   */
  async add(items) {
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

    let result = await this._comObj.call(callObject);

    let results = result[0].getValue().getReferent().getArrayInstance();
    let errorCodes = result[1].getValue().getReferent().getArrayInstance();

    let res = [];
    for (let i = 0; i < items.length; i++) {
      let resObj = {
        itemID: items[i].itemID,
        serverHandle: results[i].getValue().getMember(0),
        cannonicalDataType: results[i].getValue().getMember(1),
        reserved: results[i].getValue().getMember(2),
        accessRights: results[i].getValue().getMember(3)
      };
      res.push([errorCodes[i], resObj]);
    }

    return res;
  }

  /**
   * 
   * @param {Array<string|object>} items
   * @returns {Promise<Array<object>>}
   * @opNum 1
   */
  async validate(items) {
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

    let result = await this._comObj.call(callObject);

    let results = result[0].getValue().getReferent().getArrayInstance();
    let errorCodes = result[1].getValue().getReferent().getArrayInstance();

    let res = [];
    for (let i = 0; i < items.length; i++) {
      let resObj = {
        itemID: items[i].itemID,
        serverHandle: results[i].getValue().getMember(0),
        cannonicalDataType: results[i].getValue().getMember(1),
        reserved: results[i].getValue().getMember(2),
        accessRights: results[i].getValue().getMember(3)
      };
      res.push([errorCodes[i], resObj]);
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

    let result = await this._comObj.call(callObject);

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

    let result = await this._comObj.call(callObject);

    let errorCodes = result[0].getValue().getReferent().getArrayInstance();
    let results = new Array();
    for (let i = 0; i < items.length; i++) {
        results.push({value: items[i], errorCode: errorCodes[i]});
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

    let result = await this._comObj.call(callObject);

    return result[0].getValue().getReferent().getArrayInstance();
  }
}

module.exports = OPCItemManager;