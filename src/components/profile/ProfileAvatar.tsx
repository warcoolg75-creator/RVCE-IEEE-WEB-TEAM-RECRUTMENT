import { getInitials } from "@/utils/avatarColor";

/** Circular avatar showing the user's initials on a deterministic color. */
export function ProfileAvatar({
  name,
  color,
  size = 36,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ background: color, width: size, height: size, fontSize: size * 0.4 }}
      className="grid shrink-0 place-items-center rounded-full font-bold leading-none text-white"
    >
      {getInitials(name)}
    </span>
  );
}
