import React from "react";
import { OutlineClassFunctions } from "./OutlineClassFunctions";
import { OutlineFunction } from "./OutlineFunction";
import { filterOutlineItem } from "./filterOutlineItem";
import { getFunctionKey } from "./Outline";

export function ClassFunctionsList({
  symbols,
  functions,
  outlineList,
  klass,
  focusedItem,
  onSelect,
  filter,
}) {
  if (!symbols || symbols.loading || klass == null || functions.length == 0) {
    return null;
  }

  const classFunc = functions.find(func => func.name === klass);
  const classInfo = symbols.classes.find(c => c.name === klass);
  let classFunctions = functions.filter(
    func => filterOutlineItem(func.name, filter) && !!func.klass
  );

  const item = classFunc || classInfo;
  const isFocused = focusedItem === item;

  return (
    <OutlineClassFunctions
      classFunc={classFunc}
      classInfo={classInfo}
      isFocused={isFocused}
      outlineList={outlineList}
      onSelect={onSelect}
    >
      {classFunctions.map(func => (
        <OutlineFunction
          key={getFunctionKey(func)}
          isFocused={focusedItem === func}
          func={func}
          onSelect={onSelect}
          outlineList={outlineList}
        />
      ))}
    </OutlineClassFunctions>
  );
}
