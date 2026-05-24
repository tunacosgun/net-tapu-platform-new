import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPasswordClient from './reset-password-client';

export const metadata: Metadata = {
  title: 'Şifre Sıfırla — NetTapu',
  description: 'Yeni şifrenizi belirleyin.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
