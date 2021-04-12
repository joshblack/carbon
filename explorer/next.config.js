/**
 * Copyright IBM Corp. 2019, 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const path = require('path');

module.exports = {
  future: {
    webpack5: true,
  },
  webpack(config) {
    config.resolve.alias['~'] = path.join(__dirname, 'src');
    config.externals = ['cssstats', 'sass'];
    return config;
  },
};
