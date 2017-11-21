import classNames from 'classnames';
import Icon from '../../Icon';
import React from 'react';
import '../style/index.styl';

export default class Breadcrumbs extends React.Component {
  static defaultProps = {
    items: [],
    icon: null,
    onBreadcrumbClick: function () {}
  };

  render() {
    const {items, icon, onBreadcrumbClick, className} = this.props;

    return (
      <nav>
        {icon &&
          <Icon icon={icon} size="S" />
        }
        <ul className={classNames('spectrum-Breadcrumbs', className)}>
          {items.map((item, i) => (
            <li key={i} className="spectrum-Breadcrumb">
              <a
                className="spectrum-Breadcrumb-link"
                role="link"
                onClick={items.length > 1 && i < items.length - 1 && onBreadcrumbClick.bind(null, item, items.length - i - 1)}
                aria-current={i === items.length - 1 ? 'page': null}
                tabIndex={i < items.length - 1 ? 0 : null}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}
