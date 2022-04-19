import { LogoutOptions } from "@auth0/auth0-react";

import { requiresWindow } from "../../ssr";

declare global {
  var Intercom: any;
}

const APP_ID = "k7f741xx";

export function handleIntercomLogout(logout: (options?: LogoutOptions) => void) {
  requiresWindow(() => {
    window.Intercom("shutdown");
    logout({ returnTo: window.location.origin });
  });
}

export function bootIntercom(data: any) {
  requiresWindow(() => {
    /* eslint-disable prettier/prettier */
    // @ts-ignore
    (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/k7f741xx';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
    /* eslint-enable prettier/prettier */
    window.Intercom("boot", { app_id: APP_ID, ...data });
  });
}
