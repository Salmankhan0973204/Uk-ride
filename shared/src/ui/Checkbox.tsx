type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type' | 'className'> & {
  /** The words beside the box. The whole row is the click target. */
  children: React.ReactNode;
};

/**
 * A checkbox drawn in the glass style: a 20px rounded square that fills with
 * Focus Lavender and shows a dark tick when checked (DESIGN.md, "Checkbox").
 * The label wraps the box, so the 44px row is the target, not just the box.
 */
export function Checkbox({ children, ...props }: CheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input
        {...props}
        type="checkbox"
        className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-ink-muted bg-transparent bg-center bg-no-repeat transition-colors duration-150 checked:border-ring checked:bg-ring checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%231b164a%22%20stroke-width=%223.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><path%20d=%22M5%2012.5l4.5%204.5L19%207.5%22/></svg>')]"
      />
      <span>{children}</span>
    </label>
  );
}
