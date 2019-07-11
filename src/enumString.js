//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');

const dcom = require('dcom');

/**
 * Represents an EnumString
 */
class EnumString {

    /**
     * 
     * @param {number} [batchSize=10]
     */
    constructor(batchSize){
        this._batchSize = batchSize || 10;

        this._comObj = null;
    }

    /**
     *
     * @param {*} unknown
     * @returns {Promise<?>}
     */
    async init(unknown) {
        if (this._comObj) throw new Error("Already initialized");

        this._comObj = await unknown.queryInterface(constants.iid.IEnumString_IID);
    }

    async end() {
        if (!this._comObj) return;

        let obj = this._comObj;
        this._comObj = null;
        await obj.release();
    }

    /**
     * 
     * @param {number} num
     * @returns {Promise<string[]>}
     * @opNum 0
     */
    async next(num) {
        if (!this._comObj) throw new Error("Not initialized");

        if (num <= 0) return [];

        let callObject = new dcom.CallBuilder(true);
        callObject.setOpnum(0);

        callObject.addInParamAsInt(num, dcom.Flags.FLAG_NULL);
        callObject.addOutParamAsObject(new dcom.ComArray(new dcom.ComString(dcom.Flags.FLAG_REPRESENTATION_STRING_LPWSTR), null, 1, true, true), dcom.Flags.FLAG_NULL);
        callObject.addOutParamAsType("Integer", dcom.Flags.FLAG_NULL);

        let result = await this._comObj.call(callObject);
        let resultData = result[0].getArrayInstance();
        let count = result[1];

        let res = [];
        for (let i = 0; i < count; i++) {
            res.push(resultData[i].getString());
        }
        return res;
    }

    /**
     * 
     * @param {number} num 
     * @returns {Promise<>}
     * @opnum 1
     */
    async skip(num) {
        if (!this._comObj) throw new Error("Not initialized");

        if (num <= 0) return [];

        let callObject = new dcom.CallBuilder(true);
        callObject.setOpnum(1);

        callObject.addInParamAsInt(num, dcom.Flags.FLAG_NULL);

        await this._comObj.call(callObject);
    }

    /**
     * 
     * @returns {Promise<>}
     * @opnum 2
     */
    async reset() {
        if (!this._comObj) throw new Error("Not initialized");

        let callObject = new dcom.CallBuilder(true);
        callObject.setOpnum(1);

        await this._comObj.call(callObject);
    }

    // ------

    /**
     * @returns {Promise<string[]>}
     */
    async asArray(){
        await this.reset();
        let part, res = [];
        do {
            part = await this.next(this._batchSize);
            res.push(...part);
        } while (part.length == this._batchSize);

        return res;
    }
}

module.exports = EnumString;