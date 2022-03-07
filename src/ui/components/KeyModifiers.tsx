import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMetaKeyActive, setShiftKeyActive } from "ui/actions/app";
import { getIsMetaActive, getIsShiftActive } from "ui/reducers/app";

export const KeyModifiers: FC = () => {
  const dispatch = useDispatch();
  const isMetaActive = useSelector(getIsMetaActive);
  const isShiftActive = useSelector(getIsShiftActive);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey) {
      dispatch(setMetaKeyActive(true));
    }
    if (e.shiftKey) {
      dispatch(setShiftKeyActive(true));
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Meta") {
      dispatch(setMetaKeyActive(false));
    } else if (e.key === "Shift") {
      dispatch(setShiftKeyActive(false));
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!e.metaKey) {
      dispatch(setMetaKeyActive(false));
    } else if (!e.shiftKey) {
      dispatch(setShiftKeyActive(false));
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    if (isMetaActive || isShiftActive) {
      window.addEventListener("mousemove", onMouseMove);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      if (isMetaActive || isShiftActive) {
        window.removeEventListener("mousemove", onMouseMove);
      }
    };
  });

  return null;
};
