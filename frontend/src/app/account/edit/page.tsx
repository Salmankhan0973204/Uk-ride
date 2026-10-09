import type { Metadata } from 'next';
import { EditProfileForm } from '@/features/profile/components/EditProfileForm';

export const metadata: Metadata = {
  title: 'Edit your profile',
  description: 'Change the name, mobile number or gender on your UkRide profile.',
};

export default function EditProfilePage() {
  return (
    <div className="pt-2 sm:pt-6">
      <EditProfileForm />
    </div>
  );
}
