'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PageContentRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/pages'); }, [router]);
  return null;
}
