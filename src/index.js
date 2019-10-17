//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = require('./constants');
const OPCAsyncIO = require('./opcAsyncIO');
const OPCBrowser = require('./opcBrowser');
const OPCCommon = require('./opcCommon');
const OPCGroupStateManager = require('./opcGroupStateManager');
const OPCItemIO = require('./opcItemIO');
const OPCItemManager = require('./opcItemManager');
const OPCItemProperties = require('./opcItemProperties');
const OPCServer = require('./opcServer');
const OPCSyncIO = require('./opcSyncIO');
const dcom = require('node-dcom');
const EventEmitter = require('events').EventEmitter;
const {ComServer, Session, Clsid} = dcom;

/**
 * 
 * @param {String} address
 * @param {String} domain 
 * @param {String} user 
 * @param {String} pass 
 * @param {String} clsid 
 * @param {object} [opts] 
 * @returns {Promise<{comServer:ComServer, opcServer:OPCServer}>}
 */
async function createServer(address, domain, user, pass, clsid, opts) {
  EventEmitter.call(this);
  let session = new Session();
  session = session.createSession(domain, user, pass);
  session.setGlobalSocketTimeout(7000);

  let comServer = new ComServer(new Clsid(clsid), address, session);
  
  await comServer.init();
  console.log(`debug`);
  let comObject = await comServer.createInstance();

  let opcServer = new OPCServer(opts);
  await opcServer.init(comObject);

  return {comServer, opcServer};
}

module.exports = {
  constants,
  OPCAsyncIO,
  OPCBrowser,
  OPCCommon,
  OPCGroupStateManager,
  OPCItemIO,
  OPCItemManager,
  OPCItemProperties,
  OPCServer,
  OPCSyncIO,
  dcom,
  createServer
}