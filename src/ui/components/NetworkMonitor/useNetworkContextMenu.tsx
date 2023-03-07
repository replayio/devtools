import { Row } from "react-table";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { useAppSelector } from "ui/setup/hooks";
import { RequestSummary } from "./utils";
import { getCopyCUrlAbleById, getRequestBodies } from "ui/reducers/network";

export default function useNetworkContextMenu(row: Row<RequestSummary>) {
  const dispatch = useAppDispatch();
  const data = row.original

  const beginTime = row.original?.start;
  const endTime = row.original?.end;

  const setFocusEnd = () => {
    dispatch(setFocusRegionEndTime(endTime!, true));
  };

  const setFocusStart = () => {
    dispatch(setFocusRegionBeginTime(beginTime!, true));
  };
  const isAsset = [ 0, 2, 3, 4, 5, 6, 7, 8, 10].includes(data.type)
  
  const copyCUrlAble = useAppSelector(state => getCopyCUrlAbleById(state, data.id))  

  const requestBody = useAppSelector(getRequestBodies)[data.id]
  
  const genCUrlText = () => {
    let curlText = ""
    if (isAsset) {
      curlText = `curl '${row.values.url}'`
    } else {
      curlText = `curl '${row.values.url}' ${data.requestHeaders.map((item) =>`-H '${item.name}: ${item.value}'`).join(' ')}` 
      if(data.hasRequestBody) {
        curlText += ` --data-raw '${JSON.stringify(requestBody)}'`
      } 
    }
    return curlText
  }
  const copyAsCurl = async () => {
   

    navigator.clipboard.writeText(genCUrlText()) 
  }

  return useContextMenu(
    <>
      <ContextMenuItem disabled={beginTime == null} onClick={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem disabled={endTime == null} onClick={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
      <ContextMenuItem disabled={!copyCUrlAble} onClick={copyAsCurl}>
        <>
          <Icon type="copy" />
          Copy as curl
        </>
      </ContextMenuItem>
    </>
  );
}
