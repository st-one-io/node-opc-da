//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants.js');
const EnumString = require('./enumString.js');
const OPCCommon = require('./opcCommon.js');
const OPCBrowser = require('./opcBrowser.js');
const OPCItemIO = require('./opcItemIO.js');
const OPCItemProperties = require('./opcItemProperties');
const OPCGroupStateManager = require('./opcGroupStateManager');
const filetime = require('./filetime');
const util = require('util');
const debug = util.debuglog('node-opca-da');
const events = require('events');
const { CallBuilder, ComString, ComValue, Flags, Pointer, Struct, Types } = require('node-dcom');

const groupCache = new WeakMap();

/**
 * @typedef {import('./opcGroupStateManager').GroupProperties} GroupProperties
 */

 /**
  * @typedef {object} GroupStatus
  * @property {Date} startTime
  * @property {Date} currentTime
  * @property {Date} lastUpdateTime
  * @property {number} serverState
  * @property {number} groupCount
  * @property {number} bandWidth
  * @property {number} majorVersion
  * @property {number} minorVersion
  * @property {number} buildNumber
  * @property {number} reserved
  * @property {string} vendorInfo
  */

/**
 * Represents an OPC Server
 */
class OPCServer extends events.EventEmitter {

    /**
     * 
     * @param {object} [opts]
     * @param {object} [opts.groupDefaults]
     * @param {boolean} [opts.groupDefaults.active=true]
     * @param {number} [opts.groupDefaults.updateRate=1000]
     * @param {number} [opts.groupDefaults.timeBias=60]
     * @param {number} [opts.groupDefaults.deadband=0]
     * @param {number} [opts.defaultLocale=1033]
     */
    constructor(opts) {
        debug("Creating OPCServer...");
        //TODO - default values for addGroup
        super();
        opts = opts || {};
        this._defaultLocale = opts.defaultLocale || 1033;

        let def = opts.groupDefaults || {};
        this._groupDef = {
            active: !!(def.active !== undefined ? def.active : true),
            updateRate: !isNaN(def.updateRate) ? def.updateRate : 1000,
            timeBias: !isNaN(def.timeBias) ? def.timeBias : 60,
            deadband: !isNaN(def.deadband) ? def.deadband : 0,
        }

        this._comObj = null;
        this._opcCommon = null;
        this._opcBrowser = null;
        this._opcItemIO = null;
        this._opcItemProperties = null;
    }

    /**
     *
     * @param {*} unknown
     * @returns {Promise<void>}
     */
    async init(unknown) {
        debug("Initing OPCServer...")
        if (this._comObj) throw new Error("Already initialized");

        if (!unknown) throw new Error("OPCServer init failed. No COM Server given.");

        this._comObj = await unknown.queryInterface(constants.iid.IOPCServer_IID);

        // now that we have the comObj, we can get the events emitted
        this._comObj.on('disconnected', function(){
            this.emit('disconnected');
        });
        debug("OPCServer inited successfully");
    }

    /**
     * @returns {Promise<void>}
     */
    async end() {
        debug("Ending OPCServer...")
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
        if (opcBrowser) await opcBrowser.end();
        if (opcItemIO) await opcItemIO.end();
        if (opcItemProperties) await opcItemProperties.end();
        await obj.release();
        debug("OPCServer successfully ended.");
    }

    /**
     * 
     * @param {String} name the group name
     * @param {GroupProperties} [opts]
     * @returns {Promise<?>}
     * @opNum 0
     */
    async addGroup(name, opts) {
        debug("Adding new group \"" + name + "\"...");
        if (!this._comObj) throw new Error("Not initialized");

        opts = opts || {
            active: this._groupDef.active,
            updateRate: this._groupDef.updateRate,
            clientHandle: Math.trunc(Math.random() * 0xFFFFFFFF),
            timeBias: this._groupDef.timeBias,
            deadband: this._groupDef.deadband,
            localeID: this._defaultLocale
        };

        let active = opts.active !== undefined ? opts.active : this._groupDef.active;
        let updateRate = !isNaN(opts.updateRate) ? opts.updateRate : this._groupDef.updateRate;
        let clientHandle = !isNaN(opts.clientHandle) ? opts.clientHandle : Math.trunc(Math.random() * 0xFFFFFFFF);
        let timeBias = !isNaN(opts.timeBias) ? opts.timeBias : this._groupDef.timeBias;
        let deadband = !isNaN(opts.deadband) ? opts.deadband : this._groupDef.deadband;
        let localeID = !isNaN(opts.localeID) ? opts.localeID : this._defaultLocale;

        let timeBiasCV = new ComValue(timeBias, Types.INTEGER);
        let deadbandCV = new ComValue(deadband, Types.FLOAT);

        let callObject = new CallBuilder(true);
        callObject.setOpnum(0);

        callObject.addInParamAsString(name, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);
        callObject.addInParamAsInt(active ? 1 : 0, Flags.FLAG_NULL);
        callObject.addInParamAsInt(updateRate, Flags.FLAG_NULL);
        callObject.addInParamAsInt(clientHandle, Flags.FLAG_NULL);
        callObject.addInParamAsPointer(new Pointer(timeBiasCV), Flags.FLAG_NULL);
        callObject.addInParamAsPointer(new Pointer(deadbandCV), Flags.FLAG_NULL);
        callObject.addInParamAsInt(localeID, Flags.FLAG_NULL);
        callObject.addOutParamAsType(Types.INTEGER, Flags.FLAG_NULL);
        callObject.addOutParamAsType(Types.INTEGER, Flags.FLAG_NULL);
        callObject.addInParamAsUUID(constants.iid.IOPCGroupStateMgt_IID, Flags.FLAG_NULL);
        callObject.addOutParamAsType(Types.COMOBJECT, Flags.FLAG_NULL);

        let resultObj = await this._comObj.call(callObject);

        let hresult = resultObj.hresult;
        let result = resultObj.getResults();
        if (hresult != 0) {
            if (result.lenght == 0)
                throw new Error(String(hresult));
            else {
                if (hresult == 0x0004000D) {
                    this.emit('opc_s_unsuportedrate');
                }
            }
        }

        let group = new OPCGroupStateManager();
        await group.init(result[2].getValue());
        groupCache.set(group, clientHandle);
        debug(name + " added successfully.");
        return group;
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

        let callObject = new CallBuilder(true);
        callObject.setOpnum(1);

        localeID = localeID || this._defaultLocale;

        let outString = new ComValue(new ComString(Flags.FLAG_REPRESENTATION_STRING_LPWSTR), Types.COMSTRING);

        callObject.addInParamAsInt(error, Flags.FLAG_NULL);
        callObject.addInParamAsInt(localeID, Flags.FLAG_NULL);
        callObject.addOutParamAsObject(outString, Flags.FLAG_NULL);
        //callObject.addOutParamAsObject(new Pointer(new ComString(Flags.FLAG_REPRESENTATION_STRING_LPWSTR)), Flags.FLAG_NULL);

        let resultObj = await this._comObj.call(callObject);

        let hresult = resultObj.hresult;
        let result = resultObj.getResults();
        if (hresult != 0) {
            if (result.lenght == 0)
                throw new Error(String(hresult));
            else 
                debug(new Error(String(hresult)));
        }

        return result[0].getString();
        //return result[0].getReferent().getString();
    }

    /**
     * 
     * @param {string} name
     * @returns {Promise<OPCGroupStateManager>}
     * @opNum 2
     */
    async getGroupByName(name) {
        debug("Getting group \"" + name + "\"...");
        if (!this._comObj) throw new Error("Not initialized");

        let callObject = new CallBuilder(true);
        callObject.setOpnum(2);

        callObject.addInParamAsString(name, Flags.FLAG_REPRESENTATION_STRING_LPWSTR);
        callObject.addInParamAsUUID(constants.iid.IOPCGroupStateMgt_IID, Flags.FLAG_NULL);
        callObject.addOutParamAsType(Types.COMOBJECT, Flags.FLAG_NULL);

        let resultObj = await this._comObj.call(callObject);

        let hresult = resultObj.hresult;
        let result = resultObj.getResults();
        if (hresult != 0) {
            if (result.lenght == 0)
                throw new Error(String(hresult));
            else 
                debug(new Error(String(hresult)));
        }

        let group = new OPCGroupStateManager();
        await group.init(result[0]);
        debug("Successfully get request for group \"" + name +"\".");
        return group;
    }

    /**
     * @returns {Promise<GroupStatus>} the server status
     * @opNum 3
     */
    async getStatus() {
        debug("Querying server for status information..");
        if (!this._comObj) throw new Error("Not initialized");

        let statusStruct = new Struct();
        statusStruct.addMember(new ComValue(filetime.getStruct(), Types.STRUCT)); //startTime
        statusStruct.addMember(new ComValue(filetime.getStruct(), Types.STRUCT)); //currentTime
        statusStruct.addMember(new ComValue(filetime.getStruct(), Types.STRUCT)); //lastUpdate
        statusStruct.addMember(new ComValue(null, Types.SHORT)); //serverState
        statusStruct.addMember(new ComValue(null, Types.INTEGER)); //groupCount
        statusStruct.addMember(new ComValue(null, Types.INTEGER)); //bandwidth
        statusStruct.addMember(new ComValue(null, Types.SHORT)); //majorVersion
        statusStruct.addMember(new ComValue(null, Types.SHORT)); //minorVersion
        statusStruct.addMember(new ComValue(null, Types.SHORT)); //buildNumber
        statusStruct.addMember(new ComValue(null, Types.SHORT)); //reserved
        let vendorInfoCV = new ComValue(new ComString(Flags.FLAG_REPRESENTATION_STRING_LPWSTR), Types.COMSTRING);
        statusStruct.addMember(new ComValue(new Pointer(vendorInfoCV), Types.POINTER)); //vendorInfo

        let statusStructPointer = new Pointer(new ComValue(statusStruct, Types.STRUCT));

        let callObject = new CallBuilder(true);
        callObject.setOpnum(3);
        callObject.addOutParamAsObject(new ComValue(statusStructPointer, Types.POINTER), Flags.FLAG_NULL);

        let resultObj = await this._comObj.call(callObject);

        let hresult = resultObj.hresult;
        let result = resultObj.getResults();
        if (hresult != 0) {
            if (result.lenght == 0)
                throw new Error(String(hresult));
            else 
                debug(new Error(String(hresult)));
        }

        let resStruct = result[0].getValue().getReferent();

        debug("Server Status information obtained.");
        return {
            startTime: filetime.fromStruct(resStruct.getMember(0).getValue()).getDate(),
            currentTime: filetime.fromStruct(resStruct.getMember(1).getValue()).getDate(),
            lastUpdateTime: filetime.fromStruct(resStruct.getMember(2).getValue()).getDate(),
            serverState: resStruct.getMember(3).getValue(),
            groupCount: resStruct.getMember(4).getValue(),
            bandWidth: resStruct.getMember(5).getValue(),
            majorVersion: resStruct.getMember(6).getValue(),
            minorVersion: resStruct.getMember(7).getValue(),
            buildNumber: resStruct.getMember(8).getValue(),
            reserved: resStruct.getMember(9).getValue(),
            vendorInfo: resStruct.getMember(10).getValue().getReferent().getString()
        };
    }

    /**
     * 
     * @param {OPCGroupStateManager|number} handle
     * @param {boolean} [force=false]
     * @returns {Promise<?>}
     * @opNum 4
     */
    async removeGroup(handle, force) {
        debug("Removing group \"" + name + "\"...");
        if (!this._comObj) throw new Error("Not initialized");

        if (handle instanceof OPCGroupStateManager) {
            handle = groupCache.get(handle);
        }
        if (typeof handle != 'number') {
            throw new Error("Cannot find handle for the provided group");
        }

        let callObject = new CallBuilder(true);
        callObject.setOpnum(4);

        callObject.addInParamAsInt(handle, Flags.FLAG_NULL);
        callObject.addInParamAsInt(force ? 1 : 0, Flags.FLAG_NULL);

        await this._comObj.call(callObject);
        debug("Group \"" + name + "\" successfully removed.");
    }

    /**
     * 
     * @param {number} scope an OPC scope
     * @returns {Promise<string[]>}
     * @opNum 5
     */
    async getGroups(scope) {
        debug("Querying OPCServer for a list of available groups...");
        if (!this._comObj) throw new Error("Not initialized");

        let callObject = new CallBuilder(true);
        callObject.setOpnum(5);

        callObject.addInParamAsShort(scope, Flags.FLAG_NULL);
        callObject.addInParamAsUUID(constants.iid.IEnumString_IID, Flags.FLAG_NULL);
        callObject.addOutParamAsType(Types.COMOBJECT, Flags.FLAG_NULL);

        let resultObj = await this._comObj.call(callObject);

        let hresult = resultObj.hresult;
        let result = resultObj.getResults();
        if (hresult != 0) {
            if (result.lenght == 0)
                throw new Error(String(hresult));
            else 
                debug("No groups were found");
        }

        let enumStr = new EnumString();
        await enumStr.init(result[0].getValue());
        let res = await enumStr.asArray();
        await enumStr.end(hresult);
        debug("Group list successfully obtained.");
        return res;
    }

    // ------

    /**
     * @returns {Promise<OPCCommon>} an OPCCommon instance of this server
     */
    async getCommon() {
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcCommon) {
            let opcCommon = new OPCCommon(); //TODO pass comObj handle
            await opcCommon.init(this._comObj);
            this._opcCommon = opcCommon;
        }
        return this._opcCommon;
    }

    /**
     * @returns {Promise<OPCBrowser>} an OPCBrowser instance of this server
     */
    async getBrowser() {
        debug("Creating a browser instance...");
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcBrowser) {
            let opcBrowser = new OPCBrowser(); //TODO pass comObj handle
            await opcBrowser.init(this._comObj);
            this._opcBrowser = opcBrowser;
        }
        debug("Browser instance succesfully created.");
        return this._opcBrowser;
    }

    /**
     * @returns {Promise<OPCItemIO>} an OPCBrowser insance of this server
     */
    async getItemIO() {
        debug("Creating an ItemIO instance...");
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcItemIO) {
            let opcItemIO = new OPCItemIO(); //TODO pass comObj handle
            await opcItemIO.init(this._comObj);
            this._opcItemIO = opcItemIO;
        }
        debug("ItemIO instance successfully created.");
        return this._opcItemIO;
    }

    /**
     * @returns {Promise<OPCItemProperties>} an OPCBrowser insance of this server
     */
    async getItemProperties() {
        if (!this._comObj) throw new Error("Not initialized");

        if (!this._opcItemProperties) {
            let opcItemProperties = new OPCItemProperties(); //TODO pass comObj handle
            await opcItemProperties.init(this._comObj);
            this._opcItemProperties = opcItemProperties;
        }
        return this._opcItemProperties;
    }

}

module.exports = OPCServer;