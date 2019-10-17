//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');
const dcom = require('node-dcom');
const util = require('util');
const debug = util.debuglog('node-opc-da');

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
        debug("Initing EnumString...");
        if (this._comObj) throw new Error("Already initialized");

        this._comObj = await unknown.queryInterface(constants.iid.IEnumString_IID);
        debug("EnumString successfully inited.");
    }

    async end(hresult) {
        debug("Destroying EnumString...");
        if (!this._comObj) return;

        let obj = this._comObj;
        debug(String(new Error(String(hresult))));
        this._comObj = null;
        await obj.release();
        debug("EnumString successfully destroyed.");
    }

    /**
     * 
     * @param {number} num
     * @returns {Promise<string[]>}
     * @opNum 0
     */
    async next(num) {
        debug("Querying the server for a batch of  " + num + " items...");
        if (!this._comObj) throw new Error("Not initialized");

        if (num <= 0) return [];

        let callObject = new dcom.CallBuilder(true);
        callObject.setOpnum(0);

        let strValue = new dcom.ComValue(new dcom.ComString(dcom.Flags.FLAG_REPRESENTATION_STRING_LPWSTR), dcom.Types.COMSTRING);
        let strArrayValue = new dcom.ComValue(new dcom.ComArray(strValue, null, 1, true, true), dcom.Types.COMARRAY);
        callObject.addInParamAsInt(num, dcom.Flags.FLAG_NULL);
        callObject.addOutParamAsObject(strArrayValue, dcom.Flags.FLAG_NULL);
        callObject.addOutParamAsType(dcom.Types.INTEGER, dcom.Flags.FLAG_NULL);

        let resultObj = await this._comObj.call(callObject);

        let hresult = resultObj.hresult;
        let result = resultObj.getResults();
        if (hresult != 0) {
            if (result.lenght == 0)
                throw new Error(String(hresult));
            else 
                debug("No more items.");
        }

        let resultData;
        if (result instanceof dcom.ComValue)
            resultData = result[0].getValue().getArrayInstance();
        else 
            resultData = result[0].getValue().getArrayInstance();
        let count = result[1].getValue();

        let res = [];
        for (let i = 0; i < count; i++) {
            res.push(resultData[i].getValue().getString());
        }
        debug("Items successfullly obtained.");
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

        await this._comObj.call(callObject)
         .catch(function(reject) {
            throw reject;
          });
    }

    /**
     * 
     * @returns {Promise<>}
     * @opnum 2
     */
    async reset() {
        debug("Reseting EnumString...");
        if (!this._comObj) throw new Error("Not initialized");

        let callObject = new dcom.CallBuilder(true);
        callObject.setOpnum(2);

        await this._comObj.call(callObject)
            .catch(function(reject) {
                throw reject;
            });
        debug("EnumString successfully reseted.");
    }

    // ------

    /**
     * @returns {Promise<string[]>}
     */
    async asArray(){
        debug("Creating an Array for the current EnumString...");
        await this.reset();
        let part, res = [];
        do {
            part = await this.next(this._batchSize)
                .catch(function(reject) {
                    throw reject;
                });
            res.push(...part);
        } while (part.length == this._batchSize);

        debug("Array of EnumString itens sucessfully created.");
        return res;
    }
}

module.exports = EnumString;
