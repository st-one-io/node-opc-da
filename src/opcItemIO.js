//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

/**
 * Represents an OPC Item I/O object
 */
class OPCItemIO {

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

    this._comObj = await unknown.queryInterface(constants.iid.IOPCItemIO_IID);
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
   * @param {number} items[].maxAge
   * @returns {Promise<?>}
   * @opNum 0
   */
  async read(items) {
    if (!this._comObj) throw new Error("Not initialized");
  }

  /**
   *
   * @param {object[]} items ????
   * @returns {Promise<?>}
   * @opNum 1
   */
  async writeVQT(items) {
    if (!this._comObj) throw new Error("Not initialized");
  }
}

module.exports = OPCItemIO;