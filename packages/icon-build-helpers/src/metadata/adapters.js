/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const yaml = require('js-yaml');
const path = require('path');

/**
 * @typedef Adapter
 * @property {Function} getFilenameFor
 * @property {Function} serialize
 * @property {Function} deserialize
 */

/**
 * An adapter for YAML files
 * @type {Adapter}
 */
const yml = {
  /**
   * Get the filename for a given path basename. This is helpful to
   * figure out which file we need to load in from the filesystem for the given
   * adapter.
   * @param {string} name
   * @returns {string}
   */
  getFilenameFor(name) {
    return path.format({
      name,
      ext: '.yml',
    });
  },

  /**
   * Serialize the given data to a YML format
   * @param {object} data
   * @returns {string}
   */
  serialize(data) {
    return yaml.safeDump(data);
  },

  /**
   * Deserialize the given YML data to JavaScript
   * @param {object} data
   * @returns {string}
   */
  deserialize(data) {
    return yaml.safeLoad(data);
  },
};

module.exports = {
  yml,
};
