import { CustomConsole } from "@jest/console";

global.console = new CustomConsole(process.stdout, process.stderr, (_type, msg) => msg);
