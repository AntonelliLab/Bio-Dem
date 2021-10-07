import logo from "../logo.svg";

export default function BioDemLogo({ className = "logo", alt = "logo" }) {
  return <img src={logo} className={className} alt={alt} />;
}
