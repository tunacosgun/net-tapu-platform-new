import type { Metadata } from 'next';
import ForgotPasswordClient from './forgot-password-client';

export const metadata: Metadata = {
  title: 'Şifremi Unuttum — NetTapu',
  description: 'Şifrenizi sıfırlamak için e-posta adresinizi girin.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
