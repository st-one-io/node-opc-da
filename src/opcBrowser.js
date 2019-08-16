//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');
const {CallBuilder, ComString, ComValue, Types, Pointer, Flags} = require('dcom');
const EnumString = require('./enumString');

/**
 * Represents an OPC Browser
 */
class OPCBrowser {

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

    this._comObj = await unknown.queryInterface(constants.iid.IOPCBrowseServerAddressSpace_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
  }

  /**
   *
   * @returns {Promise<number>}
   * @opNum 0
   */
  async queryOrganization() {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(0);

    callObject.addOutParamAsType(Types.SHORT, Flags.FLAG_NULL);

    let result = await this._comObj.call(callObject);
    return result[0];
  }

  /**
   * 
   * @param {string} position 
   * @param {number} direction
   * @returns {Promise<void>}
   * @opNum 1
   */
  async changePosition(position, direction) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(1);

    callObject.addInParamAsShort(direction, Flags.FLAG_NULL);
    callObject.addInParamAsString(position, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);

    await this._comObj.call(callObject);
  }

  /**
   * 
   * @param {number} type 
   * @param {string} [filter=""]
   * @param {number} [dataType=0]
   * @param {number} [accessRights=0]
   * @returns {Promise<EnumString>}
   * @opNum 2
   */
  async browse(type, filter, accessRights, dataType) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(2);

    callObject.addInParamAsShort(type, Flags.FLAG_NULL);
    callObject.addInParamAsString(filter, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);
    callObject.addInParamAsShort(dataType, Flags.FLAG_NULL);
    callObject.addInParamAsInt(accessRights, Flags.FLAG_NULL);
    callObject.addOutParamAsType(Types.COMOBJECT, Flags.FLAG_NULL);

    let result = await this._comObj.call(callObject);

    let enumResults = new EnumString();
    await enumResults.init(result[0].getValue());
    return enumResults;
  }

  /**
   * Gets the complete item id from an item at the local position.
   *
   * Browsing a hierarchical namespace the browse method will return items based on the
   * local level in the namespace. So actually only the last part of the item ID hierarchy
   * is returned. In order to convert this to the full item ID one can use this method. It
   * will only work if the browser is still at the position in question.
   * 
   * @param {string} item the local item
   * @returns {Promise<string>} the complete item ID
   * @opNum 3
   */
  async getItemID(item) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(3);

    let strValue = new ComValue(new ComString(Flags.FLAG_REPRESENTATION_STRING_LPWSTR), Types.COMSTRING);
    let strPointerValue = new ComValue(new Pointer(strValue), Types.POINTER);
    callObject.addInParamAsString(item, Flags.FLAG_REPRESENTATION_STRING_LPWSTR );
    callObject.addOutParamAsObject(strPointerValue, Flags.FLAG_NULL);

    let result = await this._comObj.call(callObject);

    let resultPtr = result[0].getValue();
    let resultPtrRef = resultPtr.getReferent();
    return resultPtrRef.getString();
  }

  /**
   * Returns the possible access paths for an item
   * 
   * @param {string} itemID the item to query
   * @returns {Promise<EnumString>} the complete item ID
   * @opNum 4
   */
  async browseAccessPaths(itemID) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(4);

    callObject.addInParamAsString(itemID, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);
    callObject.addOutParamAsType (Types.COMOBJECT, Flags.FLAG_NULL );

    let result = await this._comObj.call(callObject);

    let enumResults = new EnumString();
    await enumResults.init(result[0]);
    return enumResults;
  }

  // -------

  /**
   * @returns {Promise<Array<string>>} an array with all items in a flat address space
   */
  async browseAllFlat() {
    await this.changePosition(null, constants.opc.browse.direction.TO);
    let enumItems = await this.browse(constants.opc.browse.type.FLAT);
    return await enumItems.asArray();
  }

  /**
   * @returns {Promise<object>} an object representing the hierarchy of items
   */
  async browseAllTree() {
    await this.changePosition(null, constants.opc.browse.direction.TO);
    return await this.browseLevel();
  }

  /**
   * change the browsing level
   */
  async browseLevel() {
    let res = {}

    // get items on this level
    let enumItems = await this.browse(constants.opc.browse.type.LEAF);
    let items = await enumItems.asArray();
    for (const item of items) {
      res[item] = await this.getItemID(item);
    }
    let enumBranches = await this.browse(constants.opc.browse.type.BRANCH);
    let branches = await enumBranches.asArray();
    for (const branch of branches) {
      await this.changePosition(branch, constants.opc.browse.direction.DOWN);
      res[branch] = await this.browseLevel();
      await this.changePosition(null, constants.opc.browse.direction.UP);
    }

    return res;
  }
}

module.exports = OPCBrowser;
