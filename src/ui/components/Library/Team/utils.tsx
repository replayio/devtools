import { useRouter } from "next/router";

export function useRedirectToTeam(replace: boolean = false) {
  const router = useRouter();

  return (id?: string) => {
    const url = `/team/${id}`;
    replace ? router.replace(url) : router.push(url);
  };
}
