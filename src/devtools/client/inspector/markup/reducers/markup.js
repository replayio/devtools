const INITIAL_MARKUP = {};

const reducers = {};

module.exports = function (markup = INITIAL_MARKUP, action) {
  const reducer = reducers[action.type];
  if (!reducer) {
    return markup;
  }
  return reducer(markup, action);
};
