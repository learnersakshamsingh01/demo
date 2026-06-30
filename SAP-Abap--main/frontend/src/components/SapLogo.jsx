export function SapLogo({ size = "md", className = "" }) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };
  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="sap-copilot-logo">
      <span className={`font-heading font-black tracking-tighter text-[#008FD3] ${sizes[size]}`}>SAP</span>
      <span className={`font-heading font-light tracking-tight text-gray-900 ${sizes[size]}`}>Copilot</span>
    </div>
  );
}
