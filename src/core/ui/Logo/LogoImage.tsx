const LogoImage: React.FCC<{
  className?: string;
}> = ({ className }) => {
  return (
    <span
      className={`${className ?? 'text-2xl'} font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent`}
    >
      DeckCheck
    </span>
  );
};

export default LogoImage;
