//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

/**
 * Represents an OPC Sync IO Object
 */
class OPCAsyncIO {

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

    this._comObj = await unknown.queryInterface(constants.iid.IOPCAsyncIO2_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
  }

  /**
   * 
   * @param {number[]} handles array of server handles
   * @returns {Promise<object>}
   * @opNum 0
   */
  async read(handles) {
    if (!this._comObj) throw new Error("Not initialized");

    //should return auto generated transaction id and cancel id
  }

  /** ??? */
  async write() {
    if (!this._comObj) throw new Error("Not initialized");

    throw new Error("Not Implemented");
  }

  /**
   * 
   * @param {number} transactionID 
   * @param {number} source
   * @returns {Promise<number>}
   * @opNum 2
   */
  async refresh(transactionID, source) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  /**
   * 
   * @param {number} cancelID
   * @returns {Promise<void>}
   * @opNum 3
   */
  async cancel(cancelID) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  /**
   * 
   * @param {boolean} state
   * @returns {Promise<void>}
   * @opNum 4
   */
  async setEnable(state) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  /**
   *
   * @returns {Promise<boolean>}
   * @opNum 5
   */
  async getEnable() {
    if (!this._comObj) throw new Error("Not initialized");

  }

}

module.exports = OPCAsyncIO;