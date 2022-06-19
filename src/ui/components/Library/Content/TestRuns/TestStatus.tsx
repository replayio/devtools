function Pill({ styles, value }: { styles: string; value: number }) {
  return (
    <div
      className={`flex h-[1.2rem]  min-w-[1.5rem] items-center justify-center rounded-md px-1 text-[0.6rem] font-semibold ${styles}`}
    >
      {value}
    </div>
  );
}
export function TestStatus({ testRun }: { testRun: any }) {
  const failCount = testRun.recordings.filter(r => r.metadata.test?.result !== "passed").length;
  const passCount = testRun.recordings.filter(r => r.metadata.test?.result === "passed").length;

  if (failCount > 0) {
    const bgColor = failCount < 10 ? "bg-red-200 text-red-500 " : "text-red-50 bg-red-500";
    return (
      <div className={`flex`}>
        <Pill styles={` ${bgColor}`} value={failCount} />
      </div>
    );
  }
  return (
    <div className={`flex ${failCount > 0 ? "text-red-500" : "text-green-600"} `}>
      <Pill styles={`bg-green-400 text-green-50`} value={passCount} />
    </div>
  );
}
