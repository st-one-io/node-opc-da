# opc-da

This library implements the OPC-DA specifications and allows to communicate with OPC Servers, relying on the [node-dcom](https://github.com/netsmarttech/node-dcom) library for DCOM/DCE-RPC for protocol implementation. Currently this lib support browsing calls and synchronous reads. The code overall strucuture was heavly based on [Utgard](https://en.wikipedia.org/wiki/Utgard_(software)).

This node was created by [Smart-Tech](https://netsmarttech.com) as part of the [ST-One](https://netsmarttech.com/page/st-one) project.

## Table of Contents
- [Install](#install)
- [Usage](#usage)
  - [OPC Server](#opc-server)
    - [Creating a Server](#creating-a-server)
    - [Deleting  a Server](#deleting-a-server)
  - [OPC Browse](#opc-browser)
    - [Flat browsing](#flat-browsing)
    - [Tree browsing](#tree-browsing)
  - [OPC Groups](#opc-groups)
    - [Creating a Group](#creating-a-group)
    - [Removing a Group](#removing-a-group)
  - [OPC Items](#opc-items)
    - [Adding an Item](#adding-an-item)
    - [Validating an Item](#validating-an-item)
  - [Reading with OPC Sync](#reading-with-opc-sync)
- [Disclaimer](#disclaimer)
- [Contributing](#contributing)

## Install

Using npm:

```bash
npm install node-opc-da
```

## Usage

### OPC Server

An OPC server is on object you will be using as the basis for every operation and object instantiation to communicate with a remote OPC server. Since OPC-DA relies on COM/DCOM for all it's features, to create a basic OPC Server object we'll need to create a few COM objects first.

#### Creating a Server

```javascript
// creates a COM Session from a domain, an username, and a password
let comSession = new Session();
comSession = comSession.createSession(domain, username, password);

// sets a global timeout for connections related to this session
comSession.setGlobalSocketTimeout(timeout);

// create a COM Server from a classid, an IP address and the previously created session
let comServer = new ComServer(clsid, address, comSession);

// star the COM Server
await comServer.init();

/* from the COM Server, we create a instance we'll use to create every other COM related object */
let comObject = await comServer.createInstance();

// with the comObjet created, we create an OPC Server object and call init()
let opcServer = new OPCServer();
await opcServer.init(comObject);
```

#### Removing a Server

To remove an OPC Server reference we call the ```end()``` function. This call only release objects created from the server object (opcBrowser, opcItemManager, opcGroupStateManager) and the server object itself. See the ```node-dcom``` library for more information on how to remove a COM session and server.

```javascript
opcServer.end()
```

### OPC Browse

Browsing function are used to explore the items stored in the server. OPC-DA offers mainly two types of browsing: flat browsing and tree browsing. Flat Browsing returns a flat list of all server items, ignoring any internal directory tree. Tree Browsing, walks throughout the internal directory tree and returns a list of directories, each containing a list of items.

#### Flat browsing

```Javascript
let opcBrowser = await opcServer.getBrowser();
let items = await opcBrowser.browseAllFlat();
```

#### Tree browsing

```Javascript
let opcBrowser = await opcServer.getBrowser();
let items = await opcBrowser.browseAllTree();
```

### OPC Groups

After an OPC Server is created, if you want to read one or more items you must first create a group. To achieve this we call the function ```addGroup``` giving a group name and a list of options as parameters.

#### Creating a Group

```Javascript
/* opts {
 * {Boolean} [active]
 * {Number} [updateRate]
 * {Number} [clientHandle]
 * {Number} [timeBias]
 * {Number} [deadband] - until asyn read is implemented this does nothing
 * {Number} [localeID]
 * }
 */
let opcGroup = await opcServer.addGroup(name, opts)
```

#### Removing a Group

To remove a group from an opcServer we call the function ```removeGroup``` giving the group handle as paremeter, and a ```boolean``` value to indicate if the server must wait any ongoing operation to end before being removed or not.

```Javascript
/* {Number} [handle]
 * {Boolean} [force]
 */
opcServer.removeGroup(groupHandle, force);
```

### OPC Items

#### Adding an Item

```javascript
// create a item manager from the group object
let opcItemManager = await opcGroup.getItemManager();

/* item {
 * {String} [itemID] - the name of the item on the server, can be obtained through browser
 * {Number} [clientHandle] - a locally generated number to identify this item
 * }
 * calls the add() function passing one or more item objects as parameter
 */
opcItemManager.add(item | itemList);
```

#### Validating an Item

```javascript
/* item {
 * {String} [itemID] - the name of the item on the server, can be obtained through browser
 * {Number} [clientHandle] - a locally generated number to identify this item
 * }
 */
opcItemManager.validate(item | itemList);
```

### Reading with OPC Sync

```javascript
// create a reading object for the group
let opcSyncIO = await opcGroup.getSyncIO();

/* {Number} [dataSource] - from where it will be read
 * {Number} [serverHandles] - one or more handles. An item handle is obtained by calling 
 * the add() function, which returns an array of properties for each item readed.
*/
await opcSyncIO.read(dataSource, serverHandles);
```

## Disclaimer

**This is a work in progress.** Expect things to break, crash and burn. We cannot be hold liable for any damage to any equipment or issues directly or indirectly caused by this library. You've been warned.

## Contributing

This is a partial implementation and there are lots that could be done to improve what is already supported or to add support for more OPC-DA features. Feel free to dive in! Open an issue or submit PRs.


## License
Copyright 2017 Smart-Tech, [Apache 2.0 license](LICENSE).
