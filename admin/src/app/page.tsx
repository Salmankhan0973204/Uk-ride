import { redirect } from 'next/navigation';

/** The admin panel opens on the fleet. */
export default function AdminHomePage() {
  redirect('/vehicles');
}
