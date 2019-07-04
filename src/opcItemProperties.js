//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

/**
 * Represents an OPC Item I/O object
 */
class OPCItemProperties {

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

    this._comObj = await unknown.queryInterface(constants.iid.IOPCItemProperties_IID);
  }

  async end() {
    if (!this._comObj) return;

    let obj = this._comObj;
    this._comObj = null;
    await obj.release();
  }

  /**
   * 
   * @param {string} itemID 
   * @returns {Promise<Array<object>>} the item's properties
   * @opNum 0
   */
  async queryAvailableProperties(itemID) {
    if (!this._comObj) throw new Error("Not initialized");

    //should return array of {id, description, varType}
  }

  /**
   * 
   * @param {string} itemID 
   * @param {number[]} props
   * @returns {Promise<Array<object>>}
   * @opNum 1
   */
  async getItemProperties(itemID, props) {
    if (!this._comObj) throw new Error("Not initialized");

    // should return array of {id, value, errorCode}
  }

  /**
   * 
   * @param {string} itemID 
   * @param {number[]} props
   * @returns {Promise<object>}
   * @opNum 2
   */
  async lookupItemIDs(itemID, props) {
    if (!this._comObj) throw new Error("Not initialized");

  }

  // --------

  /**
   * 
   * @param {string} itemID 
   * @returns {Promise<Array<object>}
   */
  async getAllItemProperties(itemID){
    let props = await this.queryAvailableProperties(itemID);
    let propIDs = props.map(elm => elm.id)
    let propVals = await this.getItemProperties(itemID, propIDs);
    let result = [];

    for(let i = 0; i < propIDs.length; i++){
      result.push({
        id: props[i].id,
        description: props[i].description,
        varType: props[i].varType,
        value: propVals[i].value,
        errorCode: propVals[i].errorCode
      });
    }

    return result;
  }

}

module.exports = OPCItemProperties;