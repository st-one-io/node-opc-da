//@ts-check

const {Struct} = require('node-dcom');
const Long = require('long');

class FileTime {

    constructor(hi, lo){
        this._hi = hi;
        this._lo = lo;
        this._date = null;
    }

    get hi(){
        return this._hi;
    }
    get lo(){
        return this._lo;
    }
    set hi(hi){
        this._hi = hi;
        this._date = null;
    }
    set lo(lo){
        this._lo = lo;
        this._date = null;
    }

    /**
     * @returns {Date}
     */
    getDate() {
        if (!this._date) this._computeDate();
        return this._date;
    }

    _computeDate(){
        let ulong = new Long(this._lo, this._hi, true).div(10000);
        let epochBase = ulong.sub(11644473600000);

        if (epochBase.greaterThan(ulong))
            epochBase = epochBase.toSigned();
        else 
            epochBase = epochBase.toNumber();

        this._date = new Date(epochBase);
    }

    toString(){
        return `FileTime[${this._hi && this._lo ? this.getDate() : 'null'}]`;
    }
}

/**
 * @returns {Struct}
 */
function getStruct(){
    let struct = new Struct();
    struct.addMember(0); //lo
    struct.addMember(0); //hi

    return struct;
}

/**
 * 
 * @param {Struct} struct 
 * @returns {FileTime}
 */
function fromStruct(struct){
    let lo = struct.getMember(0).getValue();
    let hi = struct.getMember(1).getValue();

    return new FileTime(hi, lo);
}

module.exports = {
    FileTime, getStruct, fromStruct
}