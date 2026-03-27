import { useQuery } from "@tanstack/react-query";

export type Branding = {
  schoolName: string;
  schoolSubtitle: string;
  logoUrl: string | null;
  landingBgUrl: string | null;
};

export function useBranding() {
  const { data } = useQuery<Branding>({
    queryKey: ["/api/branding"],
    staleTime: 1000 * 60 * 5,
  });

  return {
    schoolName: data?.schoolName ?? "MTs Al Fatah Talun",
    schoolSubtitle: data?.schoolSubtitle ?? "Sistem Absensi Digital",
    logoUrl: data?.logoUrl ?? null,
    landingBgUrl: data?.landingBgUrl ?? null,
  };
}
