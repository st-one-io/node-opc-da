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

const { CallBuilder, ComString, ComValue, Flags, Pointer, types} = require('dcom');

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
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(0);

    let namePtr = new Pointer(new ComValue(new ComString(Flags.FLAG_REPRESENTATION_STRING_LPWSTR), types.COMSTRING));

    callObject.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.BOOLEAN, Flags.FLAG_NULL);
    callObject.addOutParamAsObject(new ComValue(namePtr, types.POINTER), Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.FLOAT, Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);

    let result = await this._comObj.call(callObject);

    return {
      updateRate: result[0],
      active: result[1],
      name: result[2].getReferent().getString(),
      timeBias: result[3],
      deadband: result[4],
      localeID: result[5],
      clientHandle: result[6],
      serverHandle: result[7]
    }
  }

  /**
   * 
   * @param {number} updateRate 
   * @param {boolean} active 
   * @param {number} timeBias 
   * @param {number} deadband 
   * @param {number} localeID 
   * @param {number} clientHandle
   * @returns {Promise<number>} the granted update rate
   * @opNum 1
   */
  async setState(updateRate, active, timeBias, deadband, localeID, clientHandle) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(1);

    let activeCV = active === null ? null : new ComValue(active ? 1 : 0, types.INTEGER);

    callObject.addInParamAsPointer(new Pointer(new ComValue(updateRate, types.INTEGER)), Flags.FLAG_NULL);
    callObject.addInParamAsPointer(new Pointer(activeCV), Flags.FLAG_NULL);
    callObject.addInParamAsPointer(new Pointer(new ComValue(timeBias, types.INTEGER)), Flags.FLAG_NULL);
    callObject.addInParamAsPointer(new Pointer(new ComValue(deadband, types.FLOAT)), Flags.FLAG_NULL);
    callObject.addInParamAsPointer(new Pointer(new ComValue(localeID, types.INTEGER)), Flags.FLAG_NULL);
    callObject.addInParamAsPointer(new Pointer(new ComValue(clientHandle, types.INTEGER)), Flags.FLAG_NULL);

    callObject.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);

    let result = await this._comObj.call(callObject);

    return result[0];
  }

  /**
   * 
   * @param {string} name
   * @returns {Promise<void>}
   * @opNum 2
   */
  async setName(name) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(2);
    
    callObject.addInParamAsString(name, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);

    await this._comObj.call(callObject);
  }

  /**
   * 
   * @param {string} name
   * @returns {Promise<OPCGroupStateManager>}
   * @opNum 3
   */
  async clone(name) {
    if (!this._comObj) throw new Error("Not initialized");

    let callObject = new CallBuilder(true);
    callObject.setOpnum(3);

    callObject.addInParamAsString(name, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);
    callObject.addInParamAsUUID(constants.iid.IOPCGroupStateMgt_IID, Flags.FLAG_NULL);
    callObject.addOutParamAsType(types.COMOBJECT, Flags.FLAG_NULL);

    let result = await this._comObj.call(callObject);

    let group = new OPCGroupStateManager();
    await group.init(result[0]);

    return group;
  }

  /**
   * enables receiving events to this group
   * 
   * @returns {Promise<void>}
   */
  async atach() {
    throw new Error("Not yet supported");
  }

  /**
   * @returns {Promise<OPCItemManager>}
   */
  async getItemManager() {
    if (!this._comObj) throw new Error("Not initialized");

    if (!this._opcItemManager) {
      let opcItemManager = new OPCItemManager();
      await this._opcItemManager.init(this._comObj);
      this._opcItemManager = opcItemManager;
    }
    return this._opcItemManager;
  }

  /**
   * @returns {Promise<OPCSyncIO>}
   */
  async getSyncIO() {
    if (!this._comObj) throw new Error("Not initialized");

    if (!this._syncIO) {
      let syncIO = new OPCSyncIO();
      await this._syncIO.init(this._comObj);
      this._syncIO = syncIO;
    }
    return this._syncIO;
  }

  /**
   * @returns {Promise<OPCAsyncIO>}
   */
  async getAsyncIO2() {
    if (!this._comObj) throw new Error("Not initialized");

    if (!this._asyncIO) {
      let asyncIO = new OPCAsyncIO();
      await this._asyncIO.init(this._comObj);
      this._asyncIO = asyncIO;
    }
    return this._asyncIO;
  }

}

module.exports = OPCGroupStateManager;