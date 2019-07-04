//@ts-check
/*
  Copyright: (c) 2019, Guilherme Francescon Cittolin <gfcittolin@gmail.com>
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const constants = {
  clsid: {
    OPCServerList_CLSID: "13486D51-4821-11D2-A494-3CB306C10000"
  },
  iid: {
    IConnectionPointContainer_IID: "B196B284-BAB4-101A-B69C-00AA00341D07",
    IConnectionPoint_IID: "B196B286-BAB4-101A-B69C-00AA00341D07",
    IOPCCommon_IID: "F31DFDE2-07B6-11D2-B2D8-0060083BA1FB",
    IEnumString_IID: "00000101-0000-0000-C000-000000000046",
    IEnumGUID_IID: "0002E000-0000-0000-C000-000000000046",
    IOPCServer_IID: "39C13A4D-011E-11D0-9675-0020AFD8ADB3",
    IOPCGroupStateMgt_IID: "39C13A50-011E-11D0-9675-0020AFD8ADB3",
    IOPCBrowse_IID: "39227004-A18F-4B57-8B0A-5235670F4468",
    IOPCBrowseServerAddressSpace_IID: "39C13A4F-011E-11D0-9675-0020AFD8ADB3",
    IOPCItemMgt_IID: "39C13A54-011E-11D0-9675-0020AFD8ADB3",
    IOPCItemProperties_IID: "39C13A72-011E-11D0-9675-0020AFD8ADB3",
    IOPCItemIO_IID: "85C0B427-2893-4CBC-BD78-E5FC5146F08F",
    IOPCDataCallback_IID: "39C13A70-011E-11D0-9675-0020AFD8ADB3",
    IOPCAsyncIO2_IID: "39C13A71-011E-11D0-9675-0020AFD8ADB3",
    IOPCSyncIO_IID: "39C13A52-011E-11D0-9675-0020AFD8ADB3",
    IOPCServerList_IID: "13486D50-4821-11D2-A494-3CB306C10000"
  },
  category: {
    OPCDAServer10: "63D5F430-CFE4-11d1-B2C8-0060083BA1FB",
    OPCDAServer20: "63D5F432-CFE4-11d1-B2C8-0060083BA1FB",
    OPCDAServer30: "CC603642-66D7-48f1-B69A-B625E73652D7",
    XMLDAServer10: "3098EDA4-A006-48b2-A27F-247453959408"
  },
  opc: {
    browse: {
      direction: {
        UNKNOWN: 0,
        UP: 1,
        DOWN: 2,
        TO: 3
      },
      type: {
        UNKNOWN: 0,
        BRANCH: 1,
        LEAF: 2,
        FLAT: 3
      }
    },
    dataSource: {
      UNKNOWN: 0,
      CACHE: 1,
      DEVICE: 2
    },
    scope: {
      UNKNOWN: 0,
      PRIVATE_CONNECTIONS: 1,
      PUBLIC_CONNECTIONS: 2,
      ALL_CONNECTIONS: 3,
      PRIVATE: 4,
      PUBLIC: 5,
      ALL: 6
    },
    namespaceType: {
      UNKNOWN: 0,
      HIERARCHIAL: 1,
      FLAT: 2
    },
    state: {
      UNKNOWN: 0,
      RUNNING: 1,
      FAILED: 2,
      NOCONFIG: 3,
      SUSPENDED: 4,
      TEST: 5,
      COMM_FAULT: 6
    },
    stateLabel: {
      "0": "unknown",
      "1": "running",
      "2": "failed",
      "3": "noconfig",
      "4": "suspended",
      "5": "test",
      "6": "comm_fault"
    },
    error: {
      OPCInvalidHandle: 3221487617,
      OPCBadType: 3221487620,
      OPCPublic: 3221487621,
      OPCBadRights: 3221487622,
      OPCUnknownItemID: 3221487623,
      OPCInvalidItemID: 3221487624,
      OPCInvalidFilter: 3221487625,
      OPCUnknownPath: 3221487626,
      OPCRange: 3221487627,
      OPCDuplicateName: 3221487628,
      OPCUnsupportedRate: 262157,
      OPCClamp: 262158,
      OPCInuse: 262159,
      OPCInvalidConfig: 3221487632,
      OPCNotFound: 3221487633,
      OPCInvalidPID: 3221488131
    },
    errorDesc: {
      "3221487617": "The value of the handle is invalid",
      "3221487620": "The server cannot convert the data between the specified format/requested data type and the canonical data type",
      "3221487621": "The requested operation cannot be done on a public group",
      "3221487622": "The Items AccessRights do not allow the operation",
      "3221487623": "The item ID is not defined in the server address space (on add or validate) or no longer exists in the server address space (for read or write)",
      "3221487624": "The item ID doesn't conform to the server's syntax",
      "3221487625": "The filter string was not valid",
      "3221487626": "The item's access path is not known to the server",
      "3221487627": "The value was out of range",
      "3221487628": "Duplicate name not allowed",
      "262157": "The server does not support the requested data rate but will use the closest available rate",
      "262158": "A value passed to WRITE was accepted but the output was clamped",
      "262159": "The operation cannot be performed because the object is bering referenced",
      "3221487632": "The server's configuration file is in an invalid format",
      "3221487633": "Requested Object (e.g. a public group) was not found",
      "3221488131": "The passed property ID is not valid for the item"
    },
    property: {
      DATATYPE: 1,
      VALUE: 2,
      QUALITY: 3,
      TIMESTAMP: 4,
      ACCESS_RIGHTS: 5,
      SCAN_RATE: 6,
      EU_TYPE: 7,
      EU_INFO: 8,
      EU_UNITS: 100,
      DESCRIPTION: 101,
      HIGH_EU: 102,
      LOW_EU: 103,
      HIGH_IR: 104,
      LOW_IR: 105,
      CLOSE_LABEL: 106,
      OPEN_LABEL: 107,
      TIMEZONE: 108,
      CONDITION_STATUS: 300,
      ALARM_QUICK_HELP: 301,
      ALARM_AREA_LIST: 302,
      PRIMARY_ALARM_AREA: 303,
      CONDITION_LOGIC: 304,
      LIMIT_EXCEEDED: 305,
      DEADBAND: 306,
      HIHI_LIMIT: 307,
      HI_LIMIT: 308,
      LO_LIMIT: 309,
      LOLO_LIMIT: 310,
      CHANGE_RATE_LIMIT: 311,
      DEVIATION_LIMIT: 312,
      SOUND_FILE: 313,
      TYPE_SYSTEM_ID: 600,
      DICTIONARY_ID: 601,
      TYPE_ID: 602,
      DICTIONARY: 603,
      TYPE_DESCRIPTION: 604,
      CONSISTENCY_WINDOW: 605,
      WRITE_BEHAVIOR: 606,
      UNCONVERTED_ITEM_ID: 607,
      UNFILTERED_ITEM_ID: 608,
      DATA_FILTER_VALUE: 609,
    },
    propertyDesc: {
      "1": "Item Canonical Data Type",
      "2": "Item Value",
      "3": "Item Quality",
      "4": "Item Timestamp",
      "5": "Item Access Rights",
      "6": "Server Scan Rate",
      "7": "Item EU Type",
      "8": "Item EU Info",
      "100": "EU Units",
      "101": "Item Description",
      "102": "High EU",
      "103": "Low EU",
      "104": "High Instrument Range",
      "105": "Low Instrument Range",
      "106": "Contact Close Label",
      "107": "Contact Open Label",
      "108": "Item Timezone",
      "300": "Condition Status",
      "301": "Alarm Quick Help",
      "302": "Alarm Area List",
      "303": "Primary Alarm Area",
      "304": "Condition Logic",
      "305": "Limit Exceeded",
      "306": "Deadband",
      "307": "HiHi Limit",
      "308": "Hi Limit",
      "309": "Lo Limit",
      "310": "LoLo Limit",
      "311": "Rate of Change Limit",
      "312": "Deviation Limit",
      "313": "Sound File",
      "600": "Type System ID",
      "601": "Dictionary ID",
      "602": "Type ID",
      "603": "Dictionary",
      "604": "Type Description",
      "605": "Consistency Window",
      "606": "Write Behavior",
      "607": "Unconverted Item ID",
      "608": "Unfiltered Item ID",
      "609": "Data Filter Value"
    }
  }
};

module.exports = Object.freeze(constants);