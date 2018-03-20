const mongoose = require('mongoose');
const moment = require('moment');

module.exports = exports = function timeoffsetPlugin(schema, options = {}) {
    options = {paths: [], ...options};
    const paths = findDatePaths(schema, options);

    paths.forEach(p => {
        const path_utc = p + '_utc';
        const path_offset = p + '_offset';
        schema.remove(p);
        schema.add({[path_utc]: Date});
        schema.add({[path_offset]: Number});
        schema.virtual(p)
            .get(function () {
                const utc = _get(this,path_utc);
                const offset = _get(this,path_offset) * 60 || 0;
                return utc ? moment(utc).utcOffset(offset).toDate() : null;
            })
            .set(function (value) {
                if (!value) return;
                _set(this,path_utc,moment(value).utc());
                _set(this,path_offset,moment(value).utcOffset() / 60);
            });
    });
    schema.set('toJSON', {virtuals: true});
    schema.set('toObject', {virtuals: true});
};

function findDatePaths(schema, options) {
    const hasOptions = !!options.paths.length;
    return Object.keys(schema.paths)
        .filter((path) => {
            return hasOptions ? (options.paths.indexOf(path) !== -1) : (schema.paths[path] instanceof mongoose.Schema.Types.Date);
        });
}

/**
 * Deep get path value from object
 * Example:
 *      const o = {here: {there: 'everywhere'}};
 *      _get(o,'here.there'); //-> everywhere
 *
 * @param o - object
 * @param p - path
 * @private
 */
function _get(o,p) {
    return p.split('.').reduce((obj, path) => (obj && obj[path]) ? obj[path] : null, o);
}

/**
 * Deep set path value in object
 * Example:
 *      const o = {}
 *      _set(o,'here.there','everywhere'); //->{here: {there: 'everywhere'}}
 *
 * @param o - object to mutate
 * @param p - path
 * @param v - value to set
 * @return {*} - mutated object (to support chaining)
 * @private
 */
function _set(o,p,v) {
    const paths = p.split('.');
    const k = paths.pop();
    const nested = paths.reduce((obj, path) => {
        if (obj[path] === undefined) obj[path] = {};
        return obj[path];
    }, o);
    nested[k] = v;
    return o;
}
