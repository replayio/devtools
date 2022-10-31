import "@bvaughn/components/sources/CodeMirror.css";
import { SourceFileNameSearchContextRoot } from "@bvaughn/components/sources/SourceFileNameSearchContext";
import { SourceSearchContextRoot } from "@bvaughn/components/sources/SourceSearchContext";
import { KeyboardModifiersContextRoot } from "@bvaughn/src/contexts/KeyboardModifiersContext";
import LazyOffscreen from "@bvaughn/components/LazyOffscreen";
import Source from "@bvaughn/components/sources/Source";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSource } from "@bvaughn/src/suspense/SourcesCache";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useFeature } from "ui/hooks/settings";

export default function NewSourceAdapter() {
  const replayClient = useContext(ReplayClientContext);
  const { focusedSourceId, openSourceIds } = useContext(SourcesContext);

  const { value: showColumnBreakpoints } = useFeature("columnBreakpoints");

  return (
    <div className="editor-wrapper">
      <KeyboardModifiersContextRoot>
        <SourceFileNameSearchContextRoot>
          <SourceSearchContextRoot>
            {openSourceIds.map(sourceId => {
              const source = getSource(replayClient, sourceId);
              return (
                <LazyOffscreen
                  key={sourceId}
                  mode={sourceId === focusedSourceId ? "visible" : "hidden"}
                >
                  <Source source={source!} showColumnBreakpoints={showColumnBreakpoints} />
                </LazyOffscreen>
              );
            })}
          </SourceSearchContextRoot>
        </SourceFileNameSearchContextRoot>
      </KeyboardModifiersContextRoot>
    </div>
  );
}
