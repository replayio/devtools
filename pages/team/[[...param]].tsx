import { useEffect } from "react";
import { setLoadingFinished } from "ui/actions/app";
import Library from "ui/components/Library";
import { useAppDispatch } from "ui/setup/hooks";

export default function TeamIndex() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setLoadingFinished(true));
  }, [dispatch]);

  return <Library />;
}
