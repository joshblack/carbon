/**
 * Copyright IBM Corp. 2016, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { settings } from 'carbon-components';
import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

const { prefix } = settings;

function Row({
  as = 'div',
  className: customClassName,
  isCondensed,
  noGutter,
  noGutterLeft,
  noGutterRight,
  ...rest
}) {
  const className = cx({
    [`${prefix}--row`]: true,
    [`${prefix}--row--condensed`]: isCondensed,
    [`${prefix}--no-gutter`]: noGutter,
    [`${prefix}--no-gutter--left`]: noGutterLeft,
    [`${prefix}--no-gutter--right`]: noGutterRight,
    [customClassName]: !!customClassName,
  });
  return React.createElement(as, {
    ...rest,
    className,
  });
}

Row.propTypes = {
  /**
   * Provide a custom element to render instead of the default <div>
   */
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),

  className: PropTypes.string,

  /**
   * Specify if the row should be rendered as a condensed row
   */
  isCondensed: PropTypes.bool,

  /**
   * Specify if each column in a row should have no gutter
   */
  noGutter: PropTypes.bool,

  /**
   * Specify if each column in a row should have no gutter on the left-hand side
   */
  noGutterLeft: PropTypes.bool,

  /**
   * Specify if each column in a row should have no gutter on the right-hand side
   */
  noGutterRight: PropTypes.bool,
};

export default Row;
