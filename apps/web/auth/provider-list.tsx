"use client";

import { useEffect, useState } from "react";
import { getProviders } from "next-auth/react";
import { LoginForm } from "./login-form";

export default function ProviderList() {
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    const loadProviders = async () => {
      const res = await getProviders();
      if (res) {
        const providersArray = Object.values(res);
        setProviders(
          providersArray.map((provider: any) => ({
            id: provider.id,
            name: provider.name,
          }))
        );
      }
    };
    loadProviders();
  }, []);

  return <LoginForm providers={providers} />;
}
