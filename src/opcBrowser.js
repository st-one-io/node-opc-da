//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

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

  }

  /**
   * 
   * @param {number} type 
   * @param {string} [filter=""]
   * @param {number} [dataType=0]
   * @param {number} [accessRights=0]
   * @returns {Promise<Array<string>>}
   * @opNum 2
   */
  async browse(type, filter, accessRights, dataType) {
    if (!this._comObj) throw new Error("Not initialized");

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

  }

  /**
   * Returns the possible access paths for an item
   * 
   * @param {string} itemID the item to query
   * @returns {Promise<Array<string>>} the complete item ID
   * @opNum 4
   */
  async browseAccessPaths(itemID) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  // -------

  /**
   * @returns {Promise<Array<string>>} an array with all items in a flat address space
   */
  async browseAllFlat() {
    await this.changePosition(null, constants.opc.browse.direction.TO);
    return await this.browse(constants.opc.browse.type.FLAT);
  }

  /**
   * @returns {Promise<object>} an object representing the hierarchy of items
   */
  async browseAllTree() {

    async function browseLevel() {
      let res = {}

      // get items on this level
      let items = await this.browse(constants.opc.browse.type.LEAF);
      for (const item of items) {
        res[item] = await this.getItemID(item);
      }
      let branches = await this.browse(constants.opc.browse.type.BRANCH);
      for (const branch of branches) {
        await this.changePosition(branch, constants.opc.browse.direction.DOWN);
        res[branch] = browseLevel();
        await this.changePosition(null, constants.opc.browse.direction.UP);
      }

      return res;
    }

    await this.changePosition(null, constants.opc.browse.direction.TO);
    return await browseLevel();
  }

}

module.exports = OPCBrowser;