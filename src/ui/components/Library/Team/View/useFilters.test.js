import cases from "jest-in-case";

import { encodeFilter } from "./useFilters";

cases("encodeFilters", ({ filter, query }) => expect(encodeFilter(filter)).toEqual(query), [
  { name: "basic", filter: "", query: "" },
  { name: "single with '", filter: "test:' foo'", query: "test:'%20foo'" },
  {
    name: "two with '",
    filter: "test:' foo' bar:' bazz'",
    query: "test:'%20foo' bar:'%20bazz'",
  },
  { name: 'single  with "', filter: 'test:" foo"', query: "test:%22%20foo%22" },
  { name: "single  with word", filter: "test:bazz", query: "test:bazz" },
  {
    name: "single  with word",
    filter: "first:a_wild_🦄_appears second",
    query: "first:a_wild_🦄_appears second",
  },
  {
    name: "double  with word and '",
    filter: "first:baz second:' buz'",
    query: "first:baz second:'%20buz'",
  },
  {
    name: "single [",
    filter: "first:[ foo ]",
    query: "first:%5B%20foo%20%5D",
  },
  {
    name: 'double with [ and "',
    filter: 'first:[ foo ] second:" bar "',
    query: "first:%5B%20foo%20%5D second:%22%20bar%20%22",
  },
]);
