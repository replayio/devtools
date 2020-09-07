const React = require("react");
const ReactDOM = require("react-dom");
import { connect } from "react-redux";
import { createBrowserHistory } from "history";
import { Route, Switch, BrowserRouter } from "react-router-dom";

import Header from "./Header";
import Main from "./Main";

import { selectors } from "../reducers";

import "styles.css";

export const history = createBrowserHistory();

class App extends React.Component {
  render() {
    const { loading, initialize } = this.props;

    return (
      <BrowserRouter history={history}>
        <Header loading={loading} />
        <Switch>
          <Route path="/" exact>
            <Main initialize={initialize} />
          </Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default connect(state => ({
  loading: selectors.getLoading(state),
}))(App);
