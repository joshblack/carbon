/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const react = require('./react/builder');
const vanilla = require('./vanilla/builder');
const svg = require('./svg/builder');

const builders = {
  react: {
    run: react,
  },
  vanilla,
  svg,
};

module.exports = builders;
