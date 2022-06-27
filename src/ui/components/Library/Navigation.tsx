import Link from "next/link";
import { useRouter } from "next/router";
import { TEAMS } from "./LibraryNew";

export default function Navigation() {
  const router = useRouter();
  return (
    <div className="flex flex-col w-40 p-4 space-y-2 bg-gray-100">
      <Link href={`/`}>Home</Link>
      <div className="flex flex-col">
        <Link href={`/new-team/me/recordings`}>
          <a className={router.asPath.includes(`/new-team/me`) ? "font-bold" : ""}>Your Library</a>
        </Link>
        {TEAMS.map((t, i) => (
          <Team name={t.name} isTest={t.isTest} key={i} />
        ))}
      </div>
    </div>
  );
}

function Team({ name, isTest }: { name: string; isTest: boolean }) {
  const router = useRouter();

  const basePath = `/new-team/${name}`;
  const url = `${basePath}/${isTest ? "runs" : "recordings"}`;
  const highlighted = router.asPath.includes(basePath);

  return (
    <Link href={url}>
      <a className={highlighted ? "font-bold" : ""}>
        <span>{name}</span>
        <span>{isTest && "(test)"}</span>
      </a>
    </Link>
  );
}
