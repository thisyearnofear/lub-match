"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface NavigationOptions {
  replace?: boolean;
  scroll?: boolean;
}

export const useAppNavigation = () => {
  const router = useRouter();

  const goHome = useCallback((options?: NavigationOptions) => {
    if (options?.replace) {
      router.replace('/');
    } else {
      router.push('/');
    }
  }, [router]);

  const goToCreate = useCallback((options?: NavigationOptions) => {
    if (options?.replace) {
      router.replace('/create');
    } else {
      router.push('/create');
    }
  }, [router]);

  const goToGame = useCallback((cid: string, created = false, options?: NavigationOptions) => {
    const url = `/game/${cid}${created ? '?created=1' : ''}`;
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);

  const goToSocialGames = useCallback((options?: NavigationOptions) => {
    const url = '/?social=true';
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);

  const goToAnalytics = useCallback((options?: NavigationOptions) => {
    if (options?.replace) {
      router.replace('/analytics');
    } else {
      router.push('/analytics');
    }
  }, [router]);

  // For external navigation (fallback when router isn't available)
  const navigateExternal = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  return {
    goHome,
    goToCreate,
    goToGame,
    goToSocialGames,
    goToAnalytics,
    navigateExternal,
    router
  };
};