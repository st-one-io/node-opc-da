//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

/**
 * Represents an OPC Server
 */
class OPCCommon {

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

    this._comObj = await unknown.queryInterface(constants.iid.IOPCCommon_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
  }

  /**
   * 
   * @param {number} localeId 
   * @opNum 0
   */
  async setLocaleID(localeId) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  /**
   * @returns the current localeID
   * @opNum 1
   */
  async getLocaleID() {
    if (!this._comObj) throw new Error("Not initialized");
  }

  /**
   * @returns the available localeIDs
   * @opNum 2
   */
  async queryAvailableLocaleIDs() {
    if (!this._comObj) throw new Error("Not initialized");
  }

  /**
   * 
   * @param {number} error 
   * @param {number} [localeID]
   * @returns a descriptive error string for the error code
   * @opNum 3
   */
  async getErrorString(error, localeID) {
    if (!this._comObj) throw new Error("Not initialized");
  }

  /**
   * 
   * @param {string} name the client name
   * @opNum 4
   */
  async setClientName(name) {
    if (!this._comObj) throw new Error("Not initialized");
  }
}

module.exports = OPCCommon;