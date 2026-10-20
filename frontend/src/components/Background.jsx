export function Background() {
  return (
    <div aria-hidden="true">
      <div className="gradient-container">
        <div className="gradient-orb gradient-orb-blue" />
        <div className="gradient-orb gradient-orb-red" />
        <div className="gradient-orb gradient-orb-indigo" />
        <div className="gradient-wave gradient-wave-one" />
        <div className="gradient-wave gradient-wave-two" />
        <div className="gradient-mesh" />
      </div>
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />
    </div>
  );
}
