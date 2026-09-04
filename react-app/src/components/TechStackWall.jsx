import {
  siBlender,
  siCss,
  siDocker,
  siFigma,
  siGit,
  siGnubash,
  siGreensock,
  siHtml5,
  siJavascript,
  siLaravel,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPhp,
  siPostgresql,
  siPython,
  siReact,
  siSupabase,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siWebgl,
} from "simple-icons";
import DriftWall from "./DriftWall.jsx";

const techStack = [
  siHtml5,
  siCss,
  siJavascript,
  siTypescript,
  siReact,
  siNextdotjs,
  siTailwindcss,
  siFigma,
  siNodedotjs,
  siPython,
  { ...siOpenjdk, title: "Java" },
  siPhp,
  siLaravel,
  siMysql,
  siPostgresql,
  siMongodb,
  siSupabase,
  { ...siGreensock, title: "GSAP" },
  { title: "Lenis", shortTitle: "LENIS", hex: "D5001C" },
  { ...siThreedotjs, title: "Three.js" },
  siWebgl,
  siBlender,
  siGit,
  siDocker,
  { ...siGnubash, title: "Bash" },
].map((icon) => ({
  title: icon.title,
  shortTitle: icon.shortTitle,
  hex: icon.hex,
  icon: icon.path ? icon : null,
}));

export default function TechStackWall() {
  return (
    <div className="tech-stack-wall" data-reveal>
      <DriftWall
        items={techStack}
        columns={5}
        tileWidth={164}
        tileHeight={112}
        gap={13}
        tilt={11}
        turn={0}
        perspective={1100}
        depth={16}
        speed={28}
        direction="up"
        variance={0.42}
        parallax={0.65}
        lift={52}
        fade={0.18}
        dim={0.7}
        radius={16}
        roll={1.5}
        pauseOnHover={false}
      />
    </div>
  );
}
