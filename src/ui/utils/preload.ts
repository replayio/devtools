import React from "react";

export const lazyWithPreload = (
  factory: () => Promise<{
    default: React.ComponentType<any>;
  }>
) => {
  const Component = React.lazy(factory);
  // @ts-ignore
  Component.preload = factory;
  return Component;
};
