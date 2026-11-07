import { Link } from "react-router";
import { cn } from "@wron/kit";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[16px] leading-none whitespace-nowrap disabled:opacity-60 disabled:pointer-events-none";

const variants = {
  primary: "bg-primary text-primary-ink hover:bg-[#0B6545]",
  outline: "border border-line bg-bg text-ink hover:border-primary hover:text-primary",
  soft: "bg-surface text-ink hover:bg-[#E5EFE9]",
  ghost: "text-ink hover:bg-surface",
};

const sizes = {
  sm: "h-11 px-5",
  md: "h-12 px-6",
  lg: "h-14 px-8",
};

// <Button onClick>, <Button to="/privacy">, <Button href="tel:...">
export default function Button({ variant = "primary", size = "md", to, href, className, children, ...rest }) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
