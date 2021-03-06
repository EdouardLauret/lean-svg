'use strict';

/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see https://github.com/svg/svgo
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.githubusercontent.com/svg/svgo/master/LICENSE
 */

    import CONFIG from './config.js';
    import SVG2JS from 'svgo/lib/svgo/svg2js.js'
    import PLUGINS from 'svgo/lib/svgo/plugins.js'
    import JSAPI from 'svgo/lib/svgo/jsAPI.js'
    import { encodeSVGDatauri } from 'svgo/lib/svgo/tools.js';

    // console.log(encodeSVGDatauri)
    import JS2SVG from 'svgo/lib/svgo/js2svg.js';

export function SVGO(config) {
    this.config = CONFIG(config);
};

SVGO.prototype.optimize = function(svgstr, info) {
    return new Promise((resolve, reject) => {
        if (this.config.error) {
            reject(this.config.error);
            return;
        }

        var config = this.config,
            maxPassCount = config.multipass ? 10 : 1,
            counter = 0,
            prevResultSize = Number.POSITIVE_INFINITY,
            optimizeOnceCallback = (svgjs) => {
                if (svgjs.error) {
                    reject(svgjs.error);
                    return;
                }

                if (++counter < maxPassCount && svgjs.data.length < prevResultSize) {
                    prevResultSize = svgjs.data.length;
                    this._optimizeOnce(svgjs.data, info, optimizeOnceCallback);
                } else {
                    if (config.datauri) {
                        svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
                    }
                    resolve(svgjs);
                }
            };

        this._optimizeOnce(svgstr, info, optimizeOnceCallback);
    });
};

SVGO.prototype._optimizeOnce = function(svgstr, info, callback) {
    var config = this.config;

    SVG2JS(svgstr, function(svgjs) {
        if (svgjs.error) {
            callback(svgjs);
            return;
        }

        svgjs = PLUGINS(svgjs, info, config.plugins);

        callback(JS2SVG(svgjs, config.js2svg));
    });
};

/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
SVGO.prototype.createContentItem = function(data) {
    return new JSAPI(data);
};
