export const Illustration = ({ name, alt, width }) => {
  const style = { width: "100%", maxWidth: width ? `${width}px` : undefined, margin: "24px auto" };
  return (
    <>
      <img src={`/images/illustrations/${name}.animated.svg`} alt={alt} className="block dark:hidden" style={style} />
      <img src={`/images/illustrations/${name}-dark.animated.svg`} alt={alt} className="hidden dark:block" style={style} />
    </>
  );
};
