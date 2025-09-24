import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard as the new homepage
  redirect('/dashboard');
}