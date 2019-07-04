//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');
const OPCCommon = require('./opcCommon.js');
const OPCBrowser = require('./opcBrowser.js');
const OPCItemIO = require('./opcItemIO.js');
const OPCItemProperties = require('./opcItemProperties');

/**
 * Represents an OPC Server
 */
class OPCServer {

    constructor() {
        //TODO - default values for addGroup

        this._comObj = null;
        this._opcCommon = null;
        this._opcBrowser = null;
        this._opcItemIO = null;
        this._opcItemProperties = null;
    }

    /**
     *
     * @param {*} unknown
     * @returns {Promise<?>}
     */
    async init(unknown) {
        if (this._comObj) throw new Error("Already initialized");

        this._comObj = await unknown.queryInterface(constants.iid.IOPCServer_IID);
    }

    async end() {
        if (!this._comObj) return;

        let obj = this._comObj;
        let opcCommon = this._opcCommon;
        let opcBrowser = this._opcBrowser;
        let opcItemIO = this._opcItemIO;
        let opcItemProperties = this._opcItemProperties;
        this._comObj = null;
        this._opcCommon = null;
        this._opcBrowser = null;
        this._opcItemIO = null;
        this._opcItemProperties = null;

        //TODO maybe paralelize this with Promise.all
        if (opcCommon) await opcCommon.end();
        if (opcBrowser) await opcCommon.end();
        if (opcItemIO) await opcCommon.end();
        if (opcItemProperties) await opcCommon.end();
        await obj.release();
    }

    /**
     * 
     * @param {String} name the group name
     * @param {object} [opts]
     * @param {boolean} [opts.active=true]
     * @param {number} [opts.updateRate]
     * @param {number} [opts.clientHandle]
     * @param {number} [opts.timeBias]
     * @param {number} [opts.deadband]
     * @param {number} [opts.localeID]
     * @returns {Promise<?>}
     * @opNum 0
     */
    async addGroup(name, opts) {
        if (!this._comObj) throw new Error("Not initialized");

    }

    /**
     * 
     * @param {number} error 
     * @param {number} [localeID]
     * @returns {Promise<?>} a descriptive string for the error code
     * @opNum 1
     */
    async getErrorString(error, localeID) {
        if (!this._comObj) throw new Error("Not initialized");

    }

    /**
     * 
     * @param {string} name
     * @returns {Promise<?>}
     * @opNum 2
     */
    async getGroupByName(name) {
        if (!this._comObj) throw new Error("Not initialized");

    }

    /**
     * @returns {Promise<?>} the server status
     * @opNum 3
     */
    async getStatus() {
        if (!this._comObj) throw new Error("Not initialized");

    }

    /**
     * 
     * @param {*} handle 
     * @param {boolean} [force=false]
     * @returns {Promise<?>}
     * @opNum 4
     */
    async removeGroup(handle, force) {
        if (!this._comObj) throw new Error("Not initialized");

    }

    /**
     * 
     * @param {number} scope
     * @returns {Promise<?>}
     * @opNum 5
     */
    async getGroups(scope) {
        if (!this._comObj) throw new Error("Not initialized");

    }

    // ------

    /**
     * @returns {Promise<OPCCommon>} an OPCCommon instance of this server
     */
    async getCommon() {
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcCommon) {
            let opcCommon = new OPCCommon(); //TODO pass comObj handle
            await this._opcCommon.init();
            this._opcCommon = opcCommon;
        }
        return this._opcCommon;
    }

    /**
     * @returns {Promise<OPCBrowser>} an OPCBrowser insance of this server
     */
    async getBrowser() {
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcBrowser) {
            let opcBrowser = new OPCBrowser(); //TODO pass comObj handle
            await this._opcBrowser.init();
            this._opcBrowser = opcBrowser;
        }
        return this._opcBrowser;
    }

    /**
     * @returns {Promise<OPCItemIO>} an OPCBrowser insance of this server
     */
    async getItemIO() {
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcItemIO) {
            let opcItemIO = new OPCItemIO(); //TODO pass comObj handle
            await this._opcItemIO.init();
            this._opcItemIO = opcItemIO;
        }
        return this._opcItemIO;
    }

    /**
     * @returns {Promise<OPCItemProperties>} an OPCBrowser insance of this server
     */
    async getItemProperties() {
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcItemProperties) {
            let opcItemProperties = new OPCItemProperties(); //TODO pass comObj handle
            await this._opcItemProperties.init();
            this._opcItemProperties = opcItemProperties;
        }
        return this._opcItemProperties;
    }

}

module.exports = OPCServer;