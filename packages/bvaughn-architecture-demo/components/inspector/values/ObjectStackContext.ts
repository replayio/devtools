import { createContext } from "react";

type ObjectIdMap = { [objectId: number]: boolean };

const ObjectStackContext = createContext<ObjectIdMap>({});

export default ObjectStackContext;
