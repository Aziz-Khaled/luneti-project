"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export function HomeRedirect() {
  const { user, loading, portal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? `/${portal}/dashboard` : "/login");
  }, [loading, portal, router, user]);

  return <main className="center-page"><p>{loading ? "Vérification de votre session…" : "Ouverture de Lunetty…"}</p></main>;
}
