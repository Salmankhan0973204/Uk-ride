import { redirect } from 'next/navigation';

/** /admin has no page of its own: it opens the fleet. */
export default function AdminPage() {
  redirect('/admin/vehicles');
}
