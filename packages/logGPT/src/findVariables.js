// import babel traverse
import traverse from "babel-traverse";
import * as babelParser from "@babel/parser";
import * as t from "@babel/types";

// find all of the variables in the code
function findVariables(ast) {
  const variables = [];

  const data = {
    variables: [],
    variablesByLine: {},
    statements: [],
  };

  const pushNode = (line, name) => {
    if (!data.variablesByLine[line]) {
      data.variablesByLine[line] = [];
    }
    // only add new variables
    if (!data.variablesByLine[line].includes(name)) {
      data.variablesByLine[line].push(name);
    }
  };

  traverse(ast, {
    // VariableDeclarator(path) {
    //   // source location
    //   // console.log(path.node.id.name, path.node.id.loc);
    //   variables.push(path.node.id.name);
    //   pushNode(path.node.id.loc, path.node.id.name);
    // },

    // identifier
    Identifier(path) {
      // source location
      // console.log(path.node.loc.start.line, path.node.name, path.parent);
      const startLine = path.node.loc.start.line;
      if (
        t.isCallExpression(path.parent) ||
        // NOTE: TypeReferences are not supported yet
        t.isTSTypeReference(path.parent) ||
        // NOTE: this is a substitute for TypeReferences
        t.isImportSpecifier(path.parent) ||
        t.isImportDefaultSpecifier(path.parent) ||
        t.isExportDefaultDeclaration(path.parent) ||
        t.isJSXSpreadAttribute(path.parent) ||
        t.isObjectProperty(path.parent) ||
        t.isMemberExpression(path.parent) ||
        t.isSpreadElement(path.parent)
      ) {
        return;
      }

      if (t.isVariableDeclarator(path.parent)) {
        if (!["ArrowFunctionExpression"].includes(path.parent.init.type)) {
          pushNode(startLine + 1, path.node.name);
        }
        return;
      }

      // console.log(startLine, path.node.name, path.parent);

      // variables.push(path.node.name);
      pushNode(startLine, path.node.name);
    },

    Statement(path) {
      const type = path.node.type;
      if (
        [
          "ImportDeclaration",
          "ExportNamedDeclaration",
          "FunctionDeclaration",
          // "IfStatement",
          "BlockStatement",
          // "ExpressionStatement",
          "ReturnStatement",
        ].includes(type)
      ) {
        return;
      }
      // if (type == "ExpressionStatement") {
      //   console.log(path.node);
      // }

      if (t.isVariableDeclaration(path.node)) {
        // console.log(path.node.loc.start.line, type, path.node.declarations);
        // dont add logs above multiple var declarations
        if (path.node.declarations.length > 0) {
          return;
        }

        // dont add logs above function declarations
        if (t.isArrowFunctionExpression(path.node.declarations[0].init)) {
          return;
        }
      }
      data.statements.push(path.node.loc.start.line);
    },

    // FunctionDeclaration(path) {
    //   // parameters
    //   path.node.params.forEach(param => {
    //     // source location
    //     // console.log(param.name, param.loc);
    //     variables.push(param.name);
    //     pushNode(param.loc, param.name);
    //   });
    // },

    Scope(path) {
      const getKey = node => {
        if (!node) {
          return;
        }
        let loc = node.loc;
        if (node.type == "FunctionDeclaration") {
          loc = node.body.loc;
        }

        if (!loc) {
          console.log(node);
        }
        const { line, column } = loc.start;

        return `(${line},${column})`;
      };

      if (t.isProgram(path)) {
        // return console.log(getKey(path.node));
      }

      console.log(getKey(path.parent), getKey(path.node));
    },
  });
  return data;
}

// parse the file and return the variables
export default function parse(code) {
  try {
    const ast = babelParser.parse(code, {
      sourceType: "unambiguous",
      plugins: [
        "jsx",
        "doExpressions",
        "optionalChaining",
        "nullishCoaliescingOperator",
        "decorators-legacy",
        "objectRestSpread",
        "classProperties",
        "exportDefaultFrom",
        "exportNamespaceFrom",
        "asyncGenerators",
        "functionBind",
        "functionSent",
        "dynamicImport",
        "react-jsx",
        "typescript",
      ],
      tokens: true,
    });
    return findVariables(ast);
  } catch (e) {
    console.warn(e);
    return null;
  }
}
