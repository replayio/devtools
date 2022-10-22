// The PageStyle actor flattens the DOM CSS objects a little bit, merging Rules and their Styles into one actor.
// For elements (which have a style but no associated rule) we fake a rule with the following style id.
export const ELEMENT_STYLE = 100;

export const TOO_MANY_POINTS_TO_FIND = 10_000;
