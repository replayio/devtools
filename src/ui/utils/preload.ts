import React from "react";

export const lazyWithPreload = (
  factory: () => Promise<{
    default: React.ComponentType<any>;
  }>
): React.LazyExoticComponent<React.ComponentType<any>> & { preload: () => Promise<any> } => {
  // @ts-ignore
  const Component: React.LazyExoticComponent<React.ComponentType<any>> & {
    preload: () => Promise<any>;
  } = React.lazy(factory);
  Component.preload = factory;
  return Component;
};
