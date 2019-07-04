//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

/**
 * Represents an OPC Sync IO Object
 */
class OPCSyncIO {

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

    this._comObj = await unknown.queryInterface(constants.iid.IOPCSyncIO_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
  }

  /**
   * 
   * @param {number} source 
   * @param {number[]} hanldes an array of server handles
   * @returns {Promise<object[]>}
   * @opNum 0
   */
  async read(source, hanldes) {
    if (!this._comObj) throw new Error("Not initialized");

    //should return an array of {clientHandle, timestamp, quality, value}
  }

  /**
   * 
   * @param {object[]} writes 
   * @param {number} writes[].handle
   * @param {*} writes[].value
   * @returns {Promise<number[]>} error codes
   * @opNum 1
   */
  async write(writes) {
    if (!this._comObj) throw new Error("Not initialized");

  }

}

module.exports = OPCSyncIO;