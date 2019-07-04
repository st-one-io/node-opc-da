//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');
const OPCItemManager = require('./opcItemManager.js');
const OPCSyncIO = require('./opcSyncIO.js');
const OPCAsyncIO = require('./opcAsyncIO.js');
const { EventEmitter } = require('events');

/**
 * Represents an OPC Server
 * @emits data
 */
class OPCGroupStateManager extends EventEmitter {

  constructor() {
    super();

    this._opcItemManager = null;
    this._syncIO = null;
    this._asyncIO = null;
  }

  /**
   *
   * @param {*} unknown
   * @returns {Promise<?>}
   */
  async init(unknown) {
    if (this._comObj) throw new Error("Already initialized");

    this._comObj = await unknown.queryInterface(constants.iid.IOPCGroupStateMgt_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    let opcItemManager = this._opcItemManager;
    let syncIO = this._syncIO;
    let asyncIO = this._asyncIO;
    this._comObj = null;
    this._opcItemManager = null;
    this._syncIO = null;
    this._asyncIO = null;

    //TODO maybe paralelize this with Promise.all
    if (opcItemManager) await opcItemManager.end();
    if (syncIO) await syncIO.end();
    if (asyncIO) await asyncIO.end();
    await obj.release();
  }

  /**
   * @returns {Promise<object>}
   * @opNum 0
   */
  async getState() {

  }

  /**
   * 
   * @param {number} updateRate 
   * @param {boolean} active 
   * @param {number} timeBias 
   * @param {number} deadband 
   * @param {number} localeID 
   * @param {number} clientHandle
   * @returns {Promise<number>}
   * @opNum 1
   */
  async setState(updateRate, active, timeBias, deadband, localeID, clientHandle) {

  }

  /**
   * 
   * @param {string} name
   * @returns {Promise<void>}
   * @opNum 2
   */
  async setName(name) {

  }

  /**
   * 
   * @param {string} name
   * @returns {Promise<OPCGroupStateManager>}
   * @opNum 3
   */
  async clone(name) {

  }

  /**
   * enables receiving events to this group
   * 
   * @returns {Promise<void>}
   */
  async atach() {

  }

  /**
   * @returns {Promise<OPCItemManager>}
   */
  async getItemManager() {
    if (!this._opcItemManager) {
      let opcItemManager = new OPCItemManager(); //TODO pass comObj handle
      await this._opcItemManager.init();
      this._opcItemManager = opcItemManager;
    }
    return this._opcItemManager;
  }

  /**
   * @returns {Promise<OPCSyncIO>}
   */
  async getSyncIO() {
    if (!this._syncIO) {
      let syncIO = new OPCSyncIO(); //TODO pass comObj handle
      await this._syncIO.init();
      this._syncIO = syncIO;
    }
    return this._syncIO;
  }

  /**
   * @returns {Promise<OPCAsyncIO>}
   */
  async getAsyncIO2() {
    if (!this._asyncIO) {
      let asyncIO = new OPCAsyncIO(); //TODO pass comObj handle
      await this._asyncIO.init();
      this._asyncIO = asyncIO;
    }
    return this._asyncIO;
  }

}

module.exports = OPCGroupStateManager;