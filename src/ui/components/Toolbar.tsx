import { default as classNames, default as classnames } from "classnames";
import { useContext, useEffect, useState } from "react";
import { useImperativeCacheValue } from "suspense";

import { getPauseId, getPausePreviewLocation } from "devtools/client/debugger/src/selectors";
import Icon from "replay-next/components/Icon";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isGroupedTestCasesV1 } from "shared/test-suites/RecordingTestMetadata";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { PrimaryPanelName } from "ui/state/layout";
import { shouldShowTour } from "ui/utils/onboarding";
import { trackEvent } from "ui/utils/telemetry";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { isTestSuiteReplay } from "./TestSuite/utils/isTestSuiteReplay";
import styles from "./Toolbar.module.css";

function CypressIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        d="M11.2513 12.6999C12.5461 12.6999 13.6007 13.3903 14.1426 14.5946L14.1855 14.6889L16.3599 13.9505L16.3136 13.8391C15.4716 11.7885 13.5321 10.5139 11.2513 10.5139C9.64792 10.5139 8.34459 11.0279 7.26765 12.0831C6.19759 13.1316 5.65569 14.4507 5.65569 16.0045C5.65569 17.5447 6.19759 18.8569 7.26765 19.9054C8.34459 20.9607 9.64792 21.4747 11.2513 21.4747C13.5321 21.4747 15.4716 20.2001 16.3136 18.1511L16.3599 18.0398L14.182 17.2997L14.1409 17.3973C13.6556 18.5811 12.5752 19.2887 11.2513 19.2887C10.3493 19.2887 9.58785 18.9735 8.98425 18.3533C8.37372 17.7245 8.06505 16.9348 8.06505 16.0063C8.06505 15.0709 8.36685 14.2965 8.98425 13.6387C9.58619 13.0151 10.3493 12.6999 11.2513 12.6999Z"
        fill="currentColor"
      />
      <path
        d="M24.8708 10.7161L21.772 18.5571L18.6527 10.7161H16.1009L20.4755 21.4181L17.3631 28.9663L17.2187 29.3089C17.1193 29.5485 16.9023 29.7171 16.6518 29.7518C16.4358 29.7618 16.2185 29.7669 16 29.7669C15.9549 29.7669 15.9098 29.7667 15.8648 29.7663C8.32392 29.6937 2.23334 23.5583 2.23334 16.0003C2.23334 8.39712 8.39685 2.23358 16 2.23358C23.6031 2.23358 29.7667 8.39712 29.7667 16.0003C29.7667 21.7149 26.2847 26.6163 21.3267 28.6985L20.5182 30.6641C20.3991 30.9536 20.2503 31.2254 20.0761 31.4764C26.9384 29.6739 32 23.4282 32 16.0003C32 7.16371 24.8366 0.000244141 16 0.000244141C7.16345 0.000244141 0 7.16371 0 16.0003C0 24.7917 7.09045 31.9271 15.8648 31.9997C15.8831 31.9999 16.6785 31.9865 16.6785 31.9865C17.824 31.9386 18.8478 31.2208 19.2851 30.1569L27.2819 10.7161H24.8708Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlaywrightIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        d="M16.166 26.2296V23.9863L9.93313 25.7537C9.93313 25.7537 10.3937 23.0777 13.6443 22.1556C14.6301 21.8762 15.4712 21.8781 16.166 22.0123V12.811H19.2868C18.947 11.761 18.6183 10.9526 18.3422 10.3909C17.8855 9.46115 17.4173 10.0775 16.3544 10.9665C15.6058 11.5919 13.7138 12.9261 10.8667 13.6933C8.01955 14.461 5.71779 14.2574 4.75741 14.0911C3.3959 13.8562 2.68376 13.5572 2.75038 14.5928C2.80836 15.5062 3.02594 16.9224 3.52434 18.7928C4.60261 22.8433 8.16619 30.6481 14.9009 28.8342C16.6601 28.3602 17.9018 27.4232 18.7625 26.229L16.166 26.2296ZM6.10837 18.8484L10.8945 17.5876C10.8945 17.5876 10.755 19.4288 8.96076 19.9018C7.16603 20.3743 6.10837 18.8484 6.10837 18.8484Z"
        fill="currentColor"
        fillOpacity="0.5"
      />

      <path
        d="M14.1944 24.5451L13.107 24.8537C13.3639 26.3019 13.8167 27.6917 14.5274 28.9195C14.6511 28.8922 14.7749 28.8687 14.9009 28.8342C15.2311 28.7451 15.5362 28.6348 15.831 28.5145C15.0369 27.3361 14.5116 25.9789 14.1944 24.5451ZM13.7698 14.3451C13.211 16.4307 12.7111 19.4326 12.8487 22.4436C13.095 22.3367 13.3553 22.2376 13.6443 22.1556L13.8455 22.1101C13.6001 18.8939 14.1306 15.6165 14.7282 13.3866C14.8797 12.8225 15.0316 12.2978 15.183 11.8085C14.9391 11.9637 14.6765 12.1228 14.3774 12.2867C14.1757 12.9093 13.972 13.5898 13.7698 14.3451Z"
        fill="currentColor"
      />

      <path
        d="M34.1786 12.9174C32.9345 13.1355 29.9498 13.4072 26.2612 12.4185C22.5716 11.4304 20.1236 9.70222 19.1537 8.88992C17.7788 7.73832 17.174 6.938 16.5788 8.14855C16.0526 9.21628 15.3797 10.954 14.7284 13.3866C13.3171 18.6543 12.2623 29.7706 20.9867 32.1098C29.7093 34.447 34.353 24.292 35.7644 19.0238C36.4157 16.5917 36.7013 14.75 36.7799 13.5625C36.8695 12.2173 35.9455 12.6078 34.1786 12.9174ZM16.6497 17.2756C16.6497 17.2756 18.0246 15.1372 20.3565 15.8C22.6899 16.4628 22.8706 19.0425 22.8706 19.0425L16.6497 17.2756ZM22.342 26.8713C18.2403 25.6698 17.6077 22.399 17.6077 22.399L28.6262 25.4796C28.6262 25.4791 26.4021 28.0578 22.342 26.8713ZM26.2377 20.1495C26.2377 20.1495 27.6107 18.0126 29.9422 18.6773C32.2736 19.3411 32.4572 21.9208 32.4572 21.9208L26.2377 20.1495Z"
        fill="currentColor"
      />

      <path
        d="M22.527 26.9163L22.342 26.8713C18.2403 25.6698 17.6077 22.399 17.6077 22.399L23.289 23.9872L26.2971 12.4281L26.2612 12.4185C22.5716 11.4304 20.1236 9.70222 19.1537 8.88992C17.7788 7.73832 17.174 6.938 16.5788 8.14855C16.0526 9.21628 15.3797 10.954 14.7284 13.3866C13.3171 18.6543 12.2623 29.7706 20.9867 32.1098L21.1655 32.15L22.527 26.9163ZM16.6497 17.2756C16.6497 17.2756 18.0246 15.1372 20.3565 15.8C22.6899 16.4628 22.8706 19.0425 22.8706 19.0425L16.6497 17.2756Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TourIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path
        d="M15.5461 17.9927C15.0877 17.9998 14.6186 17.9425 14.1388 17.8208C13.6662 17.6991 13.1434 17.5093 12.5705 17.2515L2.00015 12.4175C1.64924 12.2599 1.38427 12.0379 1.20523 11.7515C1.03336 11.4578 0.947418 11.1499 0.947418 10.8276C0.947418 10.5125 1.03336 10.2118 1.20523 9.92529C1.38427 9.63167 1.64924 9.40609 2.00015 9.24854L12.5705 4.41455C13.1434 4.15674 13.6662 3.96696 14.1388 3.84521C14.6186 3.72347 15.0877 3.66618 15.5461 3.67334C16.0044 3.66618 16.4699 3.72347 16.9425 3.84521C17.4224 3.96696 17.9487 4.15674 18.5216 4.41455L29.1027 9.24854C29.4536 9.40609 29.715 9.63167 29.8869 9.92529C30.0659 10.2118 30.1554 10.5125 30.1554 10.8276C30.1554 11.1499 30.0659 11.4578 29.8869 11.7515C29.715 12.0379 29.4536 12.2599 29.1027 12.4175L18.5216 17.2515C17.9487 17.5093 17.4224 17.6991 16.9425 17.8208C16.4699 17.9425 16.0044 17.9998 15.5461 17.9927ZM15.5461 16.2954C15.9041 16.2954 16.2658 16.2489 16.631 16.1558C17.0034 16.0555 17.4188 15.9015 17.8771 15.6938L27.7707 11.1929C27.9569 11.1069 28.05 10.9852 28.05 10.8276C28.05 10.6772 27.9569 10.5591 27.7707 10.4731L17.8771 5.97217C17.4188 5.76449 17.0034 5.6141 16.631 5.521C16.2658 5.42074 15.9041 5.37061 15.5461 5.37061C15.188 5.37061 14.8263 5.42074 14.4611 5.521C14.0959 5.6141 13.6841 5.76449 13.2257 5.97217L3.33218 10.4731C3.14599 10.5591 3.05289 10.6772 3.05289 10.8276C3.05289 10.9852 3.14599 11.1069 3.33218 11.1929L13.2257 15.6938C13.6841 15.9015 14.0959 16.0555 14.4611 16.1558C14.8263 16.2489 15.188 16.2954 15.5461 16.2954ZM5.13687 18.9058V13.2339H6.86636V18.9058C6.86636 19.4644 7.06688 20.0015 7.46793 20.5171C7.87613 21.0327 8.45979 21.4946 9.2189 21.9028C9.97802 22.3039 10.8911 22.6226 11.9582 22.8589C13.0324 23.0952 14.2283 23.2134 15.5461 23.2134C16.8709 23.2134 18.0669 23.0952 19.1339 22.8589C20.201 22.6226 21.1141 22.3039 21.8732 21.9028C22.6323 21.4946 23.216 21.0327 23.6242 20.5171C24.0324 20.0015 24.2365 19.4644 24.2365 18.9058V13.2339H25.966V18.9058C25.966 19.7078 25.7189 20.467 25.2248 21.1831C24.7378 21.8993 24.0395 22.5295 23.13 23.0737C22.2205 23.6252 21.1248 24.0549 19.8429 24.3628C18.561 24.6779 17.1287 24.8354 15.5461 24.8354C13.9634 24.8354 12.5311 24.6779 11.2492 24.3628C9.97444 24.0549 8.87873 23.6252 7.96207 23.0737C7.05256 22.5295 6.35432 21.8993 5.86734 21.1831C5.38036 20.467 5.13687 19.7078 5.13687 18.9058ZM15.589 12.0522C15.2095 12.0522 14.8442 11.9985 14.4933 11.8911C14.1424 11.7837 13.8559 11.6405 13.6339 11.4614C13.4119 11.2752 13.3009 11.064 13.3009 10.8276C13.3009 10.5985 13.4119 10.3944 13.6339 10.2153C13.8559 10.0363 14.1424 9.89665 14.4933 9.79639C14.8442 9.68896 15.2095 9.63525 15.589 9.63525C15.9757 9.63525 16.341 9.68896 16.6847 9.79639C17.0356 9.89665 17.3185 10.0363 17.5334 10.2153C17.7554 10.3944 17.8664 10.5985 17.8664 10.8276C17.8664 11.064 17.7554 11.2752 17.5334 11.4614C17.3185 11.6405 17.0356 11.7837 16.6847 11.8911C16.341 11.9985 15.9757 12.0522 15.589 12.0522ZM9.05777 14.8882L7.66129 14.147L14.8371 10.4087L15.4279 11.5151L9.05777 14.8882ZM7.66129 25.4263V14.2007L9.05777 14.8882V25.4263H7.66129ZM6.81265 25.6411C6.81265 25.2186 6.93798 24.8784 7.18863 24.6206C7.44644 24.37 7.78661 24.2446 8.20914 24.2446H8.49918C8.9217 24.2446 9.25829 24.37 9.50894 24.6206C9.76675 24.8784 9.89566 25.2186 9.89566 25.6411V28.4663C9.89566 28.8888 9.76675 29.2254 9.50894 29.4761C9.25829 29.7339 8.9217 29.8628 8.49918 29.8628H8.20914C7.78661 29.8628 7.44644 29.7339 7.18863 29.4761C6.93798 29.2254 6.81265 28.8888 6.81265 28.4663V25.6411Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PassportIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path d="M16.9011 4.09798V2.65831H17.9116C19.2708 2.65831 19.9503 3.36175 19.9503 4.76864V18.4947C19.9503 19.0491 19.8609 19.4724 19.6821 19.7645C19.5092 20.0566 19.1545 20.3308 18.618 20.5871C18.1172 20.8316 17.5688 21.0402 16.9726 21.2131C16.3825 21.386 15.7684 21.5261 15.1306 21.6334C14.4927 21.7407 13.8459 21.8182 13.1901 21.8659C12.5404 21.9195 11.9025 21.9463 11.2765 21.9463C10.1022 21.9463 8.97248 21.845 7.88751 21.6423C6.80254 21.4456 5.87554 21.1803 5.10653 20.8465C4.77865 20.6855 4.56106 20.4918 4.45376 20.2652C4.34645 20.0387 4.2928 19.7526 4.2928 19.4068V4.06221C4.2928 3.62107 4.42395 3.27233 4.68625 3.01599C4.95451 2.75369 5.33008 2.62254 5.81295 2.62254H6.52831C8.10808 2.62254 9.55371 2.49139 10.8652 2.22909C12.1767 1.96679 13.5091 1.61507 14.8623 1.17393C15.0531 1.11431 15.2289 1.0696 15.3899 1.0398C15.5509 1.00403 15.6999 0.986145 15.837 0.986145C16.2305 0.986145 16.5345 1.09643 16.7491 1.317C16.9637 1.53161 17.071 1.85949 17.071 2.30063V16.5632C17.071 16.9567 17.0144 17.2607 16.9011 17.4753C16.7878 17.6899 16.5702 17.9164 16.2483 18.1549C15.837 18.4709 15.3124 18.7689 14.6745 19.0491C14.0426 19.3293 13.3273 19.5737 12.5284 19.7824C11.7356 19.997 10.8861 20.1609 9.97995 20.2742C9.07978 20.3874 8.15577 20.4381 7.20791 20.4262V20.3099C7.89347 20.4292 8.57008 20.5126 9.23776 20.5603C9.90543 20.608 10.585 20.6319 11.2765 20.6319C12.0634 20.6319 12.8533 20.5782 13.6462 20.4709C14.445 20.3696 15.2081 20.2205 15.9354 20.0238C16.6686 19.833 17.3303 19.6095 17.9205 19.3531C18.1768 19.2458 18.3378 19.1266 18.4034 18.9955C18.4749 18.8643 18.5107 18.6646 18.5107 18.3963V4.76864C18.5107 4.32153 18.314 4.09798 17.9205 4.09798H16.9011ZM5.73247 18.7361C5.73247 18.9388 5.83679 19.0461 6.04544 19.0581C7.09464 19.0998 8.06933 19.0849 8.9695 19.0133C9.86966 18.9478 10.6983 18.8315 11.4554 18.6646C12.2125 18.5036 12.8951 18.301 13.5031 18.0565C14.1112 17.8121 14.6477 17.5349 15.1127 17.2249C15.3392 17.0759 15.4823 16.9388 15.5419 16.8136C15.6015 16.6824 15.6313 16.4947 15.6313 16.2502V2.8908C15.6313 2.75369 15.5866 2.66427 15.4972 2.62254C15.4078 2.58081 15.2886 2.58379 15.1395 2.63148C13.8876 3.02494 12.5404 3.35877 11.0977 3.633C9.65505 3.90722 8.15279 4.04433 6.59091 4.04433H6.0991C5.85468 4.04433 5.73247 4.17846 5.73247 4.44672V18.7361ZM7.55665 6.40503C7.55665 6.26196 7.62819 6.18446 7.77126 6.17254C8.77873 6.13677 9.74448 6.02649 10.6685 5.84168C11.5985 5.65688 12.5255 5.39756 13.4495 5.06373C13.4972 5.03988 13.5568 5.04286 13.6283 5.07267C13.6998 5.10247 13.7356 5.16805 13.7356 5.26939V8.32758C13.7356 8.417 13.6939 8.48257 13.6104 8.5243C13.0739 8.73891 12.4867 8.92371 11.8488 9.07871C11.211 9.22774 10.5463 9.34399 9.85476 9.42745C9.16324 9.50495 8.46874 9.5437 7.77126 9.5437C7.62819 9.5437 7.55665 9.47514 7.55665 9.33803V6.40503Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path d="M16.1793 29.2992C14.3537 29.2992 12.6344 28.949 11.0215 28.2489C9.41744 27.5577 7.99948 26.6006 6.76761 25.3776C5.54463 24.1458 4.58307 22.7278 3.88296 21.1237C3.1917 19.5108 2.84607 17.7915 2.84607 15.9659C2.84607 14.1402 3.1917 12.4254 3.88296 10.8213C4.58307 9.20836 5.54463 7.7904 6.76761 6.56742C7.99061 5.33557 9.40414 4.374 11.0082 3.68275C12.6211 2.98263 14.3404 2.63257 16.166 2.63257C17.9918 2.63257 19.711 2.98263 21.3239 3.68275C22.9369 4.374 24.3548 5.33557 25.5778 6.56742C26.8008 7.7904 27.7623 9.20836 28.4625 10.8213C29.1626 12.4254 29.5127 14.1402 29.5127 15.9659C29.5127 17.7915 29.1626 19.5108 28.4625 21.1237C27.7623 22.7278 26.8008 24.1458 25.5778 25.3776C24.3548 26.6006 22.9369 27.5577 21.3239 28.2489C19.7199 28.949 18.0051 29.2992 16.1793 29.2992ZM16.1793 27.5843C17.7835 27.5843 19.2857 27.283 20.6858 26.6803C22.095 26.0777 23.3313 25.2446 24.3948 24.1812C25.4671 23.1178 26.3 21.8858 26.8939 20.4856C27.4966 19.0765 27.7979 17.5699 27.7979 15.9659C27.7979 14.3618 27.4966 12.8596 26.8939 11.4594C26.2913 10.0503 25.4582 8.814 24.3948 7.75052C23.3313 6.67819 22.095 5.84514 20.6858 5.25137C19.2857 4.64873 17.7791 4.34741 16.166 4.34741C14.562 4.34741 13.0554 4.64873 11.6463 5.25137C10.2461 5.84514 9.01421 6.67819 7.95073 7.75052C6.89613 8.814 6.06749 10.0503 5.46487 11.4594C4.8711 12.8596 4.57421 14.3618 4.57421 15.9659C4.57421 17.5699 4.8711 19.0765 5.46487 20.4856C6.06749 21.8858 6.90055 23.1178 7.96402 24.1812C9.02749 25.2446 10.2594 26.0777 11.6596 26.6803C13.0598 27.283 14.5664 27.5843 16.1793 27.5843Z" />
      <path d="M17.4454 14.5712C17.4454 13.9131 16.9119 13.3796 16.2538 13.3796C15.5958 13.3796 15.0623 13.9131 15.0623 14.5712V22.9505C15.0623 23.6086 15.5958 24.1421 16.2538 24.1421C16.9119 24.1421 17.4454 23.6086 17.4454 22.9505V14.5712Z" />
      <path d="M15.2211 10.4937C15.5046 10.7685 15.8458 10.9058 16.2446 10.9058C16.6523 10.9058 16.9935 10.7685 17.2683 10.4937C17.5519 10.2101 17.6936 9.86895 17.6936 9.47015C17.6936 9.06249 17.5519 8.71685 17.2683 8.43326C16.9935 8.14967 16.6523 8.00787 16.2446 8.00787C15.8458 8.00787 15.5046 8.14967 15.2211 8.43326C14.9375 8.71685 14.7957 9.06249 14.7957 9.47015C14.7957 9.86895 14.9375 10.2101 15.2211 10.4937Z" />
    </svg>
  );
}

function ProtocolIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path d="M6.67132 19.0664C6.39875 19.0664 6.18524 18.98 6.03078 18.8074C5.87633 18.6348 5.7991 18.3986 5.7991 18.0987V16.3407H4.94051C4.34541 16.3407 3.82526 16.2271 3.38006 16C2.93941 15.7683 2.59643 15.4367 2.35112 15.0051C2.10581 14.569 1.98315 14.0443 1.98315 13.431V7.0597C1.98315 6.44642 2.10808 5.91945 2.35794 5.4788C2.60779 5.03361 2.95758 4.69517 3.40732 4.46348C3.85706 4.22726 4.38175 4.10915 4.9814 4.10915H14.9234C15.5457 4.10915 16.0795 4.22726 16.5247 4.46348C16.9744 4.69517 17.3197 5.03361 17.5604 5.4788C17.8012 5.91945 17.9216 6.44642 17.9216 7.0597V8.05457H16.5792V7.2028C16.5792 6.60769 16.4179 6.15568 16.0954 5.84677C15.7774 5.53332 15.3322 5.37659 14.7598 5.37659H5.14494C4.57255 5.37659 4.12508 5.53332 3.80254 5.84677C3.48455 6.15568 3.32555 6.60769 3.32555 7.2028V13.2606C3.32555 13.8512 3.48455 14.3032 3.80254 14.6167C4.12508 14.9256 4.57255 15.08 5.14494 15.08H6.41919C6.58728 15.08 6.72583 15.1323 6.83486 15.2368C6.94843 15.3413 7.00521 15.4934 7.00521 15.6933V17.6013L9.87399 14.9301L10.6167 16.0408L7.85699 18.5008C7.62531 18.7007 7.41634 18.8438 7.23008 18.9301C7.04837 19.0209 6.86212 19.0664 6.67132 19.0664ZM17.9761 19.8909C17.7989 19.8909 17.624 19.8386 17.4514 19.7341C17.2788 19.6342 17.0789 19.4888 16.8518 19.298L14.5826 17.3492H12.259C11.6548 17.3492 11.1346 17.2356 10.6985 17.0085C10.2624 16.7859 9.92623 16.4656 9.69001 16.0477C9.45833 15.6252 9.34248 15.1187 9.34248 14.5281V10.3782C9.34248 9.77856 9.45833 9.26523 9.69001 8.8382C9.92623 8.41118 10.2624 8.0841 10.6985 7.85696C11.1346 7.62528 11.6548 7.50943 12.259 7.50943H19.1005C19.6819 7.50943 20.1907 7.62528 20.6268 7.85696C21.0629 8.0841 21.4037 8.41118 21.649 8.8382C21.8943 9.26523 22.0169 9.77856 22.0169 10.3782V14.5281C22.0169 15.1187 21.8965 15.6252 21.6558 16.0477C21.415 16.4656 21.0788 16.7859 20.6473 17.0085C20.2203 17.2356 19.7205 17.3492 19.1482 17.3492H18.8415V18.9096C18.8415 19.2094 18.7643 19.4479 18.6098 19.6251C18.4599 19.8023 18.2487 19.8909 17.9761 19.8909ZM17.6422 18.4258V16.7018C17.6422 16.5019 17.6967 16.352 17.8058 16.2521C17.9193 16.1476 18.0579 16.0954 18.2214 16.0954H18.9642C19.4957 16.0954 19.9159 15.9477 20.2248 15.6524C20.5337 15.3572 20.6882 14.9279 20.6882 14.3646V10.5009C20.6882 9.93756 20.5337 9.50826 20.2248 9.21298C19.9204 8.91316 19.5002 8.76325 18.9642 8.76325H12.4021C11.8615 8.76325 11.4367 8.91316 11.1278 9.21298C10.8234 9.50826 10.6713 9.93756 10.6713 10.5009L10.6644 14.3646C10.6644 14.9324 10.8189 15.364 11.1278 15.6593C11.4367 15.95 11.8615 16.0954 12.4021 16.0954H14.5554C14.7553 16.0954 14.9234 16.1272 15.0596 16.1908C15.2005 16.2498 15.3481 16.3475 15.5026 16.4838L17.6422 18.4258Z" />
    </svg>
  );
}

function SourceExplorerIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path d="M7.53637 6.35959V4.40185C7.53637 3.55349 7.74574 2.91451 8.16448 2.48489C8.58866 2.05528 9.22221 1.84047 10.0651 1.84047H13.1894C13.6298 1.84047 14.0241 1.90301 14.3722 2.02809C14.7202 2.14773 15.0383 2.3571 15.3266 2.6562L19.446 6.84087C19.7505 7.15628 19.9626 7.48801 20.0822 7.83606C20.2019 8.1841 20.2617 8.60828 20.2617 9.10859V15.7323C20.2617 16.5806 20.0496 17.2196 19.6254 17.6492C19.2067 18.0789 18.5759 18.2937 17.7329 18.2937H16.0525V16.9803H17.6595C18.0837 16.9803 18.4046 16.8716 18.6221 16.6541C18.8396 16.4311 18.9484 16.1157 18.9484 15.7078V8.73335H15.1308C14.6631 8.73335 14.3123 8.61915 14.0785 8.39075C13.8501 8.16235 13.7359 7.81158 13.7359 7.33846V3.15379H10.1304C9.7062 3.15379 9.38535 3.26527 9.16782 3.48824C8.95573 3.70576 8.84969 4.01846 8.84969 4.42632V6.35959H7.53637ZM14.9187 7.14269C14.9187 7.28952 14.9486 7.39556 15.0084 7.46082C15.0737 7.52064 15.177 7.55055 15.3184 7.55055H18.6058L14.9187 3.79821V7.14269ZM3.5801 19.8028V8.47232C3.5801 7.62397 3.78947 6.98498 4.20821 6.55537C4.63239 6.12575 5.26593 5.91094 6.10885 5.91094H8.98836C9.44517 5.91094 9.82312 5.95989 10.1222 6.05777C10.4213 6.15566 10.7259 6.36503 11.0358 6.68588L15.5305 11.2621C15.748 11.4851 15.9112 11.6972 16.0199 11.8984C16.1341 12.0941 16.2103 12.3117 16.2483 12.551C16.2864 12.7902 16.3054 13.0839 16.3054 13.4319V19.8028C16.3054 20.6511 16.0933 21.2901 15.6692 21.7197C15.2504 22.1493 14.6196 22.3641 13.7767 22.3641H6.10885C5.26593 22.3641 4.63239 22.1493 4.20821 21.7197C3.78947 21.2955 3.5801 20.6565 3.5801 19.8028ZM4.89342 19.7783C4.89342 20.1861 4.99946 20.4988 5.21155 20.7164C5.42908 20.9393 5.74721 21.0508 6.16595 21.0508H13.7114C14.1302 21.0508 14.4483 20.9393 14.6658 20.7164C14.8833 20.4988 14.9921 20.1861 14.9921 19.7783V13.4972H10.3833C9.8775 13.4972 9.49411 13.3694 9.23308 13.1138C8.97749 12.8582 8.84969 12.4721 8.84969 11.9555V7.22426H6.17411C5.74993 7.22426 5.42908 7.33574 5.21155 7.55871C4.99946 7.77624 4.89342 8.08621 4.89342 8.48864V19.7783ZM10.5382 12.2654H14.7392L10.0814 7.52608V11.8086C10.0814 11.9718 10.1168 12.0887 10.1875 12.1594C10.2582 12.2301 10.3751 12.2654 10.5382 12.2654Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path d="M3.3327 11.2971C3.3327 10.3303 3.51434 9.42505 3.87762 8.5813C4.24091 7.73169 4.74481 6.98462 5.38934 6.34009C6.03387 5.69556 6.77802 5.19165 7.62177 4.82837C8.47137 4.46509 9.37958 4.28345 10.3464 4.28345C11.3132 4.28345 12.2184 4.46509 13.0622 4.82837C13.9118 5.19165 14.6589 5.69556 15.3034 6.34009C15.9479 6.98462 16.4518 7.73169 16.8151 8.5813C17.1784 9.42505 17.36 10.3303 17.36 11.2971C17.36 12.0999 17.2311 12.8616 16.9733 13.5823C16.7214 14.303 16.3698 14.9563 15.9186 15.5422L20.2165 19.8665C20.3102 19.9602 20.3806 20.0686 20.4274 20.1917C20.4802 20.3147 20.5065 20.4465 20.5065 20.5872C20.5065 20.7805 20.4626 20.9563 20.3747 21.1145C20.2927 21.2727 20.1755 21.3958 20.0231 21.4836C19.8708 21.5774 19.695 21.6243 19.4958 21.6243C19.3552 21.6243 19.2204 21.5979 19.0915 21.5452C18.9684 21.4983 18.8542 21.425 18.7487 21.3254L14.4245 16.9924C13.8503 17.4026 13.2175 17.7249 12.5261 17.9592C11.8347 18.1936 11.1081 18.3108 10.3464 18.3108C9.37958 18.3108 8.47137 18.1292 7.62177 17.7659C6.77802 17.4026 6.03387 16.8987 5.38934 16.2542C4.74481 15.6096 4.24091 14.8655 3.87762 14.0217C3.51434 13.1721 3.3327 12.2639 3.3327 11.2971ZM4.83563 11.2971C4.83563 12.0588 4.97626 12.7737 5.25751 13.4417C5.54462 14.1038 5.94012 14.6868 6.44403 15.1907C6.9538 15.6946 7.53973 16.0901 8.20184 16.3772C8.86981 16.6643 9.58466 16.8079 10.3464 16.8079C11.1081 16.8079 11.82 16.6643 12.4821 16.3772C13.1501 16.0901 13.736 15.6946 14.2399 15.1907C14.7438 14.6868 15.1393 14.1038 15.4265 13.4417C15.7136 12.7737 15.8571 12.0588 15.8571 11.2971C15.8571 10.5354 15.7136 9.82349 15.4265 9.16138C15.1393 8.49341 14.7438 7.90747 14.2399 7.40356C13.736 6.8938 13.1501 6.49829 12.4821 6.21704C11.82 5.92993 11.1081 5.78638 10.3464 5.78638C9.58466 5.78638 8.86981 5.92993 8.20184 6.21704C7.53973 6.49829 6.9538 6.8938 6.44403 7.40356C5.94012 7.90747 5.54462 8.49341 5.25751 9.16138C4.97626 9.82349 4.83563 10.5354 4.83563 11.2971Z" />
    </svg>
  );
}

function PauseInfoIcon() {
  return (
    <svg
      width="32"
      height="33"
      viewBox="0 0 32 33"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      fill="currentColor"
    >
      <path d="M13.3277 22.2911C13.0187 22.2911 12.7596 22.2131 12.5504 22.0571C12.346 21.9047 12.2438 21.7143 12.2438 21.4857V13.6237C12.2438 13.3952 12.346 13.2047 12.5504 13.0524C12.7596 12.8964 13.0187 12.8184 13.3277 12.8184C13.6414 12.8184 13.9005 12.8964 14.1049 13.0524C14.314 13.2047 14.4186 13.3952 14.4186 13.6237V21.4857C14.4186 21.7143 14.314 21.9047 14.1049 22.0571C13.9005 22.2131 13.6414 22.2911 13.3277 22.2911ZM18.7183 22.2911C18.4093 22.2911 18.1503 22.2131 17.9411 22.0571C17.7366 21.9047 17.6344 21.7143 17.6344 21.4857V13.6237C17.6344 13.3952 17.7366 13.2047 17.9411 13.0524C18.1503 12.8964 18.4093 12.8184 18.7183 12.8184C19.0321 12.8184 19.2911 12.8964 19.4956 13.0524C19.7048 13.2047 19.8094 13.3952 19.8094 13.6237V21.4857C19.8094 21.7143 19.7048 21.9047 19.4956 22.0571C19.2911 22.2131 19.0321 22.2911 18.7183 22.2911Z" />
      <path d="M2.09096 17.099C2.09096 15.5058 2.35032 13.9867 2.86903 12.5417C3.38773 11.0968 4.11022 9.78146 5.03649 8.59584C5.97201 7.40095 7.06501 6.38669 8.31547 5.55305C8.5563 5.38633 8.80176 5.32612 9.05185 5.37243C9.30194 5.41875 9.49182 5.54842 9.6215 5.76146C9.75118 5.9745 9.7836 6.19681 9.71876 6.42837C9.66318 6.65994 9.52424 6.85909 9.30194 7.02582C8.21821 7.73904 7.26879 8.61436 6.45367 9.65178C5.64782 10.6799 5.01796 11.8285 4.56409 13.0975C4.11022 14.3572 3.88329 15.691 3.88329 17.099C3.88329 18.7755 4.19358 20.3501 4.81418 21.8229C5.44404 23.2957 6.31473 24.5878 7.42625 25.6993C8.53777 26.8016 9.82528 27.6676 11.2888 28.2975C12.7615 28.9274 14.3408 29.2423 16.0266 29.2423C17.7032 29.2423 19.2732 28.9274 20.7367 28.2975C22.2094 27.6676 23.5016 26.8016 24.6131 25.6993C25.7246 24.5878 26.5907 23.2957 27.2113 21.8229C27.8411 20.3501 28.1561 18.7755 28.1561 17.099C28.1561 15.6355 27.9152 14.2553 27.4336 12.9585C26.9612 11.6525 26.2896 10.4715 25.419 9.41558C24.5575 8.35964 23.5433 7.47506 22.3762 6.76183C21.2183 6.03934 19.954 5.5299 18.5831 5.23349V7.51211C18.5831 7.91966 18.4627 8.17439 18.2219 8.27627C17.981 8.37816 17.6985 8.31333 17.3743 8.08176L13.0672 5.05287C12.7893 4.85835 12.6504 4.64068 12.6504 4.39985C12.6504 4.14976 12.7893 3.93209 13.0672 3.74684L17.3882 0.717948C17.7124 0.495644 17.9903 0.435437 18.2219 0.537326C18.4627 0.639215 18.5831 0.893938 18.5831 1.3015V3.39949C20.1856 3.71442 21.6768 4.28407 23.057 5.10845C24.4371 5.92356 25.6413 6.94708 26.6694 8.17902C27.7068 9.40169 28.5127 10.7726 29.087 12.2916C29.6705 13.8107 29.9623 15.4132 29.9623 17.099C29.9623 19.0071 29.5964 20.804 28.8647 22.4898C28.1329 24.1664 27.1279 25.6438 25.8497 26.922C24.5714 28.2002 23.0894 29.2052 21.4036 29.937C19.7271 30.6687 17.9347 31.0346 16.0266 31.0346C14.1185 31.0346 12.3216 30.6687 10.6358 29.937C8.95922 29.2052 7.4772 28.2002 6.18969 26.922C4.91144 25.6438 3.90644 24.1664 3.17469 22.4898C2.45221 20.804 2.09096 19.0071 2.09096 17.099Z" />
    </svg>
  );
}

function ReactIcon() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Icon type="react" />
    </div>
  );
}

function ToolbarButtonTab({ active }: { active: boolean }) {
  return (
    <div
      className={classnames("absolute left-0 h-2/3 w-1 bg-primaryAccent", {
        invisible: !active,
      })}
      style={{
        borderRadius: "0 2px 2px 0",
        top: "50%",
        transform: "translateY(-49%)",
      }}
    />
  );
}

function ToolbarButton({
  icon,
  label,
  name,
  onClick,
  showBadge,
  showBadgeDimmed,
}: {
  icon: string;
  label: string;
  name: PrimaryPanelName;
  onClick: (name: PrimaryPanelName) => void;
  showBadge?: boolean;
  showBadgeDimmed?: boolean;
}) {
  const selectedPrimaryPanel = useAppSelector(selectors.getSelectedPrimaryPanel);
  const isActive = selectedPrimaryPanel == name;

  let iconContents: string | JSX.Element = icon;

  switch (icon) {
    case "info": {
      iconContents = <InfoIcon />;
      break;
    }
    case "cypress": {
      iconContents = <CypressIcon />;
      break;
    }
    case "playwright": {
      iconContents = <PlaywrightIcon />;
      break;
    }

    case "tour": {
      iconContents = <TourIcon />;
      break;
    }

    case "passport": {
      iconContents = <PassportIcon />;
      break;
    }

    case "protocol": {
      iconContents = <ProtocolIcon />;
      break;
    }

    case "forum": {
      iconContents = <CommentIcon />;
      break;
    }

    case "motion_photos_paused": {
      iconContents = <PauseInfoIcon />;
      break;
    }

    case "description": {
      iconContents = <SourceExplorerIcon />;
      break;
    }

    case "search": {
      iconContents = <SearchIcon />;
      break;
    }

    case "react": {
      iconContents = <ReactIcon />;
      break;
    }
    default:
      break;
  }

  const imageIcon = (
    <MaterialIcon className={classNames("toolbar-panel-icon", name, styles.MaterialIcon)}>
      {iconContents}
    </MaterialIcon>
  );

  return (
    <div className="relative px-2">
      <ToolbarButtonTab active={isActive} />
      <div
        className={classnames("toolbar-panel-button", name, {
          active: isActive,
        })}
      >
        <IconWithTooltip
          icon={imageIcon}
          content={label}
          dataTestName={`ToolbarButton-${label.replace(/ /g, "")}`}
          onClick={() => onClick(name)}
        />
      </div>
      {showBadge ? (
        <div
          className={classnames("toolbar-panel-badge", { dimmed: showBadgeDimmed })}
          style={{
            // FE-1096 Aiming for pixel perfect badge alignment over icons with inconsistent shapes
            right: name === "comments" ? ".7rem" : ".8em",
            top: name === "debugger" ? ".5em" : "0.5em",
          }}
        />
      ) : null}
    </div>
  );
}

export default function Toolbar() {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const pauseId = useAppSelector(getPauseId);
  const hasPausePreviewLocation = !!useAppSelector(getPausePreviewLocation);
  const { status: framesStatus, value: frames } = useImperativeCacheValue(
    framesCache,
    replayClient,
    pauseId
  );
  const hasFrames = framesStatus === "resolved" && frames && frames.length > 0;
  const viewMode = useAppSelector(selectors.getViewMode);
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);

  const [showCommentsBadge, setShowCommentsBadge] = useState(false);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { comments, loading } = hooks.useGetComments(recordingId);
  const [protocolPanelExperimentEnabled] = useGraphQLUserData("feature_protocolPanel");
  const [reactPanelExperimentEnabled] = useGraphQLUserData("feature_reactPanel");
  const [showPassport] = useGraphQLUserData("feature_showPassport");
  const { nags } = hooks.useGetUserInfo();
  const showTour = shouldShowTour(nags);

  const [sidePanelCollapsed, setSidePanelCollapsed] = useGraphQLUserData(
    "layout_sidePanelCollapsed"
  );

  useEffect(() => {
    if (!loading && comments.length > 0) {
      setShowCommentsBadge(true);
    }
  }, [loading, comments.length]);

  useEffect(() => {
    if (selectedPrimaryPanel === "comments" && showCommentsBadge) {
      setShowCommentsBadge(false);
    }
  }, [selectedPrimaryPanel, showCommentsBadge]);

  const togglePanel = () => {
    setSidePanelCollapsed(!sidePanelCollapsed);
  };

  const handleButtonClick = (panelName: PrimaryPanelName) => {
    const samePanelSelected = selectedPrimaryPanel === panelName;
    const shouldTogglePanel = sidePanelCollapsed || samePanelSelected;

    if (!samePanelSelected) {
      trackEvent(`toolbox.primary.${panelName}_select`);
      dispatch(actions.setSelectedPrimaryPanel(panelName));
    }

    if (shouldTogglePanel) {
      trackEvent(`toolbox.toggle_sidebar`);
      togglePanel();
    }
  };

  let testRunner = null;
  if (recording && isTestSuiteReplay(recording)) {
    const testMetadata = recording.metadata?.test;
    if (testMetadata && !isGroupedTestCasesV1(testMetadata)) {
      testRunner = testMetadata.environment.testRunner.name;
    }
  }

  return (
    <div className={styles.toolboxToolbarContainer}>
      <div className={styles.toolboxToolbar}>
        {showTour ? (
          <ToolbarButton icon="tour" name="tour" label="Replay Tour" onClick={handleButtonClick} />
        ) : null}
        {showPassport ? (
          <ToolbarButton
            icon="passport"
            name="passport"
            label="Replay Passport"
            onClick={handleButtonClick}
          />
        ) : null}
        {testRunner !== null ? (
          testRunner === "cypress" ? (
            <ToolbarButton
              icon="cypress"
              label="Cypress Panel"
              name="cypress"
              onClick={handleButtonClick}
            />
          ) : (
            <ToolbarButton
              icon="playwright"
              label="Test Info"
              name="cypress"
              onClick={handleButtonClick}
            />
          )
        ) : (
          <ToolbarButton
            icon="info"
            label="Replay Info"
            name="events"
            onClick={handleButtonClick}
          />
        )}
        <ToolbarButton
          icon="forum"
          label="Comments"
          name="comments"
          showBadge={showCommentsBadge}
          onClick={handleButtonClick}
        />
        {viewMode == "dev" ? (
          <>
            <ToolbarButton
              icon="description"
              name="explorer"
              label="Source Explorer"
              onClick={handleButtonClick}
            />
            <ToolbarButton icon="search" name="search" label="Search" onClick={handleButtonClick} />
            <ToolbarButton
              icon="motion_photos_paused"
              name="debugger"
              label="Pause Information"
              showBadge={hasFrames || hasPausePreviewLocation}
              showBadgeDimmed={hasPausePreviewLocation}
              onClick={handleButtonClick}
            />
            {reactPanelExperimentEnabled && (
              <ToolbarButton icon="react" name="react" label="React" onClick={handleButtonClick} />
            )}
          </>
        ) : null}
        {protocolPanelExperimentEnabled ? (
          <ToolbarButton
            icon="protocol"
            label="Protocol"
            name="protocol"
            onClick={handleButtonClick}
          />
        ) : null}

        <div className="flex-grow"></div>
      </div>

      <div className="relative px-2">
        <div className="toolbar-panel-button">
          <IconWithTooltip
            icon={
              <MaterialIcon
                className="toolbar-panel-icon text-themeToolbarPanelIconColor"
                iconSize="2xl"
              >
                {sidePanelCollapsed ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}
              </MaterialIcon>
            }
            content={sidePanelCollapsed ? "Expand side panel" : "Collapse side panel"}
            dataTestName={`ToolbarButton-ExpandSidePanel`}
            onClick={togglePanel}
          />
        </div>
      </div>
    </div>
  );
}
