//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

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
   * @param {Array<string|object>} items 
   * @returns {Promise<Array<object>>}
   * @opNum 0
   */
  async add(items) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  /**
   * 
   * @param {Array<string|object>} items
   * @returns {Promise<Array<object>>}
   * @opNum 1
   */
  async validate(items) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  /**
   * 
   * @param {Array<number>} items array of server handles
   * @returns {Promise<Array<object>>}
   * @opNum 2
   */
  async remove(items) {
    if (!this._comObj) throw new Error("Not initialized");

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

  }
}

module.exports = OPCItemManager;