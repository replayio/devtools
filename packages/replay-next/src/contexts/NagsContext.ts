import { createContext } from "react";

import { Nag } from "shared/graphql/types";

// The current user's dismissed nags, or null while the user is unknown.
// They live apart from SessionContext because dismissing a nag refetches the user,
// and only the components that show nags should re-render for that.
export const NagsContext = createContext<Nag[] | null>(null);
