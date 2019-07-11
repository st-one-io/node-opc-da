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

/**
 * 
 * @param {string} domain 
 * @param {string} user 
 * @param {string} pass 
 * @param {string} clsid 
 * @returns {Promise<OPCServer>}
 */
async function createServer(domain, user, pass, clsid) {

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

  createServer
}