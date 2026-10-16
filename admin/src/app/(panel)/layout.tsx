import { PanelShell } from '@/components/layout/PanelShell';

/**
 * Every page in the (panel) group goes through the staff check and gets the
 * sidebar. A new admin page cannot forget the check: it lives here.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
