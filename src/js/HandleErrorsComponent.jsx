import React from 'react';
import ReactDom from 'react-dom';

/**
 * Class in charge displaying the error in the error template
 */
class ErrorPage extends React.Component {

  constructor (props) {
    super(props);
    this.state = {isCollapsed: true};
  }

  static getCookie (cookiename) {
    const cookiestring = RegExp(`${cookiename}[^;]+`).exec(document.cookie);
    return decodeURIComponent(cookiestring ? cookiestring.toString().replace(/^[^=]+./, '') : '');
  }

  handleClick () {
    this.setState((prevState) => ({isCollapsed: !prevState.isCollapsed}));
  }

  render () {
    const errorObj = JSON.parse(this.constructor.getCookie('unifile_error'));
    const isCollapsedClass = this.state.isCollapsed ? 'is-collapsed' : 'is-not-collapsed';
    return (
      <div className="is-vertically-centered">
        <p>An error occurred while connecting the service</p>
        <div className="collapse alert is-default">
          <button onClick={() => this.handleClick()}><span>Details of the error</span></button>
          <div className={`collapse-section ${isCollapsedClass}`}>
            <p>{`${errorObj.code}: ${errorObj.name}`}</p>
            <p>{errorObj.message}</p>
          </div>
        </div>
      </div>
    );
  }
}

ReactDom.render(
  <ErrorPage />,
  document.getElementById('error')
);
