type Props = {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "danger";
  onClick?: () => void;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
}: Props) {
  const style = {
    primary: "bg-primary text-white",
    accent: "bg-accent text-white",
    danger: "bg-danger text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`${style[variant]} px-4 py-2 rounded`}
    >
      {children}
    </button>
  );
}
