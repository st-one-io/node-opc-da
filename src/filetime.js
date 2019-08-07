//@ts-check

const {Struct} = require('dcom');

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
        let i = 0xFFFFFFFF & this._hi;
        i <<= 32;
        let j = 0xFFFFFFFFFFFFFFFF & i;

        i = 0xFFFFFFFF & this._lo;
        j += i;
        j /= 10000;
        j -= 11644473600000;

        this._date = new Date(j).toUTCString();
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
    let lo = struct.getMember(0);
    let hi = struct.getMember(1);

    return new FileTime(hi, lo);
}

module.exports = {
    FileTime, getStruct, fromStruct
}