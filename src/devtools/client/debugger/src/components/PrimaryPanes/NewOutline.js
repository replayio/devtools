import React, { useEffect, useState, memo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import classnames from "classnames";

import actions from "../../actions";
import * as selectors from "../../selectors";
import { Redacted } from "ui/components/Redacted";

import PreviewFunction from "../shared/PreviewFunction";
import { fuzzySearch } from "../../utils/function";
import uniq from "lodash/uniq";

import { connect } from "devtools/client/debugger/src/utils/connect";

function formatData(symbols, filter) {
  if (!symbols || !symbols.functions) {
    return { classes: [], namedFunctions: [], functions: [] };
  }

  const functions = symbols.functions.filter(func => func.name != "anonymous");

  let classes = uniq(functions.map(func => func.klass));

  let namedFunctions = functions.filter(
    func => fuzzySearch(func.name, filter) && !func.klass && !classes.includes(func.name)
  );

  return { classes, namedFunctions };
}

function NewOutline({ selectLocation, symbols }) {
  const [namedFunctions, setNamedFunctions] = useState([]);

  useEffect(() => {
    const { namedFunctions } = formatData(symbols);
    console.log("SYMBOLS Effect", { symbols, namedFunctions });
    setNamedFunctions(namedFunctions);
    return () => {};
  }, [symbols]);

  const Function = function Function({ index }) {
    const func = namedFunctions[index];
    const { name, location, parameterNames } = func;

    return (
      <li className={classnames("outline-list__element", { focused: false })}>
        <span className="outline-list__element-icon">λ</span>
        <Redacted className="inline-block">
          <PreviewFunction func={{ name, parameterNames }} />
        </Redacted>
      </li>
    );
  };

  return (
    <div className="outline">
      <div className="outline__container">
        <>
          {/* <OutlineFilter filter={filter} updateFilter={this.updateFilter} /> */}
          <List height={150} width={200} itemCount={namedFunctions.length} itemSize={16}>
            {Function}
          </List>
        </>
      </div>
    </div>
  );
}

const mapStateToProps = state => {
  const selectedSource = selectors.getSelectedSourceWithContent(state);
  const symbols = selectedSource ? selectors.getSymbols(state, selectedSource) : null;

  return {
    selectedSource,
    symbols,
  };
};

export default connect(mapStateToProps, {
  selectLocation: actions.selectLocation,
})(NewOutline);
